import dotenv from "dotenv";
import express from "express";
import { Prisma, PrismaClient } from "@prisma/client";

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
app.use(express.json({ limit: "16kb" }));

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
