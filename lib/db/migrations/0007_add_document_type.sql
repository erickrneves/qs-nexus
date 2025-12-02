-- Migration: Add document_type field to classification and schema configs
-- Date: 2024-11-28

-- Create enum for document types
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_type') THEN
    CREATE TYPE "document_type" AS ENUM ('juridico', 'contabil', 'geral');
  END IF;
END $$;

-- Add document_type to classification_configs
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'classification_configs' AND column_name = 'document_type'
  ) THEN
    ALTER TABLE "classification_configs" ADD COLUMN "document_type" "document_type" DEFAULT 'geral';
  END IF;
END $$;

-- Add document_type to template_schema_configs
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'template_schema_configs' AND column_name = 'document_type'
  ) THEN
    ALTER TABLE "template_schema_configs" ADD COLUMN "document_type" "document_type" DEFAULT 'geral';
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS "idx_classification_configs_doc_type" 
ON "classification_configs"("document_type");

CREATE INDEX IF NOT EXISTS "idx_template_schema_configs_doc_type" 
ON "template_schema_configs"("document_type");

-- Update existing configs to 'juridico' if they exist
UPDATE "classification_configs" 
SET "document_type" = 'juridico' 
WHERE "document_type" = 'geral' AND "name" LIKE '%Jurídico%';

UPDATE "template_schema_configs" 
SET "document_type" = 'juridico' 
WHERE "document_type" = 'geral' AND "name" LIKE '%Jurídico%';

