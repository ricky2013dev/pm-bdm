import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { storage } from "../storage";
import { verifyPassword } from "./password";
import type { User } from "@shared/schema";

// Configure local strategy
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await storage.getUserByUsername(username);

      if (!user) {
        return done(null, false, { message: "Invalid username or password" });
      }

      const isValid = await verifyPassword(password, user.password);

      if (!isValid) {
        return done(null, false, { message: "Invalid username or password" });
      }

      // Don't return password to session
      const { password: _, ...userWithoutPassword } = user;
      return done(null, userWithoutPassword);
    } catch (error) {
      return done(error);
    }
  })
);

// Serialize user to session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await storage.getUser(id);
    if (!user) {
      return done(null, false);
    }
    const { password: _, ...userWithoutPassword } = user;
    done(null, userWithoutPassword);
  } catch (error) {
    done(error);
  }
});

export default passport;
