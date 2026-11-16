const headerAliases = {
  courseCode: ["coursecode", "code", "coursenumber", "courseno", "catalognumber"],
  courseTitle: ["coursename", "title", "course"],
  grade: ["grade", "lettergrade", "mark"],
  creditHours: ["credithours", "credits", "credit", "creditunits"],
  institutionName: ["institution", "school", "university"],
  term: ["term", "semester", "session"],
};

const completedGradePattern = /^(?:A|B|C|D)[+-]?$|^(?:P|S|CR|PASS|SATISFACTORY)$/i;

function normalizeText(value) {
  return value.trim().normalize("NFKC").toLocaleLowerCase("en-US").replace(/[^\p{L}\p{N}]+/gu, "");
}

function parseCsvRecords(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        field += character;
      }
      continue;
    }

    if (character === '"' && field.trim() === "") {
      field = "";
      quoted = true;
    } else if (character === '"') {
      throw new Error("The CSV contains a quote in an unquoted field.");
    } else if (character === ",") {
      row.push(field.trim());
      field = "";
    } else if (character === "\n" || character === "\r") {
      row.push(field.trim());
      field = "";
      if (row.some(Boolean)) rows.push(row);
      row = [];
      if (character === "\r" && text[index + 1] === "\n") index += 1;
    } else {
      field += character;
    }
  }

  if (quoted) throw new Error("The CSV contains an unterminated quoted field.");
  row.push(field.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function columnFor(headers, fieldName) {
  const aliases = headerAliases[fieldName];
  return headers.findIndex((header) => aliases.includes(header.toLowerCase().replace(/[^a-z0-9]/g, "")));
}

function getValue(row, index) {
  return index < 0 ? "" : (row[index] || "").trim();
}

function parseCreditHours(value, issues) {
  if (!value) return null;
  const normalized = value.match(/^\d+(?:\.\d)?$/);
  if (!normalized) {
    issues.push("Credit hours must be a non-negative number with at most one decimal place.");
    return null;
  }
  const hours = Number(normalized[0]);
  if (hours > 999.9) {
    issues.push("Credit hours are outside the supported range.");
    return null;
  }
  return hours;
}

export function parseCourseCsv(input) {
  let text;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(input).replace(/^\uFEFF/, "");
  } catch {
    throw new Error("The CSV must be encoded as UTF-8.");
  }

  if (!text.trim()) throw new Error("The uploaded CSV is empty.");
  const [headerRow, ...rows] = parseCsvRecords(text);
  if (!headerRow) throw new Error("The CSV does not contain a header row.");

  const headers = headerRow.map((header) => header.toLowerCase().replace(/[^a-z0-9]/g, ""));
  const columns = Object.fromEntries(
    Object.keys(headerAliases).map((fieldName) => [fieldName, columnFor(headers, fieldName)]),
  );
  if (columns.courseTitle < 0) {
    throw new Error("Add a course name, course, or title column to the CSV.");
  }

  const parsed = [];
  for (const row of rows) {
    if (!row.some(Boolean)) continue;
    const issues = [];
    if (row.length > headers.length) issues.push("This row has more values than the header.");

    let courseCode = getValue(row, columns.courseCode) || null;
    let courseTitle = getValue(row, columns.courseTitle) || null;
    const combinedCourse = courseTitle?.match(/^([A-Z]{2,}\s*\d{2,}[A-Z]?(?:-\d{1,2})?)\s*[-:]\s*(.+)$/i);
    if (!courseCode && combinedCourse) {
      courseCode = combinedCourse[1].trim();
      courseTitle = combinedCourse[2].trim();
    }
    if (!courseTitle) issues.push("Course name is missing.");
    if (courseCode && courseCode.length > 80) {
      courseCode = null;
      issues.push("Course code is longer than 80 characters.");
    }
    if (courseTitle && courseTitle.length > 200) {
      courseTitle = null;
      issues.push("Course name is longer than 200 characters.");
    }

    const grade = getValue(row, columns.grade).toUpperCase() || null;
    if (!grade) issues.push("Grade is missing.");
    else if (!completedGradePattern.test(grade)) issues.push(`Grade "${grade}" is not recognized as completed coursework.`);

    const creditIssues = [];
    const creditHours = parseCreditHours(getValue(row, columns.creditHours), creditIssues);
    issues.push(...creditIssues);

    const institutionName = getValue(row, columns.institutionName) || null;
    const term = getValue(row, columns.term) || null;
    if (institutionName && institutionName.length > 200) issues.push("Institution name is longer than 200 characters.");
    if (term && term.length > 80) issues.push("Term is longer than 80 characters.");

    parsed.push({
      courseCode,
      courseTitle,
      grade,
      creditHours,
      institutionName: institutionName?.length <= 200 ? institutionName : null,
      term: term?.length <= 80 ? term : null,
      rawText: [courseCode, courseTitle, grade, creditHours, term].filter((value) => value !== null && value !== undefined).join(" | "),
      reviewStatus: issues.length ? "UNRECOGNIZED" : "PENDING",
      reviewNote: issues.length ? issues.join(" ") : null,
    });
  }

  if (!parsed.length) throw new Error("The CSV contains no course rows.");
  return parsed;
}

