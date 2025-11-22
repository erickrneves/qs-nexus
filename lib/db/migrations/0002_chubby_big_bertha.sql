CREATE TYPE "public"."model_provider" AS ENUM('openai', 'google');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "classification_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"system_prompt" text NOT NULL,
	"model_provider" "model_provider" NOT NULL,
	"model_name" text NOT NULL,
	"max_input_tokens" integer NOT NULL,
	"max_output_tokens" integer NOT NULL,
	"extraction_function_code" text,
	"is_active" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "template_schema_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"fields" jsonb NOT NULL,
	"is_active" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "templates" ALTER COLUMN "doc_type" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "templates" ALTER COLUMN "area" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "templates" ALTER COLUMN "jurisdiction" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "templates" ALTER COLUMN "complexity" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "templates" ALTER COLUMN "summary" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "templates" ADD COLUMN "schema_config_id" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "templates" ADD CONSTRAINT "templates_schema_config_id_template_schema_configs_id_fk" FOREIGN KEY ("schema_config_id") REFERENCES "public"."template_schema_configs"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
