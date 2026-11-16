export type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  posted: string;
  logo: string;
  logoClass: string;
  requiredSkills: string[];
  description: string;
  match: number;
  skills: string[];
  missing: string[];
};

export type RoadmapItem = {
  id: string;
  title: string;
  category: string;
  duration: string;
  status: "Completed" | "In progress" | "Not started";
  description: string;
  skill?: string;
};

export type ExtractedCourse = {
  id: string;
  courseCode: string | null;
  courseTitle: string | null;
  grade: string | null;
  creditHours: number | null;
  institutionName: string | null;
  term: string | null;
  reviewStatus: string;
  reviewNote: string | null;
  recognizedCourse: {
    id: string;
    courseCode: string | null;
    title: string;
    institutionName: string;
  } | null;
};

export type CompletedCourse = {
  id: string;
  courseCode: string | null;
  courseTitle: string;
  grade: string | null;
  creditHours: number | null;
  institutionName: string | null;
  term: string | null;
};

export type AppData = {
  user: { id: string; displayName: string; career: string | null };
  profileSkills: string[];
  savedJobIds: string[];
  careerSkills: string[];
  roadmap: RoadmapItem[];
  jobs: Job[];
  courseImport: {
    id: string;
    fileName: string;
    mediaType: string;
    size: number;
    status: string;
    errorMessage: string | null;
    extractedCourses: ExtractedCourse[];
  } | null;
  completedCourses: CompletedCourse[];
};

export type CourseImport = NonNullable<AppData["courseImport"]>;

export type CourseConfirmation = Pick<
  ExtractedCourse,
  "id" | "courseCode" | "courseTitle" | "grade" | "creditHours"
>;

export type CourseConfirmationResult = {
  added: number;
  skipped: number;
  roadmapActivitiesAdded: number;
  alreadyConfirmed: boolean;
  courseImport: CourseImport;
};

async function request<T>(path: string, method = "GET", body?: unknown): Promise<T> {
  const response = await fetch(`/api${path}`, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    const result = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(result?.error || `API request failed (${response.status}).`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

function parseUploadResponse(xhr: XMLHttpRequest): CourseImport {
  let result: unknown;
  try {
    result = JSON.parse(xhr.responseText);
  } catch {
    throw new Error("The course upload service returned an invalid response.");
  }
  if (xhr.status < 200 || xhr.status >= 300) {
    const message = result && typeof result === "object" && "error" in result
      ? String(result.error)
      : `Course upload failed (${xhr.status}).`;
    throw new Error(message);
  }
  if (!isCourseImport(result)) {
    throw new Error("The course upload service returned an invalid response.");
  }
  return result;
}

function isCourseImport(value: unknown): value is CourseImport {
  if (!value || typeof value !== "object") return false;
  if (
    !("id" in value) || typeof value.id !== "string"
    || !("fileName" in value) || typeof value.fileName !== "string"
    || !("mediaType" in value) || typeof value.mediaType !== "string"
    || !("size" in value) || typeof value.size !== "number"
    || !("status" in value) || typeof value.status !== "string"
    || !("errorMessage" in value) || (value.errorMessage !== null && typeof value.errorMessage !== "string")
    || !("extractedCourses" in value) || !Array.isArray(value.extractedCourses)
  ) {
    return false;
  }
  return value.extractedCourses.every((course) => {
    if (!course || typeof course !== "object") return false;
    const hasCourseFields = (
      "id" in course && typeof course.id === "string"
      && "courseCode" in course && (course.courseCode === null || typeof course.courseCode === "string")
      && "courseTitle" in course && (course.courseTitle === null || typeof course.courseTitle === "string")
      && "grade" in course && (course.grade === null || typeof course.grade === "string")
      && "creditHours" in course && (course.creditHours === null || typeof course.creditHours === "number")
      && "institutionName" in course && (course.institutionName === null || typeof course.institutionName === "string")
      && "term" in course && (course.term === null || typeof course.term === "string")
      && "reviewStatus" in course && typeof course.reviewStatus === "string"
      && "reviewNote" in course && (course.reviewNote === null || typeof course.reviewNote === "string")
      && "recognizedCourse" in course
    );
    if (!hasCourseFields) return false;
    const match = course.recognizedCourse;
    return match === null || (
      typeof match === "object"
      && "id" in match && typeof match.id === "string"
      && "courseCode" in match && (match.courseCode === null || typeof match.courseCode === "string")
      && "title" in match && typeof match.title === "string"
      && "institutionName" in match && typeof match.institutionName === "string"
    );
  });
}

export function uploadCourseFileForExtraction(
  file: File,
  onProcessing?: () => void,
): Promise<CourseImport> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/profile/course-imports");
    xhr.upload.addEventListener("load", () => onProcessing?.(), { once: true });
    xhr.addEventListener("load", () => {
      try {
        resolve(parseUploadResponse(xhr));
      } catch (error) {
        reject(error);
      }
    }, { once: true });
    xhr.addEventListener("error", () => reject(new Error("Course upload failed because the server could not be reached.")), { once: true });
    xhr.addEventListener("abort", () => reject(new Error("Course upload was canceled.")), { once: true });
    xhr.send(formData);
  });
}

export const loadAppData = () => request<AppData>("/bootstrap");
export const saveJob = (id: string) => request<void>(`/jobs/${id}/saved`, "POST");
export const unsaveJob = (id: string) => request<void>(`/jobs/${id}/saved`, "DELETE");
export const createRoadmapActivity = (activity: Omit<RoadmapItem, "id" | "status">) =>
  request<RoadmapItem>("/roadmap/activities", "POST", activity);
export const updateRoadmapActivity = (id: string, status: RoadmapItem["status"]) =>
  request<RoadmapItem>(`/roadmap/activities/${id}`, "PATCH", { status });
export const deleteRoadmapActivity = (id: string) =>
  request<void>(`/roadmap/activities/${id}`, "DELETE");
export const addProfileSkill = (name: string) =>
  request<{ name: string }>("/profile/skills", "POST", { name });
export const removeProfileSkill = (name: string) =>
  request<void>(`/profile/skills/${encodeURIComponent(name.trim().toLowerCase())}`, "DELETE");
export const removeCourseFile = (id: string) => request<void>(`/profile/course-imports/${encodeURIComponent(id)}`, "DELETE");
export const confirmCourseImport = (id: string, courses: CourseConfirmation[]) =>
  request<CourseConfirmationResult>(`/profile/course-imports/${encodeURIComponent(id)}/confirm`, "POST", { courses });
