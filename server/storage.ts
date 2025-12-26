import {
  type User,
  type InsertUser,
  type UpdateUser,
  type Birthday,
  type InsertBirthday,
  type Student,
  type InsertStudent,
  type LoginHistory,
  type InsertLoginHistory,
  type StudentNote,
  type InsertStudentNote,
  users,
  birthdays,
  students,
  loginHistory,
  studentNotes
} from "@shared/schema";
import { db } from "./db";
import { eq, like, ilike, and, gte, lte, desc, sql } from "drizzle-orm";
import { hashPassword } from "./auth/password";

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
  getAllUsers(): Promise<Omit<User, "password">[]>;
  updateUser(id: string, user: UpdateUser): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  getNonAdminUsersWithEmail(): Promise<Omit<User, "password">[]>;

  recordLoginAttempt(attempt: InsertLoginHistory): Promise<LoginHistory>;
  getUserLoginHistory(userId: string, limit?: number): Promise<LoginHistory[]>;

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

  // Student notes operations
  getStudentNotes(studentId: string): Promise<StudentNote[]>;
  getStudentNote(id: string): Promise<StudentNote | undefined>;
  createStudentNote(note: InsertStudentNote): Promise<StudentNote>;
  updateStudentNote(id: string, content: string): Promise<StudentNote | undefined>;
  deleteStudentNote(id: string): Promise<boolean>;
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

  async getAllUsers(): Promise<Omit<User, "password">[]> {
    const allUsers = await db.select().from(users);
    return allUsers.map(({ password, ...user }) => user);
  }

  async updateUser(id: string, updateData: UpdateUser): Promise<User | undefined> {
    // Hash password if it's being updated
    const dataToUpdate = { ...updateData };
    if (dataToUpdate.password) {
      dataToUpdate.password = await hashPassword(dataToUpdate.password);
    }

    const [updated] = await db
      .update(users)
      .set({ ...dataToUpdate, updatedAt: sql`CURRENT_DATE` })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  async getNonAdminUsersWithEmail(): Promise<Omit<User, "password">[]> {
    const allUsers = await db
      .select()
      .from(users)
      .where(eq(users.role, "user"));

    // Filter users with valid email addresses and remove password
    return allUsers
      .filter(user => user.email && user.email.trim() !== '')
      .map(({ password, ...user }) => user);
  }

  async recordLoginAttempt(attempt: InsertLoginHistory): Promise<LoginHistory> {
    const [record] = await db.insert(loginHistory).values(attempt).returning();
    return record;
  }

  async getUserLoginHistory(userId: string, limit: number = 50): Promise<LoginHistory[]> {
    const history = await db
      .select()
      .from(loginHistory)
      .where(eq(loginHistory.userId, userId))
      .orderBy(desc(loginHistory.timestamp))
      .limit(limit);
    return history;
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

  // Student notes operations
  async getStudentNotes(studentId: string): Promise<StudentNote[]> {
    const notes = await db
      .select()
      .from(studentNotes)
      .where(eq(studentNotes.studentId, studentId))
      .orderBy(desc(studentNotes.createdAt));
    return notes;
  }

  async getStudentNote(id: string): Promise<StudentNote | undefined> {
    const [note] = await db
      .select()
      .from(studentNotes)
      .where(eq(studentNotes.id, id));
    return note;
  }

  async createStudentNote(note: InsertStudentNote): Promise<StudentNote> {
    const [newNote] = await db
      .insert(studentNotes)
      .values(note)
      .returning();
    return newNote;
  }

  async updateStudentNote(id: string, content: string): Promise<StudentNote | undefined> {
    const [updated] = await db
      .update(studentNotes)
      .set({ content, updatedAt: sql`NOW()` })
      .where(eq(studentNotes.id, id))
      .returning();
    return updated;
  }

  async deleteStudentNote(id: string): Promise<boolean> {
    const result = await db
      .delete(studentNotes)
      .where(eq(studentNotes.id, id))
      .returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
