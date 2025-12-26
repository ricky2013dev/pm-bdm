import { sql } from "drizzle-orm";
import { pgTable, text, varchar, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  phone: text("phone"),
  role: text("role", { enum: ["user", "admin"] }).notNull().default("user"),
  createdAt: date("created_at").notNull().default(sql`CURRENT_DATE`),
  updatedAt: date("updated_at").notNull().default(sql`CURRENT_DATE`),
});

export const insertUserSchema = createInsertSchema(users, {
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  role: z.enum(["user", "admin"]).optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const updateUserSchema = insertUserSchema.partial();

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type LoginCredentials = z.infer<typeof loginSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;

export const loginHistory = pgTable("login_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  username: text("username").notNull(),
  status: text("status", { enum: ["success", "failed"] }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertLoginHistorySchema = createInsertSchema(loginHistory).omit({
  id: true,
  timestamp: true,
});

export type InsertLoginHistory = z.infer<typeof insertLoginHistorySchema>;
export type LoginHistory = typeof loginHistory.$inferSelect;

export const birthdays = pgTable("birthdays", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  date: date("date").notNull(),
  notes: text("notes"),
});

export const insertBirthdaySchema = createInsertSchema(birthdays, {
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
}).omit({
  id: true,
});

export type InsertBirthday = z.infer<typeof insertBirthdaySchema>;
export type Birthday = typeof birthdays.$inferSelect;

// Student Management Schema
export const students = pgTable("students", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  courseInterested: text("course_interested"),
  location: text("location"),
  status: text("status").notNull(), // active, inactive, enrolled, pending, graduated
  citizenshipStatus: text("citizenship_status"),
  currentSituation: text("current_situation"),
  registrationDate: date("registration_date").notNull(),
  createdAt: date("created_at").notNull().default(sql`CURRENT_DATE`),
  updatedAt: date("updated_at").notNull().default(sql`CURRENT_DATE`),
});

export const insertStudentSchema = createInsertSchema(students, {
  email: z.string().email("Invalid email format"),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
  status: z.enum(["active", "inactive", "enrolled", "pending", "graduated"]),
  registrationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof students.$inferSelect;

// Student Notes Schema
export const studentNotes = pgTable("student_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdBy: varchar("created_by")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdByName: text("created_by_name").notNull(),
  isSystemGenerated: text("is_system_generated").notNull().default("false"), // "true" or "false" as string for db compatibility
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertStudentNoteSchema = createInsertSchema(studentNotes, {
  content: z.string().min(1, "Note content is required").max(5000, "Note is too long"),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  isSystemGenerated: true,
});

export type InsertStudentNote = z.infer<typeof insertStudentNoteSchema>;
export type StudentNote = typeof studentNotes.$inferSelect;
