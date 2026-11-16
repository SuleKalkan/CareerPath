import { randomUUID } from "node:crypto";
import { basename } from "node:path";
import { Readable } from "node:stream";
import dotenv from "dotenv";
import express from "express";
import { Prisma, PrismaClient } from "@prisma/client";
import {
  findCatalogMatch,
  isCompletedGrade,
  isDuplicateCourse,
  makeDeduplicationKey,
  parseCourseCsv,
} from "./course-extraction.js";
import { parseCoursePdf } from "./pdf-course-extraction.js";

dotenv.config({ path: ".env.local" });
dotenv.config();

const app = express();
const prisma = new PrismaClient();
const host = process.env.API_HOST || "127.0.0.1";
const port = Number(process.env.API_PORT || 3001);
const demoUserId = process.env.DEMO_USER_ID || "10000000-0000-4000-8000-000000000002";
const categoryMap = {
  SKILL: "Skill",
  COURSE: "Course",
  PROJECT: "Project",
  CAREER_PREP: "Career prep",
  NETWORKING: "Networking",
  TRANSFER_CREDIT: "Transfer credit",
  OTHER: "Other",
};
const categoryToEnum = Object.fromEntries(
  Object.entries(categoryMap).map(([key, value]) => [value.toLowerCase(), key]),
);
const statusMap = {
  NOT_STARTED: "Not started",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
};
const typeMap = {
  INTERNSHIP: "Internship",
  CO_OP: "Co-op",
  ENTRY_LEVEL: "Entry level",
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
  OTHER: "Other",
};
const maxFileSize = 10 * 1024 * 1024;
const maxMultipartOverhead = 128 * 1024;
const acceptedCsvMediaTypes = new Set(["", "text/csv", "text/plain", "application/vnd.ms-excel"]);
const acceptedPdfMediaTypes = new Set(["", "application/pdf"]);

if (process.env.NODE_ENV === "production") {
  throw new Error("This demo API has no authentication and must not run in production.");
}
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("API_PORT must be a valid TCP port.");
}
if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(demoUserId)) {
  throw new Error("DEMO_USER_ID must be a UUID.");
}

app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function normalize(value) {
  return value.trim().toLocaleLowerCase("en-US");
}

