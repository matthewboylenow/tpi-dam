import { sql } from "@vercel/postgres";

/**
 * Database client wrapper for Vercel Postgres
 * Uses the @vercel/postgres package which automatically
 * connects using environment variables (POSTGRES_URL)
 */
export const db = sql;

/**
 * Initialize database tables
 * This should be run once to set up the schema
 */
export async function initializeDatabase() {
  try {
    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        name TEXT,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'sales',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    // Create media_assets table
    await sql`
      CREATE TABLE IF NOT EXISTS media_assets (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        blob_url TEXT NOT NULL,
        caption TEXT,
        client_name TEXT,
        mime_type TEXT,
        file_size BIGINT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    // Create tags table
    await sql`
      CREATE TABLE IF NOT EXISTS tags (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE
      )
    `;

    // Create media_tags junction table
    await sql`
      CREATE TABLE IF NOT EXISTS media_tags (
        media_id UUID NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
        tag_id INT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
        PRIMARY KEY (media_id, tag_id)
      )
    `;

    // Create indices for performance
    await sql`
      CREATE INDEX IF NOT EXISTS idx_media_assets_owner
      ON media_assets(owner_user_id)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_media_assets_created
      ON media_assets(created_at DESC)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_media_assets_client
      ON media_assets(client_name)
    `;

    console.log("Database initialized successfully");
    return { success: true };
  } catch (error) {
    console.error("Database initialization error:", error);
    throw error;
  }
}
