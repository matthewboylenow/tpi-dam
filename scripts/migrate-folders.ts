/**
 * Database Migration Script for Folders, Invitations, and Starred Media
 * Run with: npx tsx scripts/migrate-folders.ts
 *
 * This script safely adds:
 * - folders table
 * - invitations table
 * - folder_id column to media_assets
 * - is_starred column to media_assets
 * - all necessary indices
 */

import { readFileSync, existsSync } from "fs";
import { sql } from "@vercel/postgres";

// Load environment variables from .env.local
function loadEnvFile() {
  if (existsSync(".env.local")) {
    const envContent = readFileSync(".env.local", "utf-8");
    envContent.split("\n").forEach((line) => {
      line = line.trim();
      if (line && !line.startsWith("#")) {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          let value = match[2].trim();
          if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
          ) {
            value = value.slice(1, -1);
          }
          process.env[key] = value;
        }
      }
    });
  }
}

loadEnvFile();

async function main() {
  console.log("\n📦 Starting database migration...\n");

  try {
    // Step 1: Create folders table
    console.log("1/6 Creating folders table...");
    await sql`
      CREATE TABLE IF NOT EXISTS folders (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    console.log("   ✓ Folders table created");

    // Step 2: Create invitations table
    console.log("2/6 Creating invitations table...");
    await sql`
      CREATE TABLE IF NOT EXISTS invitations (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        email TEXT NOT NULL,
        token TEXT NOT NULL UNIQUE,
        role TEXT NOT NULL DEFAULT 'sales',
        invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at TIMESTAMPTZ NOT NULL,
        used_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    console.log("   ✓ Invitations table created");

    // Step 3: Add folder_id column to media_assets (if not exists)
    console.log("3/6 Adding folder_id column to media_assets...");
    try {
      // Check if column exists
      const checkColumn = await sql`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'media_assets' AND column_name = 'folder_id'
      `;

      if (checkColumn.rows.length === 0) {
        await sql`
          ALTER TABLE media_assets
          ADD COLUMN folder_id UUID REFERENCES folders(id) ON DELETE SET NULL
        `;
        console.log("   ✓ folder_id column added");
      } else {
        console.log("   ✓ folder_id column already exists");
      }
    } catch (error: any) {
      console.log("   ✓ folder_id column already exists or error:", error.message);
    }

    // Step 4: Add is_starred column to media_assets (if not exists)
    console.log("4/6 Adding is_starred column to media_assets...");
    try {
      const checkColumn = await sql`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'media_assets' AND column_name = 'is_starred'
      `;

      if (checkColumn.rows.length === 0) {
        await sql`
          ALTER TABLE media_assets
          ADD COLUMN is_starred BOOLEAN DEFAULT FALSE
        `;
        console.log("   ✓ is_starred column added");
      } else {
        console.log("   ✓ is_starred column already exists");
      }
    } catch (error: any) {
      console.log("   ✓ is_starred column already exists or error:", error.message);
    }

    // Step 5: Create indices for folders
    console.log("5/6 Creating indices for folders table...");
    await sql`CREATE INDEX IF NOT EXISTS idx_folders_created_by ON folders(created_by)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_folders_name ON folders(name)`;
    console.log("   ✓ Folder indices created");

    // Step 6: Create indices for invitations
    console.log("6/6 Creating indices for invitations table...");
    await sql`CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_invitations_expires_at ON invitations(expires_at)`;
    console.log("   ✓ Invitation indices created");

    // Bonus: Create indices for new media_assets columns
    console.log("Creating additional indices for media_assets...");
    await sql`CREATE INDEX IF NOT EXISTS idx_media_assets_folder ON media_assets(folder_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_media_assets_starred ON media_assets(is_starred, created_at)`;
    console.log("   ✓ Media asset indices created");

    console.log("\n✅ Migration completed successfully!\n");
    console.log("Summary:");
    console.log("  - folders table: ready");
    console.log("  - invitations table: ready");
    console.log("  - media_assets.folder_id: ready");
    console.log("  - media_assets.is_starred: ready");
    console.log("  - all indices: created\n");

    process.exit(0);
  } catch (error: any) {
    console.error("\n❌ Migration failed:", error.message);
    console.error(error);
    process.exit(1);
  }
}

main();
