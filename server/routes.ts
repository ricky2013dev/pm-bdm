import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBirthdaySchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.get("/api/birthdays", async (_req, res) => {
    try {
      const birthdays = await storage.getAllBirthdays();
      res.json(birthdays);
    } catch (error) {
      console.error("Error fetching birthdays:", error);
      res.status(500).json({ error: "Failed to fetch birthdays" });
    }
  });

  app.get("/api/birthdays/:id", async (req, res) => {
    try {
      const birthday = await storage.getBirthday(req.params.id);
      if (!birthday) {
        return res.status(404).json({ error: "Birthday not found" });
      }
      res.json(birthday);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch birthday" });
    }
  });

  app.post("/api/birthdays", async (req, res) => {
    try {
      const parsed = insertBirthdaySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid birthday data", details: parsed.error.errors });
      }
      const birthday = await storage.createBirthday(parsed.data);
      res.status(201).json(birthday);
    } catch (error) {
      res.status(500).json({ error: "Failed to create birthday" });
    }
  });

  app.put("/api/birthdays/:id", async (req, res) => {
    try {
      const parsed = insertBirthdaySchema.partial().safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid birthday data", details: parsed.error.errors });
      }
      const birthday = await storage.updateBirthday(req.params.id, parsed.data);
      if (!birthday) {
        return res.status(404).json({ error: "Birthday not found" });
      }
      res.json(birthday);
    } catch (error) {
      res.status(500).json({ error: "Failed to update birthday" });
    }
  });

  app.delete("/api/birthdays/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteBirthday(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Birthday not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete birthday" });
    }
  });

  return httpServer;
}
