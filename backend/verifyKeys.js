import dotenv from 'dotenv';
dotenv.config();
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";

async function verifyKeys() {
  console.log("Checking API Keys...");
  let geminiStatus = "Skipped";
  let groqStatus = "Skipped";

  // Check Gemini
  if (process.env.GEMINI_API_KEY) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      await model.generateContent("Test message. Reply with 'OK'.");
      geminiStatus = "Valid Structure - Key works.";
    } catch (e) {
      geminiStatus = "Invalid/Error - " + e.message;
    }
  } else {
    geminiStatus = "No key found in .env";
  }

  // Check Groq
  if (process.env.GROQ_API_KEY) {
    try {
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      await groq.chat.completions.create({
        messages: [{ role: "user", content: "Test message. Reply with 'OK'." }],
        model: "llama-3.3-70b-versatile",
        max_tokens: 10
      });
      groqStatus = "Valid Structure - Key works.";
    } catch (e) {
      groqStatus = "Invalid/Error - " + e.message;
    }
  } else {
    groqStatus = "No key found in .env";
  }

  console.log(`\nGemini Key: ${geminiStatus}`);
  console.log(`Groq Key:   ${groqStatus}`);
}

verifyKeys();
