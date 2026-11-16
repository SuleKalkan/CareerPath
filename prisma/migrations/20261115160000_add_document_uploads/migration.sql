-- Reconstructed from prisma/schema.prisma and the existing initial migration.
-- The recovered CREATE TABLE SQL and reported Neon information_schema results
-- both contain 14 columns, matching the current Prisma model.
-- Neon confirms the course_imports.document_id unique index and FK actions below.
-- Review-only reconstruction; do not apply.

CREATE TYPE "document_status" AS ENUM ('PENDING_UPLOAD', 'UPLOADED', 'PROCESSING', 'READY', 'FAILED');
CREATE TYPE "document_type" AS ENUM ('RESUME', 'TRANSCRIPT', 'OTHER');

CREATE TABLE "documents" (
    "id" uuid PRIMARY KEY,
    "user_id" uuid NOT NULL,
    "type" document_type NOT NULL,
    "file_name" varchar(255) NOT NULL,
    "media_type" varchar(120) NOT NULL,
    "size_bytes" bigint NOT NULL,
    "storage_bucket" varchar(63) NOT NULL,
    "storage_key" varchar(500) NOT NULL,
    "sha256" char(64),
    "status" document_status DEFAULT 'PENDING_UPLOAD' NOT NULL,
    "error_message" text,
    "uploaded_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "documents_sha256_check"
        CHECK (((sha256 IS NULL) OR (sha256 ~ '^[0-9a-fA-F]{64}$'::text))),
    CONSTRAINT "documents_size_bytes_check"
        CHECK ((size_bytes >= 0))
);

CREATE UNIQUE INDEX "documents_storage_bucket_storage_key_key"
    ON "documents"("storage_bucket", "storage_key");
CREATE INDEX "documents_user_id_status_idx"
    ON "documents"("user_id", "status");
CREATE INDEX "documents_user_id_type_created_at_idx"
    ON "documents"("user_id", "type", "created_at");

ALTER TABLE "documents" ADD CONSTRAINT "documents_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "course_imports" ADD COLUMN "document_id" UUID;

CREATE UNIQUE INDEX "course_imports_document_id_key"
    ON "course_imports"("document_id");

ALTER TABLE "course_imports" ADD CONSTRAINT "course_imports_document_id_fkey"
    FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
