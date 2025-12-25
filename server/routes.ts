import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBirthdaySchema, insertStudentSchema } from "@shared/schema";

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

  // Student routes
  app.get("/api/students", async (req, res) => {
    try {
      const filters = {
        name: req.query.name as string,
        courseInterested: req.query.courseInterested as string,
        location: req.query.location as string,
        status: req.query.status as string,
        registrationDateFrom: req.query.registrationDateFrom as string,
        registrationDateTo: req.query.registrationDateTo as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      };

      const result = await storage.getAllStudents(filters);
      res.json(result);
    } catch (error) {
      console.error("Error fetching students:", error);
      res.status(500).json({ error: "Failed to fetch students" });
    }
  });

  app.get("/api/students/:id", async (req, res) => {
    try {
      const student = await storage.getStudent(req.params.id);
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }
      res.json(student);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch student" });
    }
  });

  app.post("/api/students", async (req, res) => {
    try {
      const parsed = insertStudentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid student data", details: parsed.error.errors });
      }
      const student = await storage.createStudent(parsed.data);
      res.status(201).json(student);
    } catch (error: any) {
      if (error.code === '23505') { // Unique violation error code
        return res.status(400).json({ error: "Email already exists" });
      }
      console.error("Error creating student:", error);
      res.status(500).json({ error: "Failed to create student" });
    }
  });

  app.put("/api/students/:id", async (req, res) => {
    try {
      const parsed = insertStudentSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid student data", details: parsed.error.errors });
      }
      const student = await storage.updateStudent(req.params.id, parsed.data);
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }
      res.json(student);
    } catch (error: any) {
      if (error.code === '23505') {
        return res.status(400).json({ error: "Email already exists" });
      }
      console.error("Error updating student:", error);
      res.status(500).json({ error: "Failed to update student" });
    }
  });

  app.delete("/api/students/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteStudent(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Student not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete student" });
    }
  });

  return httpServer;
}
