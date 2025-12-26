import type { Express } from "express";
import { storage } from "../storage";
import { requireAdmin } from "../auth/middleware";
import { insertUserSchema, updateUserSchema } from "@shared/schema";
import { hashPassword } from "../auth/password";
import { sendPasswordUpdateEmail } from "../email/service";

export function registerUserRoutes(app: Express) {
  // Get user login history (admin only)
  app.get("/api/users/:id/login-history", requireAdmin, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const history = await storage.getUserLoginHistory(req.params.id, limit);
      res.json(history);
    } catch (error) {
      console.error("Error fetching login history:", error);
      res.status(500).json({ error: "Failed to fetch login history" });
    }
  });

  // Get all users (admin only)
  app.get("/api/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Create user (admin only)
  app.post("/api/users", requireAdmin, async (req, res) => {
    try {
      const parsed = insertUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Invalid user data",
          details: parsed.error.errors
        });
      }

      // Hash password before storing
      const hashedPassword = await hashPassword(parsed.data.password);
      const user = await storage.createUser({
        ...parsed.data,
        password: hashedPassword,
      });

      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error: any) {
      if (error.code === '23505') {
        return res.status(400).json({ error: "Username already exists" });
      }
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  // Update user (admin only)
  app.put("/api/users/:id", requireAdmin, async (req, res) => {
    try {
      const parsed = updateUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Invalid user data",
          details: parsed.error.errors
        });
      }

      // Get the original user to access email for notifications
      const originalUser = await storage.getUser(req.params.id);
      if (!originalUser) {
        return res.status(404).json({ error: "User not found" });
      }

      const user = await storage.updateUser(req.params.id, parsed.data);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Send email if password was updated
      if (parsed.data.password && originalUser.email) {
        try {
          await sendPasswordUpdateEmail(
            originalUser.email,
            originalUser.username,
            parsed.data.password // Send the plaintext password (before hashing)
          );
        } catch (emailError) {
          console.error("Email notification failed but user was updated:", emailError);
          // Don't fail the request if email fails
        }
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      if (error.code === '23505') {
        return res.status(400).json({ error: "Username already exists" });
      }
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // Delete user (admin only)
  app.delete("/api/users/:id", requireAdmin, async (req, res) => {
    try {
      // Prevent self-deletion
      if (req.user?.id === req.params.id) {
        return res.status(400).json({ error: "Cannot delete your own account" });
      }

      const deleted = await storage.deleteUser(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "User not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });
}
