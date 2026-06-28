import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildReviewPrompt } from "../prompts/reviewPrompt.js";
import { buildSmartFixPrompt } from "../prompts/smartFixPrompt.js";

let genAI = null;
const getGenAI = () => {
  if (!genAI)
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "placeholder");
  return genAI;
};

const parseJSON = (text) => {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");

  if (start === -1 || end === -1) {
    throw new Error(
      `No JSON object found in model response. Raw: ${text.slice(0, 200)}`,
    );
  }

  const jsonStr = text.slice(start, end + 1);

  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    const cleaned = jsonStr
      .replace(/[\x00-\x1F\x7F]/g, " ") 
      .replace(/,\s*}/g, "}") 
      .replace(/,\s*]/g, "]"); 
    return JSON.parse(cleaned);
  }
};

export const analyzeWithGemini = async (code, language) => {
  try {
    const model = getGenAI().getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(
      buildReviewPrompt(code, language),
    );
    const data = parseJSON(result.response.text());
    return { success: true, data, usedModel: "gemini" };
  } catch (error) {
    console.error(`[GeminiService] analyze failed for ${language}:`, error.message);
    if (error.stack) console.error(error.stack);
    return { success: false, error: error.message };
  }
};

export const smartFixWithGemini = async (code, language, issues) => {
  try {
    const model = getGenAI().getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(
      buildSmartFixPrompt(code, language, issues),
    );
    const data = parseJSON(result.response.text());
    return { success: true, data };
  } catch (error) {
    console.error("[GeminiService] smartfix failed:", error.message);
    if (error.stack) console.error(error.stack);
    return { success: false, error: error.message };
  }
};

export const chatWithGemini = async (code, language, analysis, messages) => {
  try {
    const model = getGenAI().getGenerativeModel({ model: "gemini-2.0-flash" });
    
    // Build a combined prompt from system + user messages
    const systemPrompt = `You are a helpful AI code mentor. The user's ${language} code scored ${analysis?.score || '?'}/100. Answer questions about their code concisely. Reference line numbers when relevant.\n\nCode:\n\`\`\`${language}\n${code}\n\`\`\``;
    
    // Convert messages array to a single conversational prompt for Gemini
    const conversationParts = messages
      .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n\n');
    
    const fullPrompt = `${systemPrompt}\n\n${conversationParts}\n\nAssistant:`;
    
    const result = await model.generateContent(fullPrompt);
    const reply = result.response.text();
    
    return { success: true, data: { reply }, usedModel: "gemini" };
  } catch (error) {
    console.error("[GeminiService] chat failed:", error.message);
    return { success: false, error: error.message };
  }
};

