/**
 * Database initialization script
 * Run with: npx tsx scripts/init-db.ts
 *
 * This script creates all necessary tables and indices
 */

import { initializeDatabase } from "@/lib/db/client";

async function main() {
  console.log("Initializing database...");

  try {
    await initializeDatabase();
    console.log("✓ Database initialized successfully!");
    process.exit(0);
  } catch (error) {
    console.error("✗ Database initialization failed:", error);
    process.exit(1);
  }
}

main();
