import { findCatalogMatch, isCompletedGrade } from "./course-extraction.js";

export function prepareExtractedCourses(parsedCourses, catalog) {
  return parsedCourses
    .filter((course) => (
      typeof course.courseTitle === "string"
      && course.courseTitle.trim().length > 0
      && course.courseTitle.trim().length <= 200
      && isCompletedGrade(course.grade)
    ))
    .map((course) => {
      const courseTitle = course.courseTitle.trim();
      const recognizedCourse = findCatalogMatch({ ...course, courseTitle }, catalog);
      return {
        courseTitle,
        recognizedCourseId: recognizedCourse?.id || null,
        reviewStatus: recognizedCourse ? "RECOGNIZED" : "UNRECOGNIZED",
      };
    });
}
