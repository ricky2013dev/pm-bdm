import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcryptjs";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Seed test users if they don't exist
  const seedTestUsers = async () => {
    try {
      const dentalUser = await storage.getUserByEmail("dental@smithai.com");
      if (!dentalUser) {
        const hashedPassword = await bcrypt.hash("admin123", 10);
        await storage.createUser({
          email: "dental@smithai.com",
          username: "dental_admin",
          password: hashedPassword,
          role: "dental"
        });
        console.log("Created test dental user: dental@smithai.com");
      }

      const insuranceUser = await storage.getUserByEmail("insurance@smithai.com");
      if (!insuranceUser) {
        const hashedPassword = await bcrypt.hash("admin123", 10);
        await storage.createUser({
          email: "insurance@smithai.com",
          username: "insurance_admin",
          password: hashedPassword,
          role: "insurance"
        });
        console.log("Created test insurance user: insurance@smithai.com");
      }
    } catch (error) {
      console.error("Error seeding test users:", error);
    }
  };

  // Seed test users on startup
  await seedTestUsers();

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Store user in session
      (req.session as any).userId = user.id;
      (req.session as any).userRole = user.role;
      (req.session as any).userEmail = user.email;

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Failed to login" });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    req.session?.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.clearCookie("connect.sid");
      res.json({ success: true });
    });
  });

  app.get("/api/auth/verify", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      res.json({
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to verify session" });
    }
  });

  return httpServer;
}
