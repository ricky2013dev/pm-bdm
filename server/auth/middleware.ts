import type { Request, Response, NextFunction } from "express";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface User {
      id: string;
      username: string;
      role: "user" | "admin";
      createdAt: string;
      updatedAt: string;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }

  next();
}
