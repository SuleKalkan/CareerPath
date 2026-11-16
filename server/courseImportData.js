const supportedFileTypes = new Map([
  [".pdf", "application/pdf"],
  [".doc", "application/msword"],
  [
    ".docx",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  [".csv", "text/csv"],
])

const maxFileSize = 10 * 1024 * 1024

export class CourseImportInputError extends Error {
  status = 400
}

export function validateCourseImportInput({ fileName, mediaType, size } = {}) {
  if (
    typeof fileName !== "string" ||
    !fileName.trim() ||
    fileName.trim().length > 255
  ) {
    throw new CourseImportInputError(
      "fileName is required and must be 255 characters or fewer.",
    )
  }
  if (typeof mediaType !== "string" || mediaType.length > 120) {
    throw new CourseImportInputError("mediaType must be a valid file type.")
  }
  const extension = `.${fileName.trim().split(".").pop()?.toLowerCase() || ""}`
  const expectedType = supportedFileTypes.get(extension)
  if (!expectedType || (mediaType && mediaType !== expectedType)) {
    throw new CourseImportInputError(
      "Choose a supported PDF, DOC, DOCX, or CSV file.",
    )
  }
  if (!Number.isInteger(size) || size < 1 || size > maxFileSize) {
    throw new CourseImportInputError("Files must be between 1 byte and 10 MB.")
  }
  return { fileName: fileName.trim(), mediaType, size }
}

export async function replaceCourseImport(prisma, userId, input) {
  const file = validateCourseImportInput(input)
  await prisma.courseImport.deleteMany({ where: { userId } })
  const imported = await prisma.courseImport.create({
    data: {
      userId,
      fileName: file.fileName,
      mediaType: file.mediaType,
      storageKey: `metadata:${userId}:${Date.now()}:${file.size}`,
      status: "UPLOADED",
    },
  })
  return {
    id: imported.id,
    fileName: imported.fileName,
    mediaType: imported.mediaType,
    size: file.size,
    status: imported.status,
  }
}

export async function removeCourseImport(prisma, userId, importId) {
  const deleted = await prisma.courseImport.deleteMany({
    where: { id: importId, userId },
  })
  if (!deleted.count) {
    const error = new Error("Uploaded file was not found.")
    error.status = 404
    throw error
  }
}
