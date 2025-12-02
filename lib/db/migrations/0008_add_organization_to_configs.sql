-- Migration: Add organization_id to classification and template schema configs
-- Date: 2024-11-28

-- Add organization_id to classification_configs (nullable for global configs)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'classification_configs' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE "classification_configs" ADD COLUMN "organization_id" UUID;
  END IF;
END $$;

-- Add organization_id to template_schema_configs (nullable for global schemas)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'template_schema_configs' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE "template_schema_configs" ADD COLUMN "organization_id" UUID;
  END IF;
END $$;

-- Create indexes for organization_id
CREATE INDEX IF NOT EXISTS "idx_classification_configs_org" 
ON "classification_configs"("organization_id");

CREATE INDEX IF NOT EXISTS "idx_template_schema_configs_org" 
ON "template_schema_configs"("organization_id");

