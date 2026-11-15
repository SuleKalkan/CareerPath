export const SUPPORTED_FILE_TYPES = [
  { extension: ".pdf", mimeTypes: ["application/pdf"] },
  { extension: ".doc", mimeTypes: ["application/msword"] },
  {
    extension: ".docx",
    mimeTypes: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  },
  
  { extension: ".csv", mimeTypes: ["text/csv", "application/vnd.ms-excel", "text/plain"] },
] as const;

export const SUPPORTED_FILE_LABEL = "PDF, DOC, DOCX or CSV";
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export type UploadFile = { name: string; size: number; type?: string };

export type ValidationResult = { valid: true } | { valid: false; error: string };

function getExtension(fileName: string): string {
  const name = fileName.trim().toLowerCase();
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(dot) : "";
}

export function validateUpload(file: UploadFile | null | undefined): ValidationResult {
  if (!file) {
    return { valid: false, error: `No file selected. Please choose a ${SUPPORTED_FILE_LABEL} file.` };
  }

  const extension = getExtension(file.name);
  const supported = SUPPORTED_FILE_TYPES.find((t) => t.extension === extension);

  if (!supported) {
    return {
      valid: false,
      error: `Unsupported file type${extension ? ` (${extension})` : ""}. Please upload a ${SUPPORTED_FILE_LABEL} file.`,
    };
  }

  if (file.type && !(supported.mimeTypes as readonly string[]).includes(file.type)) {
    return {
      valid: false,
      error: `This file's contents don't match its ${extension} extension. Please upload a valid ${SUPPORTED_FILE_LABEL} file.`,
    };
  }

  if (file.size === 0) {
    return { valid: false, error: "This file is empty. Please choose a file that contains your course list." };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const mb = (file.size / (1024 * 1024)).toFixed(1);
    return { valid: false, error: `This file is too large (${mb} MB). Files must be 10 MB or smaller.` };
  }

  return { valid: true };
}