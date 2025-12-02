-- Taylor Products Digital Asset Management Database Schema
-- Run this SQL script manually or use the TypeScript init script

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'sales', -- 'sales' or 'admin'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Media assets table
CREATE TABLE IF NOT EXISTS media_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blob_url TEXT NOT NULL,
  caption TEXT,
  client_name TEXT,
  mime_type TEXT,
  file_size BIGINT,
  folder_id UUID,
  is_starred BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- Media-tags junction table (many-to-many)
CREATE TABLE IF NOT EXISTS media_tags (
  media_id UUID NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
  tag_id INT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (media_id, tag_id)
);

-- Folders table (global folders created by admins)
CREATE TABLE IF NOT EXISTS folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Invitations table (email invitations for user registration)
CREATE TABLE IF NOT EXISTS invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'sales',
  invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add foreign key constraint for folder_id (after folders table is created)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'media_assets_folder_id_fkey'
  ) THEN
    ALTER TABLE media_assets
    ADD CONSTRAINT media_assets_folder_id_fkey
    FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_media_assets_owner ON media_assets(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_created ON media_assets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_assets_client ON media_assets(client_name);
CREATE INDEX IF NOT EXISTS idx_media_assets_folder ON media_assets(folder_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_starred ON media_assets(is_starred, created_at);
CREATE INDEX IF NOT EXISTS idx_folders_created_by ON folders(created_by);
CREATE INDEX IF NOT EXISTS idx_folders_name ON folders(name);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_expires_at ON invitations(expires_at);
