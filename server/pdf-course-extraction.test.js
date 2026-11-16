import { describe, expect, it } from "vitest";
import { parseCoursePdf } from "./pdf-course-extraction.js";

function makeTextPdf(textLines) {
  const textOperators = textLines
    .map((line, index) => `${index ? "0 -18 Td " : "72 720 Td "}(${line.replace(/[\\()]/g, "\\$&")}) Tj`)
    .join(" ");
  const stream = `BT /F1 12 Tf ${textOperators} ET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const [index, object] of objects.entries()) {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  }
  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf);
}

describe("parseCoursePdf", () => {
  it("extracts course rows from a text-based transcript PDF", async () => {
    const rows = await parseCoursePdf(makeTextPdf([
      "University: Test University",
      "ITSC 1212 Introduction to Computer Science 3.00 A Fall 2024",
    ]));

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      courseCode: "ITSC 1212",
      courseTitle: "Introduction to Computer Science",
      grade: "A",
      creditHours: 3,
      institutionName: "Test University",
      term: "Fall 2024",
      reviewStatus: "PENDING",
    });
  });

  it("rejects files that are not PDFs", async () => {
    await expect(parseCoursePdf(Buffer.from("not a PDF"))).rejects.toThrow("not a valid PDF");
  });
});