function relativePostedDate(date) {
  const days = Math.max(0, Math.floor((Date.now() - date.getTime()) / 86_400_000));
  if (days === 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
}

function logoForEmployer(name) {
  const normalized = name.toLowerCase();
  if (normalized.includes("bank of america")) return ["B", "logo-red"];
  if (normalized.includes("lowe")) return ["L", "logo-blue"];
  if (normalized.includes("duke energy")) return ["D", "logo-teal"];
  if (normalized.includes("red ventures")) return ["R", "logo-orange"];
  return [name.slice(0, 1).toUpperCase(), "logo-blue"];
}

function mapActivity(activity) {
  return {
    id: activity.id,
    title: activity.title,
    category: categoryMap[activity.category],
    duration: activity.duration,
    status: statusMap[activity.status],
    description: activity.description,
    ...(activity.skill ? { skill: activity.skill.name } : {}),
  };
}

function mapExtractedCourse(course) {
  return {
    id: course.id,
    courseCode: course.courseCode,
    courseTitle: course.courseTitle,
    grade: course.grade,
    creditHours: course.creditHours === null ? null : Number(course.creditHours),
    institutionName: course.institutionName,
    term: course.term,
    reviewStatus: course.reviewStatus,
    reviewNote: course.reviewNote,
    recognizedCourse: course.recognizedCourse
      ? {
          id: course.recognizedCourse.id,
          courseCode: course.recognizedCourse.courseCode,
          title: course.recognizedCourse.title,
          institutionName: course.recognizedCourse.institutionName,
        }
      : null,
  };
}

function mapCourseImport(courseImport) {
  const encodedSize = Number(courseImport.storageKey.split(":").pop());
  return {
    id: courseImport.id,
    fileName: courseImport.fileName,
    mediaType: courseImport.mediaType,
    size: Number.isFinite(encodedSize) ? encodedSize : 0,
    status: courseImport.status,
    errorMessage: courseImport.errorMessage,
    extractedCourses: courseImport.extractedCourses.map(mapExtractedCourse),
  };
}

function validateConfirmedCourse(course) {
  if (!course || typeof course !== "object" || typeof course.id !== "string") {
    throw httpError(400, "Each selected course must include its extracted course ID.");
  }
  if (course.courseCode !== null && course.courseCode !== undefined && typeof course.courseCode !== "string") {
    throw httpError(400, "Course code must be a string.");
  }
  if (course.courseTitle !== null && course.courseTitle !== undefined && typeof course.courseTitle !== "string") {
    throw httpError(400, "Course name must be a string.");
  }
  if (course.grade !== null && course.grade !== undefined && typeof course.grade !== "string") {
    throw httpError(400, "Grade must be a string.");
  }
  if (course.creditHours !== null && course.creditHours !== undefined && typeof course.creditHours !== "number") {
    throw httpError(400, "Credit hours must be a number.");
  }
  const courseCode = typeof course.courseCode === "string" ? course.courseCode.trim() : "";
  const courseTitle = typeof course.courseTitle === "string" ? course.courseTitle.trim() : "";
  const grade = typeof course.grade === "string" ? course.grade.trim().toUpperCase() : "";
  const creditHours = course.creditHours === null || course.creditHours === undefined
    ? null
    : Number(course.creditHours);

  if (!courseTitle || courseTitle.length > 200) {
    throw httpError(400, "Course name is required and must be 200 characters or fewer.");
  }
  if (courseCode.length > 80) throw httpError(400, "Course code must be 80 characters or fewer.");
  if (!isCompletedGrade(grade)) {
    throw httpError(400, `Grade "${grade || "(missing)"}" is not recognized as completed coursework.`);
  }
  if (
    creditHours !== null
    && (!Number.isFinite(creditHours) || creditHours < 0 || creditHours > 999.9 || Math.round(creditHours * 10) !== creditHours * 10)
  ) {
    throw httpError(400, "Credit hours must be between 0 and 999.9 with at most one decimal place.");
  }

  return { courseCode: courseCode || null, courseTitle, grade, creditHours };
}

async function readCourseUpload(request) {
  const contentType = request.headers["content-type"] || "";
  if (!/^multipart\/form-data\s*;/i.test(contentType)) {
    throw httpError(415, "Upload a CSV or PDF file using multipart form data.");
  }

  const contentLength = Number(request.headers["content-length"]);
  if (Number.isFinite(contentLength) && contentLength > maxFileSize + maxMultipartOverhead) {
    throw httpError(413, "Files must be 10 MB or smaller.");
  }

  let totalBytes = 0;
  const boundedBody = Readable.from((async function* () {
    for await (const chunk of request) {
      totalBytes += chunk.length;
      if (totalBytes > maxFileSize + maxMultipartOverhead) {
        throw httpError(413, "Files must be 10 MB or smaller.");
      }
      yield chunk;
    }
  })());

  let formData;
  try {
    const body = Readable.toWeb(boundedBody);
    const formRequest = new Request("http://careerpath.local/upload", {
      method: "POST",
      headers: { "content-type": contentType },
      body,
      duplex: "half",
    });
    formData = await formRequest.formData();
  } catch (error) {
    if (error && Number.isInteger(error.status)) throw error;
    throw httpError(400, "The multipart upload is malformed. Choose a CSV or PDF file and try again.");
  }

  const entries = [...formData.entries()];
  if (entries.length !== 1 || entries[0][0] !== "file" || !(entries[0][1] instanceof File)) {
    throw httpError(400, "Attach one CSV or PDF file in the 'file' field.");
  }
  const file = entries[0][1];
  const fileName = basename(file.name.replace(/\\/g, "/"));
  const mediaType = file.type.toLowerCase();
  if (!fileName || fileName.length > 255) {
    throw httpError(415, "The course file name is invalid.");
  }
  const extension = fileName.toLowerCase().slice(fileName.lastIndexOf("."));
  if (extension !== ".csv" && extension !== ".pdf") {
    throw httpError(415, "Only CSV and PDF course files can be extracted.");
  }
  if (extension === ".csv" && !acceptedCsvMediaTypes.has(mediaType)) {
    throw httpError(415, "The file must be a CSV document.");
  }
  if (extension === ".pdf" && !acceptedPdfMediaTypes.has(mediaType)) {
    throw httpError(415, "The file must be a PDF document.");
  }
  if (!file.size) throw httpError(400, "The uploaded file is empty.");
  if (file.size > maxFileSize) throw httpError(413, "Files must be 10 MB or smaller.");

  return {
    fileName,
    mediaType: mediaType || (extension === ".pdf" ? "application/pdf" : "text/csv"),
    format: extension.slice(1),
    size: file.size,
    content: Buffer.from(await file.arrayBuffer()),
  };
}

async function getDemoContext() {
  const user = await prisma.user.findUnique({
    where: { id: demoUserId },
    include: {
      profile: {
        include: {
          targetCareer: {
            include: { careerSkills: { include: { skill: true } } },
          },
        },
      },
      skills: { include: { skill: true } },
      savedJobs: { select: { jobId: true } },
      courses: {
        where: { completionStatus: "COMPLETED" },
        orderBy: { createdAt: "desc" },
        include: { course: true },
      },
      courseImports: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          extractedCourses: {
            orderBy: { createdAt: "asc" },
            include: { recognizedCourse: true },
          },
        },
      },
    },
  });
  if (!user) {
    throw httpError(503, "Demo user not found. Apply the Prisma migration and seed data first.");
  }
  const careerId = user.profile?.targetCareerId;
  const roadmap = careerId
    ? await prisma.roadmap.findUnique({
        where: { userId_careerId: { userId: user.id, careerId } },
        include: {
          activities: {
            orderBy: [{ position: "asc" }, { createdAt: "asc" }],
            include: { skill: true },
          },
        },
      })
    : null;
  return { user, roadmap, activities: roadmap?.activities || [] };
}

