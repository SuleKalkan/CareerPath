ALTER TABLE "extracted_courses"
ADD COLUMN "credit_hours" DECIMAL(4, 1);

ALTER TABLE "student_courses"
ADD COLUMN "credits" DECIMAL(4, 1);

ALTER TABLE "student_courses"
ALTER COLUMN "institution_name" DROP NOT NULL;
