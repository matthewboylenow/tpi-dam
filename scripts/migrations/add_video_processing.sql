-- Migration: server-side video processing (poster frames, dimensions, status)
-- Safe to re-run.

ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS poster_url TEXT;
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS width INTEGER;
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS height INTEGER;
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS duration_seconds REAL;
-- 'done' for images and processed videos; 'pending' / 'processing' / 'failed' for videos in flight.
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS processing_status TEXT NOT NULL DEFAULT 'done';
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS processing_error TEXT;

-- Existing videos get picked up by scripts/process-videos.ts
UPDATE media_assets
SET processing_status = 'pending'
WHERE mime_type LIKE 'video/%' AND poster_url IS NULL AND processing_status = 'done';

SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'media_assets'
  AND column_name IN ('poster_url', 'width', 'height', 'duration_seconds', 'processing_status', 'processing_error');