export function parseCourseTranscriptText(text) {
  const gradeToken = "(?:A[+-]?|B[+-]?|C[+-]?|D[+-]?|F|P|S|CR|PASS|SATISFACTORY|W|I|IP|AU|TR|NC)";
  const creditToken = "(\\d{1,3}(?:\\.\\d{1,2})?)";
  const institutionName = text.match(/^(?:institution|school|university)\s*[:\-]\s*(.+)$/im)?.[1]?.trim() || null;
  const rows = [];

  for (const sourceLine of text.split(/\r?\n/)) {
    const line = sourceLine.replace(/\s+/g, " ").trim();
    if (!line) continue;

    const creditBeforeGrade = line.match(new RegExp(`^(.+)\\s+${creditToken}\\s+(${gradeToken})(?:\\s+(.+))?$`, "i"));
    const gradeBeforeCredit = line.match(new RegExp(`^(.+)\\s+(${gradeToken})(?:\\s+${creditToken})?(?:\\s+(.+))?$`, "i"));
    const match = creditBeforeGrade || gradeBeforeCredit;
    if (!match) continue;

    let courseTitle = match[1].trim();
    let creditValue = creditBeforeGrade ? match[2] : match[3];
    let grade = creditBeforeGrade ? match[3] : match[2];
    let term = match[4];
    const codeMatch = courseTitle.match(/^([A-Z]{2,8}\s*\d{3,4}[A-Z]?(?:-\d{1,2})?)(?:\s*[-:]\s*|\s+)(.+)$/i);
    const courseCode = codeMatch?.[1].trim() || null;
    if (codeMatch) courseTitle = codeMatch[2].trim();

    const issues = [];
    if (courseCode && courseCode.length > 80) issues.push("Course code is longer than 80 characters.");
    if (courseTitle.length > 200) issues.push("Course name is longer than 200 characters.");
    grade = grade.toUpperCase();
    if (!completedGradePattern.test(grade)) {
      issues.push(`Grade "${grade}" is not recognized as completed coursework.`);
    }

    const creditIssues = [];
    const normalizedCredits = creditValue?.replace(/(\.\d)0$/, "$1") || "";
    const creditHours = parseCreditHours(normalizedCredits, creditIssues);
    issues.push(...creditIssues);

    if (term && term.length > 80) {
      issues.push("Term is longer than 80 characters.");
      term = null;
    }

    rows.push({
      courseCode: courseCode && courseCode.length <= 80 ? courseCode : null,
      courseTitle: courseTitle.length <= 200 ? courseTitle : null,
      grade,
      creditHours,
      institutionName: institutionName?.length <= 200 ? institutionName : null,
      term: term || null,
      rawText: line,
      reviewStatus: issues.length ? "UNRECOGNIZED" : "PENDING",
      reviewNote: issues.length ? issues.join(" ") : null,
    });
  }

  if (!rows.length) {
    throw new Error("No course rows were recognized. Use transcript rows that include a course name and grade.");
  }
  if (rows.length > 500) throw new Error("The PDF contains too many course rows. Upload a transcript with 500 or fewer courses.");
  return rows;
}

export function findCatalogMatch(row, catalog) {
  const code = row.courseCode ? normalizeText(row.courseCode) : "";
  const title = row.courseTitle ? normalizeText(row.courseTitle) : "";
  const candidates = catalog.filter((course) => {
    if (row.institutionName && normalizeText(row.institutionName) !== normalizeText(course.institutionName)) return false;
    return code
      ? course.courseCode && normalizeText(course.courseCode) === code
      : title && normalizeText(course.title) === title;
  });
  const exact = candidates.filter((course) => !title || normalizeText(course.title) === title);
  return exact.length === 1 ? exact[0] : null;
}

export function makeDeduplicationKey(courseCode, courseTitle) {
  const code = courseCode ? normalizeText(courseCode) : "";
  const title = courseTitle ? normalizeText(courseTitle) : "";
  return code ? `course-code:${code}` : `course-title:${title}`;
}

export function isDuplicateCourse(candidate, existingCourses, seenKeys = new Set()) {
  const key = makeDeduplicationKey(candidate.courseCode, candidate.courseTitle);
  if (seenKeys.has(key)) return true;
  seenKeys.add(key);

  const code = candidate.courseCode ? normalizeText(candidate.courseCode) : "";
  const title = candidate.courseTitle ? normalizeText(candidate.courseTitle) : "";
  return existingCourses.some((existing) => {
    const existingCode = existing.courseCode ? normalizeText(existing.courseCode) : "";
    const existingTitle = existing.courseTitle ? normalizeText(existing.courseTitle) : "";
    const sameCode = code && existingCode && code === existingCode;
    const sameTitleWithoutCode = title && title === existingTitle && (!code || !existingCode);
    return sameCode || sameTitleWithoutCode;
  });
}

export function isCompletedGrade(grade) {
  return typeof grade === "string" && completedGradePattern.test(grade.trim());
}
