import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import analyzeRoute from "./routes/analyze.js";
import chatRoute from "./routes/chat.js";
import smartfixRoute from "./routes/smartfix.js";
import executeRoute from "./routes/execute.js";
import memoryRoute from "./routes/memory.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ 
  origin: [
    "https://refyn-rawstxck.vercel.app", 
    "http://localhost:5173",
    "http://localhost:3000"
  ] 
}));
app.use(express.json({ limit: "10mb" }));

app.use("/api/analyze", (req, res, next) => {
  console.log(`[Backend] Analyze request received: model=${req.body.selectedModel} offline=${req.body.offline}`);
  next();
}, analyzeRoute);
app.use("/api/chat", chatRoute);
app.use("/api/smartfix", smartfixRoute);
app.use("/api/execute", executeRoute);
app.use("/api/memory", memoryRoute);

app.get("/health", (req, res) => {
  res.json({
    status: "Refyn backend running",
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`\n⬡ Refyn backend running on http://localhost:${PORT}`);
  console.log(
    `  Groq API: ${process.env.GROQ_API_KEY ? "✓ configured" : "✗ missing"}`,
  );
  console.log(`  Mixtral:    using same Groq key`);
  console.log(`  Ollama:     checking localhost:11434...\n`);
});
