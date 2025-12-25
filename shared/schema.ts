import { sql } from "drizzle-orm";
import { pgTable, text, varchar, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

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
