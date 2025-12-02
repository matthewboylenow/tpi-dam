-- Migration: Add starring functionality to folders
-- Run this on existing databases that were created before folder starring feature

-- Add is_starred column to folders table
ALTER TABLE folders ADD COLUMN IF NOT EXISTS is_starred BOOLEAN DEFAULT FALSE;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_folders_starred ON folders(is_starred, created_at);

-- Verify
SELECT
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'folders'
  AND column_name = 'is_starred';
