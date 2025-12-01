/**
 * Complete automated setup script
 * Run: npm run setup
 *
 * This will:
 * 1. Check environment variables
 * 2. Generate NEXTAUTH_SECRET if missing
 * 3. Initialize database
 * 4. Create admin user
 */

import * as readline from "readline/promises";
import { stdin as input, stdout as output } from "process";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { initializeDatabase } from "@/lib/db/client";
import { createUser, getUserByEmail } from "@/lib/db/queries";

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
          // Remove quotes if present
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

const rl = readline.createInterface({ input, output });

async function checkEnvFile() {
  console.log("\n📋 Step 1: Checking environment variables...\n");

  if (!existsSync(".env.local")) {
    console.log("❌ .env.local not found!");
    console.log("\nPlease create .env.local with your credentials:");
    console.log("   POSTGRES_URL=...");
    console.log("   BLOB_READ_WRITE_TOKEN=...");
    console.log("   NEXTAUTH_URL=http://localhost:3000");
    console.log("   NEXTAUTH_SECRET=... (or leave blank to auto-generate)");
    console.log("\nOr run: vercel env pull .env.local\n");
    process.exit(1);
  }

  let envContent = readFileSync(".env.local", "utf-8");
  let updated = false;

  // Check required variables
  if (!process.env.POSTGRES_URL) {
    console.log("❌ POSTGRES_URL is missing in .env.local");
    process.exit(1);
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.log("⚠️  BLOB_READ_WRITE_TOKEN is missing (optional for now)");
  }

  // Auto-generate NEXTAUTH_SECRET if missing
  if (!process.env.NEXTAUTH_SECRET || process.env.NEXTAUTH_SECRET === "your-secret-or-I-can-generate-one") {
    console.log("🔑 Generating NEXTAUTH_SECRET...");
    const secret = randomBytes(32).toString("base64");

    if (envContent.includes("NEXTAUTH_SECRET=")) {
      envContent = envContent.replace(
        /NEXTAUTH_SECRET=.*/,
        `NEXTAUTH_SECRET="${secret}"`
      );
    } else {
      envContent += `\nNEXTAUTH_SECRET="${secret}"\n`;
    }

    writeFileSync(".env.local", envContent);
    process.env.NEXTAUTH_SECRET = secret;
    updated = true;
    console.log("✅ Generated and saved NEXTAUTH_SECRET");
  }

  // Set NEXTAUTH_URL if missing
  if (!process.env.NEXTAUTH_URL) {
    console.log("🔗 Setting NEXTAUTH_URL to http://localhost:3000");
    if (envContent.includes("NEXTAUTH_URL=")) {
      envContent = envContent.replace(
        /NEXTAUTH_URL=.*/,
        `NEXTAUTH_URL="http://localhost:3000"`
      );
    } else {
      envContent += `\nNEXTAUTH_URL="http://localhost:3000"\n`;
    }
    writeFileSync(".env.local", envContent);
    process.env.NEXTAUTH_URL = "http://localhost:3000";
    updated = true;
    console.log("✅ Set NEXTAUTH_URL");
  }

  if (updated) {
    console.log("\n✅ Updated .env.local with missing values\n");
  } else {
    console.log("✅ All environment variables present\n");
  }
}

async function setupDatabase() {
  console.log("📊 Step 2: Initializing database...\n");

  try {
    await initializeDatabase();
    console.log("✅ Database tables created successfully!\n");
  } catch (error: any) {
    console.error("❌ Database initialization failed:", error.message);
    process.exit(1);
  }
}

async function createAdminUser() {
  console.log("👤 Step 3: Creating admin user...\n");

  try {
    // Check if we should create an admin
    const shouldCreate = await rl.question(
      "Do you want to create an admin user? (y/n): "
    );

    if (shouldCreate.toLowerCase() !== "y") {
      console.log("\nSkipping admin user creation.");
      console.log("You can create one later with: npm run create-admin\n");
      return;
    }

    const email = await rl.question("Admin email: ");
    const name = await rl.question("Admin name: ");
    const password = await rl.question("Admin password: ");

    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      console.log(`\n⚠️  User with email ${email} already exists. Skipping...\n`);
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await createUser({
      email,
      name,
      password: passwordHash,
      role: "admin",
    });

    console.log("\n✅ Admin user created successfully!");
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Role: ${user.role}\n`);
  } catch (error: any) {
    console.error("❌ Error creating admin user:", error.message);
    if (error.message?.includes("duplicate key")) {
      console.error("   → User with this email already exists\n");
    } else {
      process.exit(1);
    }
  }
}

async function main() {
  console.log("\n🚀 Taylor Media Hub - Automated Setup\n");
  console.log("═══════════════════════════════════════\n");

  try {
    await checkEnvFile();
    await setupDatabase();
    await createAdminUser();

    console.log("═══════════════════════════════════════");
    console.log("\n🎉 Setup complete!\n");
    console.log("Next steps:");
    console.log("  1. Run: npm run dev");
    console.log("  2. Open: http://localhost:3000");
    console.log("  3. Log in with your admin credentials\n");

    process.exit(0);
  } catch (error: any) {
    console.error("\n❌ Setup failed:", error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
