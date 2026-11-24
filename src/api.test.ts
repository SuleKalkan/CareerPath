import { describe, expect, it } from "vitest";
import { isCourseImport } from "./api";

describe("isCourseImport", () => {
  it("accepts a class-name-and-skills-only response", () => {
    expect(isCourseImport({
      id: "import-1",
      status: "REVIEW_REQUIRED",
      extractedCourses: [{
        id: "course-1",
        courseTitle: "Data Structures",
        skills: ["Data structures", "Algorithms"],
        reviewStatus: "RECOGNIZED",
      }],
    })).toBe(true);
  });

  it("rejects transcript details in import responses", () => {
    expect(isCourseImport({
      id: "import-1",
      status: "REVIEW_REQUIRED",
      extractedCourses: [{
        id: "course-1",
        courseTitle: "Data Structures",
        skills: [],
        reviewStatus: "RECOGNIZED",
        grade: "A",
      }],
    })).toBe(false);
  });
});