async function buildBootstrap() {
  const { user, roadmap, activities } = await getDemoContext();
  const acquired = new Set([
    ...user.skills.map(({ skill }) => skill.normalizedName),
    ...activities
      .filter((activity) => activity.category === "SKILL" && activity.status === "COMPLETED" && activity.skill)
      .map((activity) => activity.skill.normalizedName),
  ]);
  const jobs = await prisma.jobOpportunity.findMany({
    where: { status: "ACTIVE" },
    orderBy: [{ postedAt: "desc" }, { createdAt: "desc" }],
    include: {
      employer: true,
      skills: { where: { isRequired: true }, include: { skill: true } },
    },
  });
  const savedIds = new Set(user.savedJobs.map(({ jobId }) => jobId));

  return {
    user: {
      id: user.id,
      displayName: user.displayName,
      career: user.profile?.targetCareer?.title || null,
    },
    profileSkills: user.skills.map(({ skill }) => skill.name),
    savedJobIds: [...savedIds],
    careerSkills: (user.profile?.targetCareer?.careerSkills || [])
      .map(({ skill }) => skill.name)
      .sort((a, b) => a.localeCompare(b)),
    roadmap: activities.map(mapActivity),
    courseImport: user.courseImports[0] ? mapCourseImport(user.courseImports[0]) : null,
    completedCourses: user.courses.map((course) => ({
      id: course.id,
      courseCode: course.courseCode,
      courseTitle: course.courseTitle,
      grade: course.grade,
      creditHours: course.credits === null ? null : Number(course.credits),
      institutionName: course.institutionName,
      term: course.term,
    })),
    jobs: jobs.map((job) => {
      const requiredSkills = job.skills
        .map(({ skill }) => skill)
        .sort((a, b) => a.name.localeCompare(b.name));
      const skills = requiredSkills.filter((skill) => acquired.has(skill.normalizedName)).map((skill) => skill.name);
      const [logo, logoClass] = logoForEmployer(job.employer.name);
      return {
        id: job.id,
        title: job.title,
        company: job.employer.name.replace(/\s*\(Demo\)$/i, ""),
        location: job.location,
        type: typeMap[job.type],
        posted: relativePostedDate(job.postedAt),
        logo,
        logoClass,
        requiredSkills: requiredSkills.map((skill) => skill.name),
        description: job.description,
        skills,
        missing: requiredSkills.filter((skill) => !acquired.has(skill.normalizedName)).map((skill) => skill.name),
        match: requiredSkills.length ? Math.round((skills.length / requiredSkills.length) * 100) : 0,
      };
    }),
  };
}

