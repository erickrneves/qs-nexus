-- Migration: Create notifications system
-- Date: 2024-11-28

-- Create notification types enum
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
    CREATE TYPE "notification_type" AS ENUM (
      'upload_complete',
      'upload_failed',
      'sped_complete',
      'sped_failed',
      'classification_complete',
      'classification_failed',
      'workflow_complete',
      'workflow_failed',
      'system',
      'info'
    );
  END IF;
END $$;

-- Create notifications table
CREATE TABLE IF NOT EXISTS "notifications" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User/Organization
  "user_id" UUID,
  "organization_id" UUID,
  
  -- Notification data
  "type" "notification_type" NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "data" JSONB, -- Additional data (file names, URLs, etc)
  
  -- Status
  "read" BOOLEAN NOT NULL DEFAULT false,
  "read_at" TIMESTAMP,
  
  -- Related entity (optional)
  "related_entity_type" TEXT, -- 'sped_file', 'document_file', 'workflow', etc
  "related_entity_id" UUID,
  
  -- Timestamps
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "expires_at" TIMESTAMP -- Optional expiration
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "idx_notifications_user" ON "notifications"("user_id");
CREATE INDEX IF NOT EXISTS "idx_notifications_org" ON "notifications"("organization_id");
CREATE INDEX IF NOT EXISTS "idx_notifications_read" ON "notifications"("read");
CREATE INDEX IF NOT EXISTS "idx_notifications_created" ON "notifications"("created_at" DESC);
CREATE INDEX IF NOT EXISTS "idx_notifications_type" ON "notifications"("type");

-- Create index for unread notifications per user (most common query)
CREATE INDEX IF NOT EXISTS "idx_notifications_user_unread" 
ON "notifications"("user_id", "read") 
WHERE "read" = false;

