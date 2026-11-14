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

export type AppData = {
  user: { id: string; displayName: string; career: string | null };
  profileSkills: string[];
  savedJobIds: string[];
  careerSkills: string[];
  roadmap: RoadmapItem[];
  jobs: Job[];
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