app.get("/api/health", async (_request, response) => {
  await prisma.$queryRaw`SELECT 1`;
  response.json({ status: "ok" });
});

app.get("/api/bootstrap", async (_request, response) => {
  response.json(await buildBootstrap());
});

app.post("/api/jobs/:jobId/saved", async (request, response) => {
  const { user } = await getDemoContext();
  const job = await prisma.jobOpportunity.findFirst({
    where: { id: request.params.jobId, status: "ACTIVE" },
    select: { id: true },
  });
  if (!job) throw httpError(404, "Active job not found.");
  await prisma.savedJob.upsert({
    where: { userId_jobId: { userId: user.id, jobId: job.id } },
    create: { userId: user.id, jobId: job.id },
    update: {},
  });
  response.status(204).end();
});

app.delete("/api/jobs/:jobId/saved", async (request, response) => {
  const { user } = await getDemoContext();
  await prisma.savedJob.deleteMany({ where: { userId: user.id, jobId: request.params.jobId } });
  response.status(204).end();
});

app.post("/api/roadmap/activities", async (request, response) => {
  const { roadmap } = await getDemoContext();
  if (!roadmap) throw httpError(409, "Set a target career before editing a roadmap.");
  const { title, category, duration = "Flexible", description, skill } = request.body || {};
  if (typeof title !== "string" || !title.trim() || title.trim().length > 100) {
    throw httpError(400, "title is required and must be 100 characters or fewer.");
  }
  if (typeof category !== "string" || !categoryToEnum[category.trim().toLowerCase()]) {
    throw httpError(400, "Choose a valid roadmap activity category.");
  }
  if (typeof duration !== "string" || duration.trim().length > 40) {
    throw httpError(400, "duration must be 40 characters or fewer.");
  }
  if (typeof description !== "string" || !description.trim() || description.trim().length > 240) {
    throw httpError(400, "description is required and must be 240 characters or fewer.");
  }
  if (skill !== undefined && (typeof skill !== "string" || skill.trim().length > 120)) {
    throw httpError(400, "skill must be a string of 120 characters or fewer.");
  }

  const normalizedSkill = typeof skill === "string" ? normalize(skill) : "";
  const activitySkill = normalizedSkill
    ? await prisma.skill.findUnique({ where: { normalizedName: normalizedSkill } })
    : null;
  if (normalizedSkill && !activitySkill) throw httpError(400, "Choose a skill from the catalog.");
  const preparationStep = activitySkill
    ? await prisma.careerPreparationStep.findFirst({
        where: { careerId: roadmap.careerId, skillId: activitySkill.id },
        orderBy: { sequence: "asc" },
        select: { id: true },
      })
    : null;
  const latest = roadmap.activities.reduce((max, activity) => Math.max(max, activity.position), -1);
  const activity = await prisma.roadmapActivity.create({
    data: {
      roadmapId: roadmap.id,
      preparationStepId: preparationStep?.id,
      skillId: activitySkill?.id,
      title: title.trim(),
      category: categoryToEnum[category.trim().toLowerCase()],
      duration: duration.trim() || "Flexible",
      description: description.trim(),
      position: latest + 1,
    },
    include: { skill: true },
  });
  response.status(201).json(mapActivity(activity));
});

