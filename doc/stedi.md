import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import dentalCodes from "./common_dental_cdt_codes.json" assert { type: "json" };

dotenv.config();
const app = express();
app.use(express.json());

const STEDI_API_KEY = process.env.STEDI_API_KEY;
const STEDI_BASE_URL = "https://healthcare.stedi.com/v1";

// Generic function to call Stedi Eligibility API
async function checkEligibility(subscriber, provider, encounter) {
  const response = await axios.post(
    `${STEDI_BASE_URL}/eligibility-checks`,
    { subscriber, provider, encounter },
    {
      headers: {
        Authorization: `Bearer ${STEDI_API_KEY}`,
        "Content-Type": "application/json"
      }
    }
  );
  return response.data;
}

// Check if general benefits already cover a procedure
function isCoveredInGeneral(generalBenefits, procedureCode) {
  if (!generalBenefits || !generalBenefits.benefits) return false;
  return generalBenefits.benefits.some(
    (b) =>
      b.service?.toUpperCase() === procedureCode.toUpperCase() ||
      (b.serviceTypeCode === "35") // fallback for broad dental coverage
  );
}

// Optimized dental benefits route
app.post("/dental-benefits", async (req, res) => {
  try {
    const { subscriber, provider } = req.body;

    // 1️⃣ General dental coverage (STC 35)
    const generalBenefits = await checkEligibility(subscriber, provider, {
      serviceTypeCodes: ["35"]
    });

    const combinedResults = {
      general: generalBenefits,
      procedures: []
    };

    // 2️⃣ Loop CDT codes, skip if covered by general benefits
    for (const item of dentalCodes) {
      const covered = isCoveredInGeneral(generalBenefits, item.code);

      let procedureBenefit = null;
      if (!covered) {
        procedureBenefit = await checkEligibility(subscriber, provider, {
          procedureCode: item.code,
          productOrServiceIDQualifier: "AD"
        });
      }

      combinedResults.procedures.push({
        code: item.code,
        description: item.description,
        benefit: procedureBenefit?.benefits || (covered ? "Covered in STC 35" : null)
      });
    }

    res.json(combinedResults);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data || error.message
    });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server running on port 3000");
});
