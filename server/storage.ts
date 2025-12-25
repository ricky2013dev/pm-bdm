import {
  type User,
  type InsertUser,
  type Birthday,
  type InsertBirthday,
  type Student,
  type InsertStudent,
  users,
  birthdays,
  students
} from "@shared/schema";
import { db } from "./db";
import { eq, like, ilike, and, gte, lte, desc, sql } from "drizzle-orm";

export interface StudentFilters {
  name?: string;
  email?: string;
  phone?: string;
  courseInterested?: string;
  location?: string;
  status?: string;
  registrationDateFrom?: string;
  registrationDateTo?: string;
  limit?: number;
  offset?: number;
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getAllBirthdays(): Promise<Birthday[]>;
  getBirthday(id: string): Promise<Birthday | undefined>;
  createBirthday(birthday: InsertBirthday): Promise<Birthday>;
  updateBirthday(id: string, birthday: Partial<InsertBirthday>): Promise<Birthday | undefined>;
  deleteBirthday(id: string): Promise<boolean>;

  // Student operations
  getAllStudents(filters?: StudentFilters): Promise<{ students: Student[]; total: number }>;
  getStudent(id: string): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: string, student: Partial<InsertStudent>): Promise<Student | undefined>;
  deleteStudent(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getAllBirthdays(): Promise<Birthday[]> {
    return db.select().from(birthdays);
  }

  async getBirthday(id: string): Promise<Birthday | undefined> {
    const [birthday] = await db.select().from(birthdays).where(eq(birthdays.id, id));
    return birthday;
  }

  async createBirthday(birthday: InsertBirthday): Promise<Birthday> {
    const [newBirthday] = await db.insert(birthdays).values(birthday).returning();
    return newBirthday;
  }

  async updateBirthday(id: string, birthday: Partial<InsertBirthday>): Promise<Birthday | undefined> {
    const [updated] = await db
      .update(birthdays)
      .set(birthday)
      .where(eq(birthdays.id, id))
      .returning();
    return updated;
  }

  async deleteBirthday(id: string): Promise<boolean> {
    const result = await db.delete(birthdays).where(eq(birthdays.id, id)).returning();
    return result.length > 0;
  }

  // Student operations
  async getAllStudents(filters?: StudentFilters): Promise<{ students: Student[]; total: number }> {
    const conditions = [];

    if (filters?.name) {
      conditions.push(ilike(students.name, `%${filters.name}%`));
    }
    if (filters?.email) {
      conditions.push(ilike(students.email, `%${filters.email}%`));
    }
    if (filters?.phone) {
      conditions.push(ilike(students.phone, `%${filters.phone}%`));
    }
    if (filters?.courseInterested) {
      conditions.push(eq(students.courseInterested, filters.courseInterested));
    }
    if (filters?.location) {
      conditions.push(eq(students.location, filters.location));
    }
    if (filters?.status) {
      conditions.push(eq(students.status, filters.status));
    }
    if (filters?.registrationDateFrom) {
      conditions.push(gte(students.registrationDate, filters.registrationDateFrom));
    }
    if (filters?.registrationDateTo) {
      conditions.push(lte(students.registrationDate, filters.registrationDateTo));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(students)
      .where(whereClause);

    // Get paginated results
    const query = db
      .select()
      .from(students)
      .where(whereClause)
      .orderBy(desc(students.createdAt));

    if (filters?.limit) {
      query.limit(filters.limit);
    }
    if (filters?.offset) {
      query.offset(filters.offset);
    }

    const results = await query;

    return {
      students: results,
      total: Number(count)
    };
  }

  async getStudent(id: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.id, id));
    return student;
  }

  async createStudent(student: InsertStudent): Promise<Student> {
    const [newStudent] = await db.insert(students).values(student).returning();
    return newStudent;
  }

  async updateStudent(id: string, student: Partial<InsertStudent>): Promise<Student | undefined> {
    const [updated] = await db
      .update(students)
      .set({ ...student, updatedAt: sql`CURRENT_DATE` })
      .where(eq(students.id, id))
      .returning();
    return updated;
  }

  async deleteStudent(id: string): Promise<boolean> {
    const result = await db.delete(students).where(eq(students.id, id)).returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