app.patch("/api/roadmap/activities/:activityId", async (request, response) => {
  const { roadmap } = await getDemoContext();
  if (!roadmap) throw httpError(404, "Roadmap not found.");
  const status = Object.entries(statusMap).find(([, label]) => label === request.body?.status)?.[0];
  if (!status) throw httpError(400, "Choose a valid activity status.");
  const updated = await prisma.roadmapActivity.updateMany({
    where: { id: request.params.activityId, roadmapId: roadmap.id },
    data: { status },
  });
  if (!updated.count) throw httpError(404, "Roadmap activity not found.");
  const activity = await prisma.roadmapActivity.findUnique({
    where: { id: request.params.activityId },
    include: { skill: true },
  });
  response.json(mapActivity(activity));
});

app.delete("/api/roadmap/activities/:activityId", async (request, response) => {
  const { roadmap } = await getDemoContext();
  if (!roadmap) throw httpError(404, "Roadmap not found.");
  const deleted = await prisma.roadmapActivity.deleteMany({
    where: { id: request.params.activityId, roadmapId: roadmap.id },
  });
  if (!deleted.count) throw httpError(404, "Roadmap activity not found.");
  response.status(204).end();
});

app.post("/api/profile/skills", async (request, response) => {
  const { user } = await getDemoContext();
  const name = request.body?.name;
  if (typeof name !== "string" || !name.trim() || name.trim().length > 120) {
    throw httpError(400, "name is required and must be 120 characters or fewer.");
  }
  const normalizedName = normalize(name);
  const skill = await prisma.skill.upsert({
    where: { normalizedName },
    create: { name: name.trim(), normalizedName },
    update: {},
  });
  await prisma.studentSkill.upsert({
    where: { userId_skillId: { userId: user.id, skillId: skill.id } },
    create: { userId: user.id, skillId: skill.id },
    update: {},
  });
  response.status(201).json({ name: skill.name });
});

app.delete("/api/profile/skills/:normalizedName", async (request, response) => {
  const { user } = await getDemoContext();
  const normalizedName = normalize(request.params.normalizedName);
  await prisma.studentSkill.deleteMany({
    where: { userId: user.id, skill: { normalizedName } },
  });
  response.status(204).end();
});

app.post("/api/profile/course-imports", async (request, response) => {
  if (!request.is("multipart/form-data")) {
    throw httpError(415, "Course upload requires a CSV or PDF file in multipart form data.");
  }
  const upload = await readCourseUpload(request);
  let parsedCourses;
  try {
    parsedCourses = upload.format === "pdf"
      ? await parseCoursePdf(upload.content)
      : parseCourseCsv(upload.content);
  } catch (error) {
    throw httpError(422, error.message || "The CSV could not be read.");
  }
  const { user } = await getDemoContext();

  const catalog = await prisma.course.findMany({
    select: { id: true, institutionName: true, courseCode: true, title: true },
  });
  const extractedCourses = parsedCourses.map((course) => {
    const match = findCatalogMatch(course, catalog);
    return {
      ...course,
      recognizedCourseId: match?.id || null,
      confidence: match ? 1 : null,
      reviewStatus: course.reviewStatus === "UNRECOGNIZED" || !match ? "UNRECOGNIZED" : "RECOGNIZED",
      reviewNote: course.reviewNote || (match ? null : "No exact catalog match; review this course before confirming."),
    };
  });

  const imported = await prisma.$transaction(async (transaction) => {
    await transaction.courseImport.deleteMany({ where: { userId: user.id } });
    const courseImport = await transaction.courseImport.create({
      data: {
        userId: user.id,
        fileName: upload.fileName,
        mediaType: upload.mediaType,
        storageKey: `memory:${user.id}:${randomUUID()}:${upload.size}`,
        status: "PROCESSING",
      },
    });
    await transaction.extractedCourse.createMany({
      data: extractedCourses.map((course) => ({
        courseImportId: courseImport.id,
        recognizedCourseId: course.recognizedCourseId,
        rawText: course.rawText,
        institutionName: course.institutionName,
        courseCode: course.courseCode,
        courseTitle: course.courseTitle,
        creditHours: course.creditHours,
        term: course.term,
        grade: course.grade,
        confidence: course.confidence,
        reviewStatus: course.reviewStatus,
        reviewNote: course.reviewNote,
      })),
    });
    await transaction.courseImport.update({
      where: { id: courseImport.id },
      data: { status: "REVIEW_REQUIRED" },
    });
    return transaction.courseImport.findUnique({
      where: { id: courseImport.id },
      include: {
        extractedCourses: {
          orderBy: { createdAt: "asc" },
          include: { recognizedCourse: true },
        },
      },
    });
  });
  response.status(201).json(mapCourseImport(imported));
});

