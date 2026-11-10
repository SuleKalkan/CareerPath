CREATE TYPE "student_proficiency" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');
CREATE TYPE "activity_category" AS ENUM ('SKILL', 'COURSE', 'PROJECT', 'CAREER_PREP', 'NETWORKING', 'TRANSFER_CREDIT', 'OTHER');
CREATE TYPE "activity_status" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');
CREATE TYPE "course_completion_status" AS ENUM ('COMPLETED', 'TRANSFERRED', 'IN_PROGRESS');
CREATE TYPE "course_import_status" AS ENUM ('UPLOADED', 'PROCESSING', 'REVIEW_REQUIRED', 'CONFIRMED', 'FAILED');
CREATE TYPE "extracted_course_review_status" AS ENUM ('PENDING', 'RECOGNIZED', 'UNRECOGNIZED', 'CONFIRMED', 'REMOVED');
CREATE TYPE "job_type" AS ENUM ('INTERNSHIP', 'CO_OP', 'ENTRY_LEVEL', 'FULL_TIME', 'PART_TIME', 'CONTRACT', 'OTHER');
CREATE TYPE "job_status" AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED');

CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "display_name" VARCHAR(160) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "careers" (
    "id" UUID NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "normalized_title" VARCHAR(160) NOT NULL,
    "description" TEXT NOT NULL,
    "responsibilities" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "education_expectations" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "careers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "skills" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "normalized_name" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "interests" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "normalized_name" VARCHAR(120) NOT NULL,
    CONSTRAINT "interests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "student_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "university" VARCHAR(200),
    "college" VARCHAR(200),
    "concentration" VARCHAR(160),
    "academic_level" VARCHAR(80),
    "expected_graduation" DATE,
    "target_career_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "student_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "student_skills" (
    "user_id" UUID NOT NULL,
    "skill_id" UUID NOT NULL,
    "proficiency" "student_proficiency",
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "student_skills_pkey" PRIMARY KEY ("user_id", "skill_id")
);

CREATE TABLE "student_interests" (
    "user_id" UUID NOT NULL,
    "interest_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "student_interests_pkey" PRIMARY KEY ("user_id", "interest_id")
);

CREATE TABLE "career_skills" (
    "career_id" UUID NOT NULL,
    "skill_id" UUID NOT NULL,
    "importance" DECIMAL(5,2) NOT NULL DEFAULT 1.00,
    CONSTRAINT "career_skills_pkey" PRIMARY KEY ("career_id", "skill_id"),
    CONSTRAINT "career_skills_importance_check" CHECK ("importance" > 0)
);

CREATE TABLE "career_preparation_steps" (
    "id" UUID NOT NULL,
    "career_id" UUID NOT NULL,
    "skill_id" UUID,
    "title" VARCHAR(160) NOT NULL,
    "description" TEXT NOT NULL,
    "category" "activity_category" NOT NULL DEFAULT 'CAREER_PREP',
    "sequence" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "career_preparation_steps_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "career_preparation_steps_sequence_check" CHECK ("sequence" >= 0)
);

CREATE TABLE "roadmaps" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "career_id" UUID NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "roadmaps_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "courses" (
    "id" UUID NOT NULL,
    "institution_name" VARCHAR(200) NOT NULL,
    "course_code" VARCHAR(80),
    "title" VARCHAR(200) NOT NULL,
    "identity_key" VARCHAR(240) NOT NULL,
    "credits" DECIMAL(4,1),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "courses_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "courses_credits_check" CHECK ("credits" IS NULL OR "credits" >= 0)
);

CREATE TABLE "course_skills" (
    "course_id" UUID NOT NULL,
    "skill_id" UUID NOT NULL,
    CONSTRAINT "course_skills_pkey" PRIMARY KEY ("course_id", "skill_id")
);

CREATE TABLE "course_imports" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "media_type" VARCHAR(120) NOT NULL,
    "storage_key" VARCHAR(500) NOT NULL,
    "status" "course_import_status" NOT NULL DEFAULT 'UPLOADED',
    "error_message" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "course_imports_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "student_courses" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "course_id" UUID,
    "source_import_id" UUID,
    "institution_name" VARCHAR(200) NOT NULL,
    "course_code" VARCHAR(80),
    "course_title" VARCHAR(200) NOT NULL,
    "term" VARCHAR(80),
    "grade" VARCHAR(40),
    "deduplication_key" VARCHAR(300) NOT NULL,
    "completion_status" "course_completion_status" NOT NULL DEFAULT 'COMPLETED',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "student_courses_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "student_courses_deduplication_key_check" CHECK (length(trim("deduplication_key")) > 0)
);

