-- Migration: Add organization_id to document_files and create SPED tables
-- Date: 2024-11-28

-- Add organization_id to document_files if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'document_files' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE "document_files" ADD COLUMN "organization_id" uuid;
  END IF;
END $$;

-- Add created_by to document_files if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'document_files' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE "document_files" ADD COLUMN "created_by" uuid;
  END IF;
END $$;

-- Create SPED file type enum if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sped_file_type') THEN
    CREATE TYPE "sped_file_type" AS ENUM ('ecd', 'ecf', 'efd_icms_ipi', 'efd_contribuicoes', 'other');
  END IF;
END $$;

-- Create SPED status enum if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sped_status') THEN
    CREATE TYPE "sped_status" AS ENUM ('pending', 'processing', 'completed', 'failed');
  END IF;
END $$;

-- Create account nature enum if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_nature') THEN
    CREATE TYPE "account_nature" AS ENUM ('ativo', 'passivo', 'patrimonio_liquido', 'receita', 'despesa', 'resultado');
  END IF;
END $$;

-- Create sped_files table
CREATE TABLE IF NOT EXISTS "sped_files" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "file_name" text NOT NULL,
  "file_path" text NOT NULL,
  "file_hash" text NOT NULL UNIQUE,
  "file_type" "sped_file_type" NOT NULL DEFAULT 'ecd',
  "cnpj" text NOT NULL,
  "company_name" text NOT NULL,
  "state_code" text,
  "city_code" text,
  "period_start" date NOT NULL,
  "period_end" date NOT NULL,
  "status" "sped_status" NOT NULL DEFAULT 'pending',
  "error_message" text,
  "total_records" integer DEFAULT 0,
  "processed_records" integer DEFAULT 0,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create chart_of_accounts table
CREATE TABLE IF NOT EXISTS "chart_of_accounts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "sped_file_id" uuid NOT NULL REFERENCES "sped_files"("id") ON DELETE CASCADE,
  "account_code" text NOT NULL,
  "account_name" text NOT NULL,
  "account_type" char(1) NOT NULL,
  "account_level" integer NOT NULL,
  "parent_account_code" text,
  "account_nature" "account_nature",
  "referential_code" text,
  "cost_center_code" text,
  "start_date" date,
  "metadata" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Create account_balances table
CREATE TABLE IF NOT EXISTS "account_balances" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "sped_file_id" uuid NOT NULL REFERENCES "sped_files"("id") ON DELETE CASCADE,
  "chart_of_account_id" uuid REFERENCES "chart_of_accounts"("id") ON DELETE SET NULL,
  "account_code" text NOT NULL,
  "period_date" date NOT NULL,
  "initial_balance" decimal(15, 2) DEFAULT '0',
  "debit_total" decimal(15, 2) DEFAULT '0',
  "credit_total" decimal(15, 2) DEFAULT '0',
  "final_balance" decimal(15, 2) DEFAULT '0',
  "initial_balance_indicator" char(1),
  "final_balance_indicator" char(1),
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Create journal_entries table
CREATE TABLE IF NOT EXISTS "journal_entries" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "sped_file_id" uuid NOT NULL REFERENCES "sped_files"("id") ON DELETE CASCADE,
  "entry_number" text NOT NULL,
  "entry_date" date NOT NULL,
  "entry_amount" decimal(15, 2) NOT NULL,
  "entry_type" text,
  "description" text,
  "document_number" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Create journal_items table
CREATE TABLE IF NOT EXISTS "journal_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "journal_entry_id" uuid NOT NULL REFERENCES "journal_entries"("id") ON DELETE CASCADE,
  "chart_of_account_id" uuid REFERENCES "chart_of_accounts"("id") ON DELETE SET NULL,
  "account_code" text NOT NULL,
  "amount" decimal(15, 2) NOT NULL,
  "debit_credit" char(1) NOT NULL,
  "item_description" text,
  "contra_account_code" text,
  "cost_center_code" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_chart_of_accounts_sped_file" ON "chart_of_accounts"("sped_file_id");
CREATE INDEX IF NOT EXISTS "idx_chart_of_accounts_code" ON "chart_of_accounts"("account_code");
CREATE INDEX IF NOT EXISTS "idx_account_balances_sped_file" ON "account_balances"("sped_file_id");
CREATE INDEX IF NOT EXISTS "idx_account_balances_account" ON "account_balances"("account_code");
CREATE INDEX IF NOT EXISTS "idx_journal_entries_sped_file" ON "journal_entries"("sped_file_id");
CREATE INDEX IF NOT EXISTS "idx_journal_entries_date" ON "journal_entries"("entry_date");
CREATE INDEX IF NOT EXISTS "idx_journal_items_entry" ON "journal_items"("journal_entry_id");
CREATE INDEX IF NOT EXISTS "idx_sped_files_cnpj" ON "sped_files"("cnpj");
CREATE INDEX IF NOT EXISTS "idx_sped_files_period" ON "sped_files"("period_start", "period_end");

