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
  courseTitle: string;
  skills: string[];
  reviewStatus: string;
};

export type CompletedCourse = {
  id: string;
  courseTitle: string;
  skills: string[];
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
    status: string;
    extractedCourses: ExtractedCourse[];
  } | null;
  completedCourses: CompletedCourse[];
};

export type CourseImport = NonNullable<AppData["courseImport"]>;

export type CourseConfirmation = Pick<ExtractedCourse, "id" | "courseTitle">;

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

export function isCourseImport(value: unknown): value is CourseImport {
  if (!value || typeof value !== "object") return false;
  const allowedImportFields = ["id", "status", "extractedCourses"];
  if (Object.keys(value).some((key) => !allowedImportFields.includes(key))) return false;
  if (
    !("id" in value) || typeof value.id !== "string"
    || !("status" in value) || typeof value.status !== "string"
    || !("extractedCourses" in value) || !Array.isArray(value.extractedCourses)
  ) {
    return false;
  }
  return value.extractedCourses.every((course) => {
    if (!course || typeof course !== "object") return false;
    const allowedCourseFields = ["id", "courseTitle", "skills", "reviewStatus"];
    const hasCourseFields = (
      !Object.keys(course).some((key) => !allowedCourseFields.includes(key))
      && "id" in course && typeof course.id === "string"
      && "courseTitle" in course && typeof course.courseTitle === "string"
      && "skills" in course && Array.isArray(course.skills) && course.skills.every((skill: unknown) => typeof skill === "string")
      && "reviewStatus" in course && typeof course.reviewStatus === "string"
    );
    return hasCourseFields;
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
