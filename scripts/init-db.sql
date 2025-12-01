-- Taylor Media Hub Database Schema
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

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_media_assets_owner ON media_assets(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_created ON media_assets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_assets_client ON media_assets(client_name);
