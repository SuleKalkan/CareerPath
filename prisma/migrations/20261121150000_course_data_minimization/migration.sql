UPDATE "roadmap_activities" AS activity
SET
    "title" = left(course."course_title", 100),
    "duration" = 'Completed course',
    "description" = 'Completed course added from an uploaded course list.'
FROM "student_courses" AS course
WHERE activity."student_course_id" = course."id";

DELETE FROM "student_courses"
WHERE "completion_status" <> 'COMPLETED';

DELETE FROM "extracted_courses"
WHERE "course_title" IS NULL OR length(trim("course_title")) = 0;

ALTER TABLE "extracted_courses"
    ALTER COLUMN "course_title" SET NOT NULL,
    DROP COLUMN "raw_text",
    DROP COLUMN "institution_name",
    DROP COLUMN "course_code",
    DROP COLUMN "credit_hours",
    DROP COLUMN "term",
    DROP COLUMN "grade",
    DROP COLUMN "confidence",
    DROP COLUMN "review_note";

WITH ranked_courses AS (
    SELECT
        "id",
        row_number() OVER (
            PARTITION BY
                "user_id",
                CASE
                    WHEN "course_id" IS NOT NULL THEN 'course-id:' || "course_id"::text
                    ELSE 'course-title:' || lower(regexp_replace("course_title", '[^[:alnum:]]+', '', 'g'))
                END
            ORDER BY "created_at", "id"
        ) AS position
    FROM "student_courses"
),
duplicate_courses AS (
    SELECT "id" FROM ranked_courses WHERE position > 1
)
UPDATE "roadmap_activities"
SET "student_course_id" = NULL
WHERE "student_course_id" IN (SELECT "id" FROM duplicate_courses);

WITH ranked_courses AS (
    SELECT
        "id",
        row_number() OVER (
            PARTITION BY
                "user_id",
                CASE
                    WHEN "course_id" IS NOT NULL THEN 'course-id:' || "course_id"::text
                    ELSE 'course-title:' || lower(regexp_replace("course_title", '[^[:alnum:]]+', '', 'g'))
                END
            ORDER BY "created_at", "id"
        ) AS position
    FROM "student_courses"
)
DELETE FROM "student_courses"
WHERE "id" IN (SELECT "id" FROM ranked_courses WHERE position > 1);

UPDATE "student_courses"
SET "deduplication_key" = CASE
    WHEN "course_id" IS NOT NULL THEN 'course-id:' || "course_id"::text
    ELSE 'course-title:' || lower(regexp_replace("course_title", '[^[:alnum:]]+', '', 'g'))
END;

ALTER TABLE "student_courses"
    DROP COLUMN "source_import_id",
    DROP COLUMN "institution_name",
    DROP COLUMN "course_code",
    DROP COLUMN "credits",
    DROP COLUMN "term",
    DROP COLUMN "grade",
    DROP COLUMN "completion_status";

DROP INDEX IF EXISTS "student_courses_user_id_completion_status_idx";

ALTER TABLE "course_imports"
    DROP COLUMN "file_name",
    DROP COLUMN "media_type",
    DROP COLUMN "storage_key",
    DROP COLUMN "error_message";

DROP INDEX IF EXISTS "course_imports_storage_key_key";

DELETE FROM "documents"
WHERE "id" IN (
    SELECT "document_id"
    FROM "course_imports"
    WHERE "document_id" IS NOT NULL
);

ALTER TABLE "course_imports"
    DROP CONSTRAINT IF EXISTS "course_imports_document_id_fkey";

DROP INDEX IF EXISTS "course_imports_document_id_key";

ALTER TABLE "course_imports"
    DROP COLUMN "document_id";

CREATE INDEX "student_courses_user_id_created_at_idx"
    ON "student_courses"("user_id", "created_at");

DROP TYPE IF EXISTS "course_completion_status";
