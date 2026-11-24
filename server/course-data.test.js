import { describe, expect, it } from "vitest";
import { prepareExtractedCourses } from "./course-data.js";

describe("prepareExtractedCourses", () => {
  const catalog = [{
    id: "course-1",
    institutionName: "Example University",
    courseCode: "CS101",
    title: "Programming",
  }];

  it("keeps only completed class names and returns no transcript details", () => {
    const records = prepareExtractedCourses([
      {
        courseTitle: " Programming ",
        courseCode: "CS101",
        grade: "A-",
        creditHours: 3,
        institutionName: "Example University",
        term: "Fall 2026",
        rawText: "CS101 Programming A- Fall 2026",
      },
      { courseTitle: "In progress course", grade: "IP" },
      { courseTitle: "Missing grade", grade: null },
      { courseTitle: "", grade: "B" },
    ], catalog);

    expect(records).toEqual([{
      courseTitle: "Programming",
      recognizedCourseId: "course-1",
      reviewStatus: "RECOGNIZED",
    }]);
  });

  it("retains a completed but unmatched class name without transcript fields", () => {
    const records = prepareExtractedCourses([
      {
        courseTitle: "Independent Study",
        grade: "P",
        courseCode: "UNKNOWN 400",
        term: "Spring 2026",
        rawText: "UNKNOWN 400 Independent Study P Spring 2026",
      },
    ], catalog);

    expect(records).toEqual([{
      courseTitle: "Independent Study",
      recognizedCourseId: null,
      reviewStatus: "UNRECOGNIZED",
    }]);
  });
});
