/**
 * Update user password
 * Usage: tsx scripts/update-password.ts <email> <new-password>
 */

import { readFileSync, existsSync } from "fs";
import bcrypt from "bcryptjs";
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
          if ((value.startsWith('"') && value.endsWith('"')) ||
              (value.startsWith("'") && value.endsWith("'"))) {
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
  const email = process.argv[2];
  const newPassword = process.argv[3];

  if (!email || !newPassword) {
    console.error("❌ Usage: tsx scripts/update-password.ts <email> <new-password>");
    process.exit(1);
  }

  console.log(`\n🔐 Updating password for ${email}...\n`);

  try {
    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update the user's password
    const result = await sql`
      UPDATE users
      SET password_hash = ${passwordHash}
      WHERE email = ${email}
      RETURNING id, email, name, role
    `;

    if (result.rows.length === 0) {
      console.error("❌ User not found with that email");
      process.exit(1);
    }

    const user = result.rows[0];
    console.log("✅ Password updated successfully!");
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Role: ${user.role}\n`);

    process.exit(0);
  } catch (error: any) {
    console.error("❌ Error updating password:", error.message);
    process.exit(1);
  }
}

main();
