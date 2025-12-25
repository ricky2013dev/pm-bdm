import "../server/init";
import { hashPassword } from "../server/auth/password";
import { storage } from "../server/storage";

async function createAdmin() {
  try {
    const username = process.argv[2] || "admin";
    const password = process.argv[3] || "admin123";

    console.log(`Creating admin user: ${username}`);

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Create the admin user
    const user = await storage.createUser({
      username,
      password: hashedPassword,
      role: "admin",
    });

    console.log("✅ Admin user created successfully!");
    console.log(`Username: ${user.username}`);
    console.log(`Role: ${user.role}`);
    console.log(`\nYou can now login with:`);
    console.log(`Username: ${username}`);
    console.log(`Password: ${password}`);

    process.exit(0);
  } catch (error: any) {
    if (error.code === '23505') {
      console.error("❌ Error: Username already exists");
    } else {
      console.error("❌ Error creating admin user:", error.message);
    }
    process.exit(1);
  }
}

createAdmin();
