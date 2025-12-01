import { 
  type User, 
  type InsertUser,
  type Birthday,
  type InsertBirthday,
  users,
  birthdays
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getAllBirthdays(): Promise<Birthday[]>;
  getBirthday(id: string): Promise<Birthday | undefined>;
  createBirthday(birthday: InsertBirthday): Promise<Birthday>;
  updateBirthday(id: string, birthday: Partial<InsertBirthday>): Promise<Birthday | undefined>;
  deleteBirthday(id: string): Promise<boolean>;
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
}

export const storage = new DatabaseStorage();
