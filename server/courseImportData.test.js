import { describe, expect, it, vi } from "vitest"
import {
  removeCourseImport,
  replaceCourseImport,
  validateCourseImportInput,
} from "./courseImportData.js"

const userId = "10000000-0000-4000-8000-000000000002"

function createPrismaMock() {
  return {
    courseImport: {
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
      create: vi.fn().mockResolvedValue({
        id: "70000000-0000-4000-8000-000000000010",
        status: "UPLOADED",
      }),
    },
  }
}

describe("course import data access", () => {
  it("replaces the current upload for one user through Prisma", async () => {
    const prisma = createPrismaMock()

    const result = await replaceCourseImport(prisma, userId, {
      fileName: "transfer-courses.csv",
      mediaType: "text/csv",
      size: 2048,
    })

    expect(result).toEqual({
      id: "70000000-0000-4000-8000-000000000010",
      status: "UPLOADED",
    })
    expect(prisma.courseImport.deleteMany).toHaveBeenCalledWith({
      where: { userId },
    })
    expect(prisma.courseImport.create).toHaveBeenCalledWith({
      data: { userId, status: "UPLOADED" },
    })
  })

  it("rejects unsupported or oversized uploads before touching Prisma", async () => {
    const prisma = createPrismaMock()

    expect(() =>
      validateCourseImportInput({
        fileName: "transcript.png",
        mediaType: "image/png",
        size: 100,
      }),
    ).toThrow("Choose a supported PDF, DOC, DOCX, or CSV file.")
    await expect(
      replaceCourseImport(prisma, userId, {
        fileName: "huge.pdf",
        mediaType: "application/pdf",
        size: 10 * 1024 * 1024 + 1,
      }),
    ).rejects.toThrow("Files must be between 1 byte and 10 MB.")
    expect(prisma.courseImport.deleteMany).not.toHaveBeenCalled()
    expect(prisma.courseImport.create).not.toHaveBeenCalled()
  })

  it("removes only the requested user's upload", async () => {
    const prisma = createPrismaMock()

    await removeCourseImport(
      prisma,
      userId,
      "70000000-0000-4000-8000-000000000010",
    )

    expect(prisma.courseImport.deleteMany).toHaveBeenCalledWith({
      where: { id: "70000000-0000-4000-8000-000000000010", userId },
    })
  })
})
