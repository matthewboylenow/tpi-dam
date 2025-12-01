/**
 * Create an admin user
 * Usage: npm run create-admin
 *
 * You'll be prompted for email, name, and password
 */

import * as readline from "readline/promises";
import { stdin as input, stdout as output } from "process";
import bcrypt from "bcryptjs";
import { createUser } from "@/lib/db/queries";

async function main() {
  const rl = readline.createInterface({ input, output });

  console.log("\n🔐 Create Admin User\n");

  try {
    const email = await rl.question("Email: ");
    const name = await rl.question("Name: ");
    const password = await rl.question("Password: ");

    console.log("\n⏳ Creating admin user...");

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
    console.log(`   Role: ${user.role}`);
    console.log(`\nYou can now log in at /login\n`);

    process.exit(0);
  } catch (error: any) {
    console.error("\n❌ Error creating admin user:", error.message);
    if (error.message?.includes("duplicate key")) {
      console.error("   → User with this email already exists");
    }
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