CREATE TABLE "extracted_courses" (
    "id" UUID NOT NULL,
    "course_import_id" UUID NOT NULL,
    "recognized_course_id" UUID,
    "student_course_id" UUID,
    "raw_text" TEXT NOT NULL,
    "institution_name" VARCHAR(200),
    "course_code" VARCHAR(80),
    "course_title" VARCHAR(200),
    "term" VARCHAR(80),
    "grade" VARCHAR(40),
    "confidence" DECIMAL(5,4),
    "review_status" "extracted_course_review_status" NOT NULL DEFAULT 'PENDING',
    "review_note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "extracted_courses_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "extracted_courses_confidence_check" CHECK ("confidence" IS NULL OR ("confidence" >= 0 AND "confidence" <= 1))
);

CREATE TABLE "employers" (
    "id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "normalized_name" VARCHAR(200) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "employers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "job_opportunities" (
    "id" UUID NOT NULL,
    "employer_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT NOT NULL,
    "location" VARCHAR(200) NOT NULL,
    "type" "job_type" NOT NULL,
    "status" "job_status" NOT NULL DEFAULT 'ACTIVE',
    "posted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closes_at" TIMESTAMPTZ(6),
    "external_url" VARCHAR(2048),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "job_opportunities_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "job_opportunities_closes_at_check" CHECK ("closes_at" IS NULL OR "closes_at" >= "posted_at")
);

CREATE TABLE "job_skills" (
    "job_id" UUID NOT NULL,
    "skill_id" UUID NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "importance" DECIMAL(5,2) NOT NULL DEFAULT 1.00,
    CONSTRAINT "job_skills_pkey" PRIMARY KEY ("job_id", "skill_id"),
    CONSTRAINT "job_skills_importance_check" CHECK ("importance" > 0)
);

CREATE TABLE "saved_jobs" (
    "user_id" UUID NOT NULL,
    "job_id" UUID NOT NULL,
    "saved_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "saved_jobs_pkey" PRIMARY KEY ("user_id", "job_id")
);

CREATE TABLE "roadmap_activities" (
    "id" UUID NOT NULL,
    "roadmap_id" UUID NOT NULL,
    "preparation_step_id" UUID,
    "skill_id" UUID,
    "student_course_id" UUID,
    "title" VARCHAR(100) NOT NULL,
    "category" "activity_category" NOT NULL,
    "duration" VARCHAR(40) NOT NULL DEFAULT 'Flexible',
    "description" VARCHAR(240) NOT NULL,
    "status" "activity_status" NOT NULL DEFAULT 'NOT_STARTED',
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "roadmap_activities_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "roadmap_activities_position_check" CHECK ("position" >= 0)
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "careers_normalized_title_key" ON "careers"("normalized_title");
CREATE UNIQUE INDEX "skills_normalized_name_key" ON "skills"("normalized_name");
CREATE UNIQUE INDEX "interests_normalized_name_key" ON "interests"("normalized_name");
CREATE UNIQUE INDEX "student_profiles_user_id_key" ON "student_profiles"("user_id");
CREATE INDEX "student_profiles_target_career_id_idx" ON "student_profiles"("target_career_id");
CREATE INDEX "student_skills_skill_id_idx" ON "student_skills"("skill_id");
CREATE INDEX "student_interests_interest_id_idx" ON "student_interests"("interest_id");
CREATE INDEX "career_skills_skill_id_idx" ON "career_skills"("skill_id");
CREATE UNIQUE INDEX "career_preparation_steps_career_id_sequence_key" ON "career_preparation_steps"("career_id", "sequence");
CREATE INDEX "career_preparation_steps_skill_id_idx" ON "career_preparation_steps"("skill_id");
CREATE UNIQUE INDEX "roadmaps_user_id_career_id_key" ON "roadmaps"("user_id", "career_id");
CREATE INDEX "roadmaps_career_id_idx" ON "roadmaps"("career_id");
CREATE UNIQUE INDEX "courses_institution_name_identity_key_key" ON "courses"("institution_name", "identity_key");
CREATE INDEX "courses_course_code_idx" ON "courses"("course_code");
CREATE INDEX "course_skills_skill_id_idx" ON "course_skills"("skill_id");
CREATE UNIQUE INDEX "course_imports_storage_key_key" ON "course_imports"("storage_key");
CREATE INDEX "course_imports_user_id_created_at_idx" ON "course_imports"("user_id", "created_at");
CREATE INDEX "course_imports_status_idx" ON "course_imports"("status");
CREATE UNIQUE INDEX "student_courses_user_id_deduplication_key_key" ON "student_courses"("user_id", "deduplication_key");
CREATE INDEX "student_courses_user_id_completion_status_idx" ON "student_courses"("user_id", "completion_status");
CREATE INDEX "student_courses_course_id_idx" ON "student_courses"("course_id");
CREATE UNIQUE INDEX "extracted_courses_student_course_id_key" ON "extracted_courses"("student_course_id");
CREATE INDEX "extracted_courses_course_import_id_review_status_idx" ON "extracted_courses"("course_import_id", "review_status");
CREATE INDEX "extracted_courses_recognized_course_id_idx" ON "extracted_courses"("recognized_course_id");
CREATE UNIQUE INDEX "employers_normalized_name_key" ON "employers"("normalized_name");
CREATE INDEX "job_opportunities_status_posted_at_idx" ON "job_opportunities"("status", "posted_at");
CREATE INDEX "job_opportunities_employer_id_idx" ON "job_opportunities"("employer_id");
CREATE INDEX "job_skills_skill_id_idx" ON "job_skills"("skill_id");
CREATE INDEX "saved_jobs_job_id_idx" ON "saved_jobs"("job_id");
CREATE UNIQUE INDEX "roadmap_activities_student_course_id_key" ON "roadmap_activities"("student_course_id");
CREATE UNIQUE INDEX "roadmap_activities_roadmap_id_preparation_step_id_key" ON "roadmap_activities"("roadmap_id", "preparation_step_id");
CREATE INDEX "roadmap_activities_roadmap_id_position_idx" ON "roadmap_activities"("roadmap_id", "position");
CREATE INDEX "roadmap_activities_skill_id_status_idx" ON "roadmap_activities"("skill_id", "status");

ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_target_career_id_fkey"
    FOREIGN KEY ("target_career_id") REFERENCES "careers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "student_skills" ADD CONSTRAINT "student_skills_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "student_skills" ADD CONSTRAINT "student_skills_skill_id_fkey"
    FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "student_interests" ADD CONSTRAINT "student_interests_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "student_interests" ADD CONSTRAINT "student_interests_interest_id_fkey"
    FOREIGN KEY ("interest_id") REFERENCES "interests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "career_skills" ADD CONSTRAINT "career_skills_career_id_fkey"
    FOREIGN KEY ("career_id") REFERENCES "careers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "career_skills" ADD CONSTRAINT "career_skills_skill_id_fkey"
    FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "career_preparation_steps" ADD CONSTRAINT "career_preparation_steps_career_id_fkey"
    FOREIGN KEY ("career_id") REFERENCES "careers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "career_preparation_steps" ADD CONSTRAINT "career_preparation_steps_skill_id_fkey"
    FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "roadmaps" ADD CONSTRAINT "roadmaps_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "roadmaps" ADD CONSTRAINT "roadmaps_career_id_fkey"
    FOREIGN KEY ("career_id") REFERENCES "careers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "roadmap_activities" ADD CONSTRAINT "roadmap_activities_roadmap_id_fkey"
    FOREIGN KEY ("roadmap_id") REFERENCES "roadmaps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "roadmap_activities" ADD CONSTRAINT "roadmap_activities_preparation_step_id_fkey"
    FOREIGN KEY ("preparation_step_id") REFERENCES "career_preparation_steps"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "roadmap_activities" ADD CONSTRAINT "roadmap_activities_skill_id_fkey"
    FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "roadmap_activities" ADD CONSTRAINT "roadmap_activities_student_course_id_fkey"
    FOREIGN KEY ("student_course_id") REFERENCES "student_courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "course_skills" ADD CONSTRAINT "course_skills_course_id_fkey"
    FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "course_skills" ADD CONSTRAINT "course_skills_skill_id_fkey"
    FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "course_imports" ADD CONSTRAINT "course_imports_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "student_courses" ADD CONSTRAINT "student_courses_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "student_courses" ADD CONSTRAINT "student_courses_course_id_fkey"
    FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "student_courses" ADD CONSTRAINT "student_courses_source_import_id_fkey"
    FOREIGN KEY ("source_import_id") REFERENCES "course_imports"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "extracted_courses" ADD CONSTRAINT "extracted_courses_course_import_id_fkey"
    FOREIGN KEY ("course_import_id") REFERENCES "course_imports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "extracted_courses" ADD CONSTRAINT "extracted_courses_recognized_course_id_fkey"
    FOREIGN KEY ("recognized_course_id") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "extracted_courses" ADD CONSTRAINT "extracted_courses_student_course_id_fkey"
    FOREIGN KEY ("student_course_id") REFERENCES "student_courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "job_opportunities" ADD CONSTRAINT "job_opportunities_employer_id_fkey"
    FOREIGN KEY ("employer_id") REFERENCES "employers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "job_skills" ADD CONSTRAINT "job_skills_job_id_fkey"
    FOREIGN KEY ("job_id") REFERENCES "job_opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "job_skills" ADD CONSTRAINT "job_skills_skill_id_fkey"
    FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "saved_jobs" ADD CONSTRAINT "saved_jobs_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "saved_jobs" ADD CONSTRAINT "saved_jobs_job_id_fkey"
    FOREIGN KEY ("job_id") REFERENCES "job_opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
