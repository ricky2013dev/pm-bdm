import type { Express } from "express";
import passport from "./passport";
import { loginSchema } from "@shared/schema";
import { storage } from "../storage";

export function registerAuthRoutes(app: Express) {
  // Login endpoint
  app.post("/api/auth/login", (req, res, next) => {
    // Validate input
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid credentials",
        details: parsed.error.errors
      });
    }

    const { username } = parsed.data;
    const ipAddress = req.ip || req.socket.remoteAddress || null;
    const userAgent = req.headers["user-agent"] || null;

    passport.authenticate("local", async (err: any, user: any, info: any) => {
      if (err) {
        return next(err);
      }

      if (!user) {
        // Record failed login attempt
        try {
          await storage.recordLoginAttempt({
            userId: null,
            username,
            status: "failed",
            ipAddress,
            userAgent,
          });
        } catch (error) {
          console.error("Failed to record login attempt:", error);
        }
        return res.status(401).json({ error: info?.message || "Authentication failed" });
      }

      req.logIn(user, async (err) => {
        if (err) {
          return next(err);
        }

        // Record successful login attempt
        try {
          await storage.recordLoginAttempt({
            userId: user.id,
            username: user.username,
            status: "success",
            ipAddress,
            userAgent,
          });
        } catch (error) {
          console.error("Failed to record login attempt:", error);
        }

        return res.json({ user });
      });
    })(req, res, next);
  });

  // Logout endpoint
  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Get current user endpoint
  app.get("/api/auth/me", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    res.json({ user: req.user });
  });
}
