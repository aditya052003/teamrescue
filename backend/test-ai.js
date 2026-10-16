import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

async function testAI() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    console.log("Missing GEMINI_API_KEY. Check backend/.env.");
    return;
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: "Reply with only: TeamRescue AI connected",
    });

    console.log(response.text);
  } catch (error) {
    const message = String(error.message ?? error)
      .split(apiKey)
      .join("[KEY HIDDEN]");

    console.error("Gemini connection failed:", message);
  }
}

testAI();