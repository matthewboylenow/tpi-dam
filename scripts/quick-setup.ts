/**
 * Quick setup script (non-interactive)
 * Usage: npm run quick-setup <email> <name> <password>
 * Example: npm run quick-setup admin@taylorproducts.com "Admin User" admin123
 */

import { readFileSync, existsSync } from "fs";
import bcrypt from "bcryptjs";
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
  console.log("\n👤 Creating admin user...\n");

  const email = process.argv[2] || "admin@taylorproducts.com";
  const name = process.argv[3] || "Admin User";
  const password = process.argv[4] || "admin123";

  try {
    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      console.log(`✅ Admin user already exists:`);
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   Name: ${existingUser.name}`);
      console.log(`   Role: ${existingUser.role}\n`);
      process.exit(0);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await createUser({
      email,
      name,
      password: passwordHash,
      role: "admin",
    });

    console.log("✅ Admin user created successfully!");
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Password: ${password}\n`);

    process.exit(0);
  } catch (error: any) {
    console.error("❌ Error creating admin user:", error.message);
    process.exit(1);
  }
}

main();
