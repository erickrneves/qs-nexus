-- Migration: Fix document_type enum conflict
-- Created: 2025-12-03

-- Step 1: Create new enum for document categories (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_category') THEN
        CREATE TYPE document_category AS ENUM ('juridico', 'contabil', 'geral');
    END IF;
END$$;

-- Step 2: Ensure document_type enum has correct values for file types
DO $$
BEGIN
    -- Drop if exists with wrong values and recreate
    IF EXISTS (SELECT 1 FROM pg_enum e 
               JOIN pg_type t ON e.enumtypid = t.oid 
               WHERE t.typname = 'document_type' 
               AND e.enumlabel IN ('juridico', 'contabil', 'geral')) THEN
        
        -- Temporarily change column types to text
        ALTER TABLE classification_configs 
        ALTER COLUMN document_type TYPE text;
        
        ALTER TABLE template_schema_configs 
        ALTER COLUMN document_type TYPE text;
        
        -- Drop the incorrect enum
        DROP TYPE IF EXISTS document_type CASCADE;
        
        -- Create correct enum
        CREATE TYPE document_type AS ENUM ('pdf', 'docx', 'doc', 'txt', 'other');
        
        -- Convert columns to use new enums
        ALTER TABLE classification_configs 
        ALTER COLUMN document_type TYPE document_category 
        USING CASE 
            WHEN document_type = 'juridico' THEN 'juridico'::document_category
            WHEN document_type = 'contabil' THEN 'contabil'::document_category
            ELSE 'geral'::document_category
        END;
        
        ALTER TABLE template_schema_configs 
        ALTER COLUMN document_type TYPE document_category 
        USING CASE 
            WHEN document_type = 'juridico' THEN 'juridico'::document_category
            WHEN document_type = 'contabil' THEN 'contabil'::document_category
            ELSE 'geral'::document_category
        END;
    ELSE
        -- Enum already correct or doesn't exist, just ensure it exists
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'document_type') THEN
            CREATE TYPE document_type AS ENUM ('pdf', 'docx', 'doc', 'txt', 'other');
        END IF;
    END IF;
END$$;

-- Step 3: Rename columns in affected tables
DO $$
BEGIN
    -- classification_configs
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'classification_configs' 
               AND column_name = 'document_type') THEN
        ALTER TABLE classification_configs 
        RENAME COLUMN document_type TO document_category;
    END IF;
    
    -- template_schema_configs
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'template_schema_configs' 
               AND column_name = 'document_type') THEN
        ALTER TABLE template_schema_configs 
        RENAME COLUMN document_type TO document_category;
    END IF;
END$$;

