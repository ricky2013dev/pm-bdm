import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import axios from "axios";
import { readFileSync } from "fs";
import { join } from "path";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Seed test users if they don't exist
  const seedTestUsers = async () => {
    try {
      const dentalUser = await storage.getUserByEmail("dental@smithai.com");
      if (!dentalUser) {
        const hashedPassword = await bcrypt.hash("admin123", 10);
        await storage.createUser({
          email: "dental@smithai.com",
          username: "dental_admin",
          password: hashedPassword,
          role: "dental"
        });
        console.log("Created test dental user: dental@smithai.com");
      }

      const insuranceUser = await storage.getUserByEmail("insurance@smithai.com");
      if (!insuranceUser) {
        const hashedPassword = await bcrypt.hash("admin123", 10);
        await storage.createUser({
          email: "insurance@smithai.com",
          username: "insurance_admin",
          password: hashedPassword,
          role: "insurance"
        });
        console.log("Created test insurance user: insurance@smithai.com");
      }
    } catch (error) {
      console.error("Error seeding test users:", error);
    }
  };

  // Seed test users on startup
  await seedTestUsers();

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Store user in session
      (req.session as any).userId = user.id;
      (req.session as any).userRole = user.role;
      (req.session as any).userEmail = user.email;

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Failed to login" });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    req.session?.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.clearCookie("connect.sid");
      res.json({ success: true });
    });
  });

  app.get("/api/auth/verify", async (req, res) => {
    try {
      const userId = (req.session as any)?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      res.json({
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to verify session" });
    }
  });

  // Load dental codes
  const dentalCodesPath = join(process.cwd(), "mockupdata", "common_dental_cdt_codes.json");
  const dentalCodes = JSON.parse(readFileSync(dentalCodesPath, "utf-8"));

  const STEDI_API_KEY = process.env.STEDI_API_KEY;
  const STEDI_BASE_URL = "https://healthcare.us.stedi.com/2024-04-01";

  // Helper function to call Stedi Eligibility API
  async function checkEligibility(subscriber: any, provider: any, encounter: any, tradingPartnerServiceId: string = "CIGNA") {
    // Format date of birth to YYYYMMDD format if it's in YYYY-MM-DD format
    const formattedSubscriber = {
      ...subscriber,
      dateOfBirth: subscriber.dateOfBirth?.replace(/-/g, '')
    };

    const response = await axios.post(
      `${STEDI_BASE_URL}/change/medicalnetwork/eligibility/v3`,
      {
        tradingPartnerServiceId,
        subscriber: formattedSubscriber,
        provider,
        encounter
      },
      {
        headers: {
          Authorization: STEDI_API_KEY,
          "Content-Type": "application/json"
        }
      }
    );
    return response.data;
  }

  // Check if general benefits already cover a procedure
  function isCoveredInGeneral(generalBenefits: any, procedureCode: string) {
    if (!generalBenefits || !generalBenefits.benefits) return false;
    return generalBenefits.benefits.some(
      (b: any) =>
        b.service?.toUpperCase() === procedureCode.toUpperCase() ||
        (b.serviceTypeCode === "35") // fallback for broad dental coverage
    );
  }

  // Mock dental benefits data for testing
  const getMockDentalBenefits = () => ({
    general: {
      benefits: [
        {
          service: "Dental - Preventive",
          status: "active",
          percentageCovered: "100",
          copayAmount: "$0"
        },
        {
          service: "Dental - Basic",
          status: "active",
          percentageCovered: "80",
          copayAmount: "$25"
        },
        {
          service: "Dental - Major",
          status: "active",
          percentageCovered: "50",
          copayAmount: "$100"
        }
      ]
    },
    procedures: dentalCodes.slice(0, 20).map((code: any) => ({
      code: code.code,
      description: code.description,
      category: code.category,
      benefit: {
        percentageCovered: code.category.toLowerCase().includes("preventive") ? "100" : "80"
      }
    }))
  });

  // Stedi dental benefits route
  app.post("/api/stedi/dental-benefits", async (req, res) => {
    try {
      const { subscriber, provider } = req.body;

      if (!subscriber || !provider) {
        return res.status(400).json({
          success: false,
          error: "Subscriber and provider information are required"
        });
      }

      if (!STEDI_API_KEY) {
        return res.status(500).json({
          success: false,
          error: "STEDI_API_KEY is not configured"
        });
      }

      try {
        // 1️⃣ General dental coverage (STC 35)
        const generalBenefits = await checkEligibility(
          subscriber,
          provider,
          { serviceTypeCodes: ["35"] },
          "CIGNA"
        );

        const combinedResults = {
          general: generalBenefits,
          procedures: []
        };

        // 2️⃣ Loop CDT codes, skip if covered by general benefits
        for (const item of dentalCodes) {
          const covered = isCoveredInGeneral(generalBenefits, item.code);

          let procedureBenefit = null;
          if (!covered) {
            procedureBenefit = await checkEligibility(
              subscriber,
              provider,
              {
                serviceTypeCodes: ["35"],
                procedureCode: item.code
              },
              "CIGNA"
            );
          }

          (combinedResults.procedures as any[]).push({
            code: item.code,
            description: item.description,
            category: item.category,
            benefit: procedureBenefit?.benefits || (covered ? "Covered in STC 35" : null)
          });
        }

        res.json({ success: true, data: combinedResults });
      } catch (stediError: any) {
        // If Stedi API fails, return mock data for testing UI
        console.warn("Stedi API failed, returning mock data for testing:", stediError.response?.data?.errors || stediError.message);
        res.json({
          success: true,
          data: getMockDentalBenefits(),
          note: "Mock data - Stedi API test case not found. Use real test credentials for production."
        });
      }
    } catch (error: any) {
      console.error("Stedi API error:", error.message);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });

  return httpServer;
}