app.post("/api/profile/course-imports/:importId/confirm", async (request, response) => {
  const { user, roadmap } = await getDemoContext();
  const submittedCourses = request.body?.courses;
  if (!Array.isArray(submittedCourses) || submittedCourses.length > 500) {
    throw httpError(400, "Choose up to 500 extracted courses to confirm.");
  }
  if (!submittedCourses.length) throw httpError(400, "Select at least one course to confirm.");
  const submittedIds = submittedCourses.map((course) => course?.id);
  if (submittedIds.some((id) => typeof id !== "string") || new Set(submittedIds).size !== submittedIds.length) {
    throw httpError(400, "The selected course list contains an invalid or repeated course.");
  }

  const result = await prisma.$transaction(async (transaction) => {
    const courseImport = await transaction.courseImport.findFirst({
      where: { id: request.params.importId, userId: user.id },
      include: {
        extractedCourses: { include: { recognizedCourse: true } },
      },
    });
    if (!courseImport) throw httpError(404, "Course import was not found.");
    if (courseImport.status === "CONFIRMED") {
      return {
        added: 0,
        skipped: courseImport.extractedCourses.filter((course) => course.reviewStatus === "CONFIRMED").length,
        roadmapActivitiesAdded: 0,
        alreadyConfirmed: true,
        courseImport,
      };
    }
    if (courseImport.status !== "REVIEW_REQUIRED") {
      throw httpError(409, "This course import is not ready for confirmation.");
    }

    const extractedById = new Map(courseImport.extractedCourses.map((course) => [course.id, course]));
    const selected = submittedCourses.map((course) => {
      const extracted = extractedById.get(course.id);
      if (!extracted || extracted.reviewStatus === "REMOVED") {
        throw httpError(400, "One or more selected courses do not belong to this import.");
      }
      return { extracted, course: validateConfirmedCourse(course) };
    });
    const selectedIds = new Set(submittedIds);
    await transaction.extractedCourse.updateMany({
      where: {
        courseImportId: courseImport.id,
        id: { notIn: [...selectedIds] },
      },
      data: { reviewStatus: "REMOVED", reviewNote: "Removed by the student during review." },
    });

    const existingCourses = await transaction.studentCourse.findMany({
      where: { userId: user.id, completionStatus: "COMPLETED" },
      select: { courseCode: true, courseTitle: true, deduplicationKey: true },
    });
    const catalog = await transaction.course.findMany({
      select: { id: true, institutionName: true, courseCode: true, title: true },
    });
    const requestKeys = new Set();
    let added = 0;
    let skipped = 0;
    let position = roadmap
      ? (await transaction.roadmapActivity.aggregate({
          where: { roadmapId: roadmap.id },
          _max: { position: true },
        }))._max.position ?? -1
      : -1;

    for (const { extracted, course } of selected) {
      const catalogMatch = findCatalogMatch(
        { ...course, institutionName: extracted.institutionName },
        catalog,
      );
      if (isDuplicateCourse(course, existingCourses, requestKeys)) {
        await transaction.extractedCourse.update({
          where: { id: extracted.id },
          data: {
            courseCode: course.courseCode,
            courseTitle: course.courseTitle,
            grade: course.grade,
            creditHours: course.creditHours,
            recognizedCourseId: catalogMatch?.id || null,
            reviewStatus: "CONFIRMED",
            reviewNote: "Already recorded; this duplicate was skipped.",
          },
        });
        skipped += 1;
        continue;
      }

      const studentCourse = await transaction.studentCourse.create({
        data: {
          userId: user.id,
          courseId: catalogMatch?.id,
          sourceImportId: courseImport.id,
          institutionName: extracted.institutionName,
          courseCode: course.courseCode,
          courseTitle: course.courseTitle,
          credits: course.creditHours,
          term: extracted.term,
          grade: course.grade,
          deduplicationKey: makeDeduplicationKey(course.courseCode, course.courseTitle),
          completionStatus: "COMPLETED",
        },
      });
      await transaction.extractedCourse.update({
        where: { id: extracted.id },
        data: {
          studentCourseId: studentCourse.id,
          recognizedCourseId: catalogMatch?.id || null,
          courseCode: course.courseCode,
          courseTitle: course.courseTitle,
          grade: course.grade,
          creditHours: course.creditHours,
          reviewStatus: "CONFIRMED",
          reviewNote: catalogMatch ? "Matched to the course catalog." : "Saved as provided; no exact catalog match was found.",
        },
      });
      existingCourses.push({
        courseCode: course.courseCode,
        courseTitle: course.courseTitle,
        deduplicationKey: makeDeduplicationKey(course.courseCode, course.courseTitle),
      });
      added += 1;
      if (roadmap) {
        const title = `${course.courseCode ? `${course.courseCode} - ` : ""}${course.courseTitle}`.slice(0, 100);
        const details = [
          course.grade ? `Grade ${course.grade}.` : "",
          course.creditHours !== null ? `${course.creditHours} credit hours.` : "",
        ].filter(Boolean).join(" ");
        await transaction.roadmapActivity.create({
          data: {
            roadmapId: roadmap.id,
            studentCourseId: studentCourse.id,
            title,
            category: "TRANSFER_CREDIT",
            duration: course.creditHours === null ? "Completed course" : `${course.creditHours} credits`,
            description: (details || "Completed coursework confirmed from an uploaded course list.").slice(0, 240),
            status: "COMPLETED",
            position: ++position,
          },
        });
      }
    }

    const updatedImport = await transaction.courseImport.update({
      where: { id: courseImport.id },
      data: { status: "CONFIRMED" },
      include: {
        extractedCourses: {
          orderBy: { createdAt: "asc" },
          include: { recognizedCourse: true },
        },
      },
    });
    return {
      added,
      skipped,
      roadmapActivitiesAdded: roadmap ? added : 0,
      alreadyConfirmed: false,
      courseImport: updatedImport,
    };
  });

  response.json({
    added: result.added,
    skipped: result.skipped,
    roadmapActivitiesAdded: result.roadmapActivitiesAdded,
    alreadyConfirmed: result.alreadyConfirmed,
    courseImport: mapCourseImport(result.courseImport),
  });
});

app.delete("/api/profile/course-imports/:importId", async (request, response) => {
  const { user } = await getDemoContext();
  const deleted = await prisma.courseImport.deleteMany({ where: { id: request.params.importId, userId: user.id } });
  if (!deleted.count) throw httpError(404, "Uploaded file was not found.");
  response.status(204).end();
});

app.use((error, _request, response, _next) => {
  if (response.headersSent) return;
  if (error instanceof SyntaxError && "body" in error) {
    response.status(400).json({ error: "Request body must be valid JSON." });
    return;
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      response.status(409).json({ error: "That item already exists." });
      return;
    }
    if (error.code === "P2025") {
      response.status(404).json({ error: "Requested record was not found." });
      return;
    }
  }
  const status = Number.isInteger(error.status) ? error.status : 500;
  if (status >= 500) console.error("API request failed:", error);
  response.status(status).json({
    error: status >= 500 ? "The API could not complete the request." : error.message,
  });
});

const server = app.listen(port, host, () => {
  console.log(`CareerPath demo API listening on http://${host}:${port}`);
});

async function shutdown() {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
