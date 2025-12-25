import session from "express-session";
import pgSession from "connect-pg-simple";
import { Pool } from "@neondatabase/serverless";

const PgStore = pgSession(session);

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const sessionMiddleware = session({
  store: new PgStore({
    pool,
    tableName: "session", // Will auto-create this table
    createTableIfMissing: true,
  }),
  secret: process.env.SESSION_SECRET || "your-secret-key-change-in-production",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  },
});
