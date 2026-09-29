-- Migration: marketing review + usage tracking on media, and blob cleanup support
-- Run once on existing databases. Safe to re-run (every statement is IF NOT EXISTS).

-- When marketing looked at an upload, and who did.
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Where the asset has been used: any of 'web', 'social', 'print', 'email'.
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS used_on TEXT[] NOT NULL DEFAULT '{}';

-- The rename and image-edit queries write updated_at; it was never created.
ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_media_assets_reviewed ON media_assets(reviewed_at);
CREATE INDEX IF NOT EXISTS idx_media_assets_used_on ON media_assets USING GIN (used_on);

-- Existing uploads are treated as already seen so the review queue starts
-- with only what arrives from now on. Delete this statement before running
-- if you would rather review the backlog.
UPDATE media_assets SET reviewed_at = created_at WHERE reviewed_at IS NULL;

-- Verify
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'media_assets'
  AND column_name IN ('reviewed_at', 'reviewed_by', 'used_on', 'updated_at');
