CREATE EXTENSION IF NOT EXISTS vector;--> statement-breakpoint
CREATE TYPE "public"."area" AS ENUM('civil', 'trabalhista', 'tributario', 'empresarial', 'consumidor', 'penal', 'administrativo', 'previdenciario', 'outro');--> statement-breakpoint
CREATE TYPE "public"."complexity" AS ENUM('simples', 'medio', 'complexo');--> statement-breakpoint
CREATE TYPE "public"."doc_type" AS ENUM('peticao_inicial', 'contestacao', 'recurso', 'parecer', 'contrato', 'modelo_generico', 'outro');--> statement-breakpoint
CREATE TYPE "public"."file_status" AS ENUM('pending', 'processing', 'completed', 'failed', 'rejected');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "document_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"file_path" text NOT NULL,
	"file_name" text NOT NULL,
	"file_hash" text NOT NULL,
	"status" "file_status" DEFAULT 'pending' NOT NULL,
	"rejected_reason" text,
	"words_count" integer,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "document_files_file_path_unique" UNIQUE("file_path")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "template_chunks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"section" text,
	"role" text,
	"content_markdown" text NOT NULL,
	"chunk_index" integer NOT NULL,
	"embedding" vector(1536),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_file_id" uuid NOT NULL,
	"title" text NOT NULL,
	"doc_type" "doc_type" NOT NULL,
	"area" "area" NOT NULL,
	"jurisdiction" text DEFAULT 'BR' NOT NULL,
	"complexity" "complexity" NOT NULL,
	"tags" text[] DEFAULT '{}',
	"summary" text NOT NULL,
	"markdown" text NOT NULL,
	"metadata" jsonb,
	"quality_score" numeric(5, 2),
	"is_gold" boolean DEFAULT false,
	"is_silver" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "template_chunks" ADD CONSTRAINT "template_chunks_template_id_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "templates" ADD CONSTRAINT "templates_document_file_id_document_files_id_fk" FOREIGN KEY ("document_file_id") REFERENCES "public"."document_files"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_document_files_file_path" ON "document_files"("file_path");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_document_files_file_hash" ON "document_files"("file_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_document_files_status" ON "document_files"("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_templates_doc_type" ON "templates"("doc_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_templates_area" ON "templates"("area");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_template_chunks_template_id" ON "template_chunks"("template_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_template_chunks_embedding_hnsw" ON "template_chunks" USING hnsw ("embedding" vector_cosine_ops) WITH (m = 16, ef_construction = 64);
