import Groq from "groq-sdk";
import { buildReviewPrompt } from "../prompts/reviewPrompt.js";
import { buildChatSystemPrompt } from "../prompts/chatPrompt.js";
import { buildSmartFixPrompt } from "../prompts/smartFixPrompt.js";

let groq = null;
const getGroq = () => {
  if (!groq)
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "placeholder" });
  return groq;
};

const parseJSON = (text) => {
  // Strip markdown fences first
  const stripped = text
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  // Find JSON object boundaries (robust — handles text before/after JSON)
  const start = stripped.indexOf("{");
  const end = stripped.lastIndexOf("}");

  if (start === -1 || end === -1) {
    throw new Error(
      `No JSON object found in Groq response. Raw: ${text.slice(0, 200)}`,
    );
  }

  const jsonStr = stripped.slice(start, end + 1);

  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    // Second attempt: clean control chars + trailing commas
    const cleaned = jsonStr
      .replace(/[\x00-\x1F\x7F]/g, " ")
      .replace(/,\s*}/g, "}")
      .replace(/,\s*]/g, "]");
    return JSON.parse(cleaned);
  }
};

export const analyzeWithGroq = async (code, language) => {
  try {
    const response = await getGroq().chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: buildReviewPrompt(code, language) }],
      max_tokens: 2048,
      temperature: 0.1,
    });
    const data = parseJSON(response.choices[0].message.content);
    return { success: true, data, usedModel: "groq" };
  } catch (error) {
    console.error("[GroqService] analyze failed:", error.message);
    return { success: false, error: error.message };
  }
};

export const analyzeWithMixtral = async (code, language) => {
  try {
    const response = await getGroq().chat.completions.create({
      model: "mixtral-8x7b-32768",
      messages: [{ role: "user", content: buildReviewPrompt(code, language) }],
      max_tokens: 2048,
      temperature: 0.1,
    });
    const data = parseJSON(response.choices[0].message.content);
    return { success: true, data, usedModel: "mixtral" };
  } catch (error) {
    console.error("[GroqService] mixtral failed:", error.message);
    return { success: false, error: error.message };
  }
};

export const smartFixWithGroq = async (code, language, issues) => {
  try {
    const response = await getGroq().chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "user", content: buildSmartFixPrompt(code, language, issues) },
      ],
      max_tokens: 2048,
      temperature: 0.1,
    });
    const data = parseJSON(response.choices[0].message.content);
    return { success: true, data, usedModel: "groq" };
  } catch (error) {
    console.error("[GroqService] smartfix groq failed:", error.message);
    return { success: false, error: error.message };
  }
};

export const smartFixWithMixtral = async (code, language, issues) => {
  try {
    const response = await getGroq().chat.completions.create({
      model: "mixtral-8x7b-32768",
      messages: [
        { role: "user", content: buildSmartFixPrompt(code, language, issues) },
      ],
      max_tokens: 2048,
      temperature: 0.1,
    });
    const data = parseJSON(response.choices[0].message.content);
    return { success: true, data, usedModel: "mixtral" };
  } catch (error) {
    console.error("[GroqService] smartfix mixtral failed:", error.message);
    return { success: false, error: error.message };
  }
};

export const chatWithGroq = async (code, language, analysis, messages) => {
  try {
    const response = await getGroq().chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: buildChatSystemPrompt(code, language, analysis),
        },
        ...messages,
      ],
      max_tokens: 1024,
      temperature: 0.7,
    });
    return {
      success: true,
      data: { reply: response.choices[0].message.content },
    };
  } catch (error) {
    console.error("[GroqService] chat failed:", error.message);
    return { success: false, error: error.message };
  }
};

export const chatWithMixtral = async (code, language, analysis, messages) => {
  try {
    const response = await getGroq().chat.completions.create({
      model: "mixtral-8x7b-32768",
      messages: [
        {
          role: "system",
          content: buildChatSystemPrompt(code, language, analysis),
        },
        ...messages,
      ],
      max_tokens: 1024,
      temperature: 0.7,
    });
    return {
      success: true,
      data: { reply: response.choices[0].message.content },
    };
  } catch (error) {
    console.error("[GroqService] chat mixtral failed:", error.message);
    return { success: false, error: error.message };
  }
};
