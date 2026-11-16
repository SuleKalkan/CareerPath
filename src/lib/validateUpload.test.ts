import { describe, expect, it } from "vitest";
import { MAX_FILE_SIZE_BYTES, validateUpload } from "./validateUpload";

describe("validateUpload", () => {
  it.each(["courses.csv", "COURSES.CSV"])(
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

  it("accepts PDF transcript files", () => {
    expect(validateUpload({ name: "transcript.pdf", size: 2048, type: "application/pdf" })).toEqual({
      valid: true,
    });
  });

  it("rejects unsupported types and names the extension", () => {
    const result = validateUpload({ name: "photo.png", size: 2048 });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.error).toContain(".png");
      expect(result.error).toContain("CSV");
    }
  });

  it("rejects a double extension like courses.csv.exe", () => {
    expect(validateUpload({ name: "courses.csv.exe", size: 2048 }).valid).toBe(false);
  });

  it("rejects a file with no extension", () => {
    expect(validateUpload({ name: "courses", size: 2048 }).valid).toBe(false);
  });

  it("rejects a PDF with a mismatched media type", () => {
    const result = validateUpload({ name: "transcript.pdf", size: 2048, type: "text/plain" });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error).toContain("valid PDF");
  });

  it("rejects files over 10 MB with a size message", () => {
    const result = validateUpload({ name: "big.csv", size: MAX_FILE_SIZE_BYTES + 1 });
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error).toContain("10 MB");
  });

  it("accepts a file exactly at 10 MB", () => {
    expect(validateUpload({ name: "limit.csv", size: MAX_FILE_SIZE_BYTES })).toEqual({ valid: true });
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