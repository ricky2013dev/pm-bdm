import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBirthdaySchema, insertStudentSchema, insertStudentNoteSchema, students } from "@shared/schema";
import { db } from "./db";
import { sql, eq, gte, inArray } from "drizzle-orm";
import { registerAuthRoutes } from "./auth/routes";
import { registerUserRoutes } from "./users/routes";
import { requireAuth } from "./auth/middleware";
import { sendStudentStatusChangeEmail } from "./email/service";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Register auth routes (public)
  registerAuthRoutes(app);

  // All routes below require authentication
  app.get("/api/birthdays", requireAuth, async (_req, res) => {
    try {
      const birthdays = await storage.getAllBirthdays();
      res.json(birthdays);
    } catch (error) {
      console.error("Error fetching birthdays:", error);
      res.status(500).json({ error: "Failed to fetch birthdays" });
    }
  });

  app.get("/api/birthdays/:id", requireAuth, async (req, res) => {
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

  app.post("/api/birthdays", requireAuth, async (req, res) => {
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

  app.put("/api/birthdays/:id", requireAuth, async (req, res) => {
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

  app.delete("/api/birthdays/:id", requireAuth, async (req, res) => {
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
  app.get("/api/students", requireAuth, async (req, res) => {
    try {
      const filters = {
        name: req.query.name as string,
        email: req.query.email as string,
        phone: req.query.phone as string,
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

  app.get("/api/students/:id", requireAuth, async (req, res) => {
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

  app.post("/api/students", requireAuth, async (req, res) => {
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

  app.put("/api/students/:id", requireAuth, async (req, res) => {
    try {
      const parsed = insertStudentSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid student data", details: parsed.error.errors });
      }

      // Fetch original student before update for status comparison
      const originalStudent = await storage.getStudent(req.params.id);
      if (!originalStudent) {
        return res.status(404).json({ error: "Student not found" });
      }

      // Perform the update
      const student = await storage.updateStudent(req.params.id, parsed.data);
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }

      // Create automatic status change log if status changed
      if (parsed.data.status && parsed.data.status !== originalStudent.status) {
        try {
          const statusChangeNote = {
            studentId: req.params.id,
            content: `Status changed from "${originalStudent.status}" to "${parsed.data.status}"`,
            createdBy: req.user!.id,
            createdByName: req.user!.username,
            isSystemGenerated: "true",
          };
          await storage.createStudentNote(statusChangeNote as any);
          console.log(`Status change log created for student ${student.name}`);
        } catch (logError) {
          console.error("Failed to create status change log:", logError);
          // Don't fail the request if log creation fails
        }

        // Send notifications if status changed
        try {
          const usersToNotify = await storage.getNonAdminUsersWithEmail();

          if (usersToNotify.length === 0) {
            console.warn("No non-admin users with email found for status change notification");
          } else {
            // Send emails in parallel
            const emailPromises = usersToNotify.map(user =>
              sendStudentStatusChangeEmail(
                user.email!,
                student.name,
                originalStudent.status,
                student.status
              )
            );

            await Promise.allSettled(emailPromises);
            console.log(`Status change notifications sent to ${usersToNotify.length} users for student ${student.name}`);
          }
        } catch (emailError) {
          console.error("Email notification failed but student was updated:", emailError);
          // Don't fail the request if email fails
        }
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

  app.delete("/api/students/:id", requireAuth, async (req, res) => {
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

  // Helper to convert string boolean to actual boolean
  const normalizeNotes = (notes: any[]) => {
    return notes.map(note => ({
      ...note,
      isSystemGenerated: note.isSystemGenerated === "true",
    }));
  };

  // Student notes routes
  app.get("/api/students/:studentId/notes", requireAuth, async (req, res) => {
    try {
      const notes = await storage.getStudentNotes(req.params.studentId);
      res.json(normalizeNotes(notes));
    } catch (error) {
      console.error("Error fetching student notes:", error);
      res.status(500).json({ error: "Failed to fetch notes" });
    }
  });

  app.post("/api/students/:studentId/notes", requireAuth, async (req, res) => {
    try {
      // Verify student exists
      const student = await storage.getStudent(req.params.studentId);
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }

      // Validate request body
      const parsed = insertStudentNoteSchema.safeParse({
        ...req.body,
        studentId: req.params.studentId,
        createdBy: req.user!.id,
        createdByName: req.user!.username,
      });

      if (!parsed.success) {
        return res.status(400).json({
          error: "Invalid note data",
          details: parsed.error.errors
        });
      }

      const note = await storage.createStudentNote(parsed.data);
      res.status(201).json(note);
    } catch (error) {
      console.error("Error creating note:", error);
      res.status(500).json({ error: "Failed to create note" });
    }
  });

  app.put("/api/notes/:id", requireAuth, async (req, res) => {
    try {
      // Check if note exists and user is the creator
      const existingNote = await storage.getStudentNote(req.params.id);
      if (!existingNote) {
        return res.status(404).json({ error: "Note not found" });
      }

      // Permission check: only creator can edit
      if (existingNote.createdBy !== req.user!.id) {
        return res.status(403).json({
          error: "You can only edit your own notes"
        });
      }

      // Validate content
      const contentSchema = z.object({
        content: z.string().min(1, "Note content is required").max(5000, "Note is too long"),
      });

      const parsed = contentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Invalid note data",
          details: parsed.error.errors
        });
      }

      const note = await storage.updateStudentNote(req.params.id, parsed.data.content);
      res.json(note);
    } catch (error) {
      console.error("Error updating note:", error);
      res.status(500).json({ error: "Failed to update note" });
    }
  });

  app.delete("/api/notes/:id", requireAuth, async (req, res) => {
    try {
      // Check if note exists and user is the creator
      const existingNote = await storage.getStudentNote(req.params.id);
      if (!existingNote) {
        return res.status(404).json({ error: "Note not found" });
      }

      // Permission check: only creator can delete
      if (existingNote.createdBy !== req.user!.id) {
        return res.status(403).json({
          error: "You can only delete your own notes"
        });
      }

      const deleted = await storage.deleteStudentNote(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Note not found" });
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting note:", error);
      res.status(500).json({ error: "Failed to delete note" });
    }
  });

  // Dashboard stats endpoint
  app.get("/api/dashboard/stats", requireAuth, async (_req, res) => {
    try {
      // 1. Get metric counts
      const [totalCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(students);

      const [activeCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(students)
        .where(inArray(students.status, ['active', 'enrolled']));

      const [graduatedCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(students)
        .where(eq(students.status, 'graduated'));

      // Get current month's first day
      const firstDayOfMonth = new Date();
      firstDayOfMonth.setDate(1);
      firstDayOfMonth.setHours(0, 0, 0, 0);
      const formattedDate = firstDayOfMonth.toISOString().split('T')[0];

      const [newThisMonth] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(students)
        .where(gte(students.registrationDate, formattedDate));

      // 2. Course distribution
      const courseDistribution = await db
        .select({
          course: students.courseInterested,
          count: sql<number>`count(*)::int`
        })
        .from(students)
        .where(sql`course_interested IS NOT NULL`)
        .groupBy(students.courseInterested)
        .orderBy(sql`count(*) DESC`);

      // 3. Location distribution
      const locationDistribution = await db
        .select({
          location: students.location,
          count: sql<number>`count(*)::int`
        })
        .from(students)
        .where(sql`location IS NOT NULL`)
        .groupBy(students.location);

      // 4. Monthly trends (last 12 months)
      const monthlyTrends = await db
        .select({
          period: sql<string>`TO_CHAR(registration_date, 'YYYY-MM')`,
          count: sql<number>`count(*)::int`
        })
        .from(students)
        .where(sql`registration_date >= CURRENT_DATE - INTERVAL '12 months'`)
        .groupBy(sql`TO_CHAR(registration_date, 'YYYY-MM')`)
        .orderBy(sql`TO_CHAR(registration_date, 'YYYY-MM')`);

      // 5. Weekly trends (last 12 weeks)
      const weeklyTrends = await db
        .select({
          period: sql<string>`TO_CHAR(registration_date, 'IYYY-IW')`,
          count: sql<number>`count(*)::int`
        })
        .from(students)
        .where(sql`registration_date >= CURRENT_DATE - INTERVAL '12 weeks'`)
        .groupBy(sql`TO_CHAR(registration_date, 'IYYY-IW')`)
        .orderBy(sql`TO_CHAR(registration_date, 'IYYY-IW')`);

      res.json({
        metrics: {
          total: Number(totalCount?.count || 0),
          active: Number(activeCount?.count || 0),
          graduated: Number(graduatedCount?.count || 0),
          newThisMonth: Number(newThisMonth?.count || 0)
        },
        courseDistribution: courseDistribution.map(c => ({
          course: c.course || 'Unknown',
          count: Number(c.count)
        })),
        locationDistribution: locationDistribution.map(l => ({
          location: l.location || 'Unknown',
          count: Number(l.count)
        })),
        monthlyTrends: monthlyTrends.map(m => ({
          period: m.period || '',
          count: Number(m.count)
        })),
        weeklyTrends: weeklyTrends.map(w => ({
          period: w.period || '',
          count: Number(w.count)
        }))
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // Register user management routes (admin only)
  registerUserRoutes(app);

  return httpServer;
}
