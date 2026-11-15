import { describe, expect, it } from "vitest";
import { MAX_FILE_SIZE_BYTES, validateUpload } from "./validateUpload";

describe("validateUpload", () => {
  it.each(["courses.csv", "transcript.pdf", "history.doc", "history.docx", "COURSES.CSV"])(
    "accepts %s",
    (name) => {
      expect(validateUpload({ name, size: 2048 })).toEqual({ valid: true });
    },
  );

  it("accepts a CSV that the browser reports as vnd.ms-excel", () => {
    expect(
      validateUpload({ name: "courses.csv", size: 2048, type: "application/vnd.ms-excel" }),
    ).toEqual({ valid: true });
  });

  it("rejects unsupported types and names the extension", () => {
    const result = validateUpload({ name: "photo.png", size: 2048 });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain(".png");
      expect(result.error).toContain("PDF, DOC, DOCX or CSV");
    }
  });

  it("rejects a double extension like courses.csv.exe", () => {
    expect(validateUpload({ name: "courses.csv.exe", size: 2048 }).valid).toBe(false);
  });

  it("rejects a file with no extension", () => {
    expect(validateUpload({ name: "courses", size: 2048 }).valid).toBe(false);
  });

  it("rejects a PDF whose MIME type is an image", () => {
    expect(validateUpload({ name: "fake.pdf", size: 2048, type: "image/png" }).valid).toBe(false);
  });

  it("rejects files over 10 MB with a size message", () => {
    const result = validateUpload({ name: "big.pdf", size: MAX_FILE_SIZE_BYTES + 1 });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error).toContain("10 MB");
  });

  it("accepts a file exactly at 10 MB", () => {
    expect(validateUpload({ name: "limit.pdf", size: MAX_FILE_SIZE_BYTES })).toEqual({ valid: true });
  });

  it("rejects an empty file", () => {
    const result = validateUpload({ name: "empty.csv", size: 0 });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error).toContain("empty");
  });

  it("rejects when no file is provided", () => {
    expect(validateUpload(null).valid).toBe(false);
  });
});