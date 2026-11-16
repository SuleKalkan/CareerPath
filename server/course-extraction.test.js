import { describe, expect, it } from "vitest";
import {
  findCatalogMatch,
  isCompletedGrade,
  isDuplicateCourse,
  makeDeduplicationKey,
  parseCourseCsv,
  parseCourseTranscriptText,
} from "./course-extraction.js";

describe("parseCourseCsv", () => {
  it("extracts course fields from a CSV with quoted commas and a BOM", () => {
    const rows = parseCourseCsv(Buffer.from(
      "\uFEFFCourse Code,Course Name,Grade,Credit Hours,Term\r\nITSC 2214,\"Data Structures, Algorithms\",A,3,Fall 2025\r\n",
    ));

    expect(rows).toEqual([{
      courseCode: "ITSC 2214",
      courseTitle: "Data Structures, Algorithms",
      grade: "A",
      creditHours: 3,
      institutionName: null,
      term: "Fall 2025",
      rawText: "ITSC 2214 | Data Structures, Algorithms | A | 3 | Fall 2025",
      reviewStatus: "PENDING",
      reviewNote: null,
    }]);
  });

  it("flags missing names, missing grades, and non-completed grades for review", () => {
    const rows = parseCourseCsv(Buffer.from(
      "Course,Grade,Credit Hours\n, A,3\nData Structures,,3\nOperating Systems,F,3\n",
    ));

    expect(rows).toHaveLength(3);
    expect(rows.every((row) => row.reviewStatus === "UNRECOGNIZED")).toBe(true);
    expect(rows.map((row) => row.reviewNote)).toEqual([
      "Course name is missing.",
      "Grade is missing.",
      'Grade "F" is not recognized as completed coursework.',
    ]);
  });

  it("extracts a code embedded in a combined course field", () => {
    const [row] = parseCourseCsv(Buffer.from("Course,Grade\nITSC 2214 - Data Structures,B+\n"));
    expect(row.courseCode).toBe("ITSC 2214");
    expect(row.courseTitle).toBe("Data Structures");
    expect(row.reviewStatus).toBe("PENDING");
  });

  it("flags malformed credit hours instead of misreading a decimal comma", () => {
    const [row] = parseCourseCsv(Buffer.from('Course,Grade,Credits\n"Calculus I",A,"3,5"\n'));
    expect(row.creditHours).toBeNull();
    expect(row.reviewStatus).toBe("UNRECOGNIZED");
    expect(row.reviewNote).toContain("Credit hours must be a non-negative number");
  });

  it.each([
    ["empty content", Buffer.from("")],
    ["malformed quoting", Buffer.from('Course Name,Grade\n"Data Structures,A\n')],
    ["invalid UTF-8", Buffer.from([0xc3, 0x28])],
    ["missing course header", Buffer.from("Grade,Credits\nA,3\n")],
  ])("rejects %s with a useful error", (_name, content) => {
    expect(() => parseCourseCsv(content)).toThrow();
  });
});

describe("parseCourseTranscriptText", () => {
  it("extracts transcript rows with either credits-and-grade order", () => {
    const rows = parseCourseTranscriptText([
      "University: UNC Charlotte",
      "Course Credits Grade Term",
      "ITSC 1212 Introduction to Computer Science 3.00 A Fall 2024",
      "MATH 1241 Calculus I B+ 4.0 Spring 2025",
    ].join("\n"));

    expect(rows).toEqual([
      {
        courseCode: "ITSC 1212",
        courseTitle: "Introduction to Computer Science",
        grade: "A",
        creditHours: 3,
        institutionName: "UNC Charlotte",
        term: "Fall 2024",
        rawText: "ITSC 1212 Introduction to Computer Science 3.00 A Fall 2024",
        reviewStatus: "PENDING",
        reviewNote: null,
      },
      {
        courseCode: "MATH 1241",
        courseTitle: "Calculus I",
        grade: "B+",
        creditHours: 4,
        institutionName: "UNC Charlotte",
        term: "Spring 2025",
        rawText: "MATH 1241 Calculus I B+ 4.0 Spring 2025",
        reviewStatus: "PENDING",
        reviewNote: null,
      },
    ]);
  });

  it("keeps rows with unrecognized grades for manual review", () => {
    const [row] = parseCourseTranscriptText("ITSC 1212 Introduction to Computer Science 3.0 F Fall 2024");
    expect(row.reviewStatus).toBe("UNRECOGNIZED");
    expect(row.reviewNote).toContain('Grade "F" is not recognized');
  });

  it("rejects text with no recognizable course rows", () => {
    expect(() => parseCourseTranscriptText("Unofficial transcript\nNo coursework listed.")).toThrow(
      "No course rows were recognized",
    );
  });
});

describe("course review helpers", () => {
  it("recognizes only exact catalog matches and leaves unknown courses for review", () => {
    const catalog = [{ id: "course-1", institutionName: "UNC Charlotte", courseCode: "ITSC 2214", title: "Data Structures" }];
    expect(findCatalogMatch({
      institutionName: null,
      courseCode: "ITSC2214",
      courseTitle: "Data Structures",
    }, catalog)).toEqual(catalog[0]);
    expect(findCatalogMatch({
      institutionName: null,
      courseCode: "ITSC 2214",
      courseTitle: "Operating Systems",
    }, catalog)).toBeNull();
  });

  it("builds stable duplicate keys and rejects incomplete grades", () => {
    expect(makeDeduplicationKey("ITSC 2214", "Data Structures")).toBe("course-code:itsc2214");
    expect(makeDeduplicationKey(null, "Data Structures")).toBe("course-title:datastructures");
    expect(isCompletedGrade("B+")).toBe(true);
    expect(isCompletedGrade("F")).toBe(false);
  });

  it("skips duplicate course codes and title-only duplicates without conflating different codes", () => {
    const existing = [{ courseCode: "ITSC 2214", courseTitle: "Data Structures" }];
    expect(isDuplicateCourse({ courseCode: "itsc-2214", courseTitle: "Different title" }, existing)).toBe(true);
    expect(isDuplicateCourse({ courseCode: "MATH 1241", courseTitle: "Data Structures" }, existing)).toBe(false);
    expect(isDuplicateCourse({ courseCode: null, courseTitle: "Data Structures" }, existing)).toBe(true);
    const seenKeys = new Set();
    expect(isDuplicateCourse({ courseCode: "ITSC 2214", courseTitle: "Data Structures" }, [], seenKeys)).toBe(false);
    expect(isDuplicateCourse({ courseCode: "ITSC2214", courseTitle: "Data Structures" }, [], seenKeys)).toBe(true);
  });
});
