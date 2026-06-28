import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const OLLAMA_URL = process.env.OLLAMA_URL || "http://127.0.0.1:11434";

async function checkOllama() {
  console.log(`--- Ollama Diagnostic Start (URL: ${OLLAMA_URL}) ---`);
  
  // 1. Check Tags
  try {
    console.log("1. Checking /api/tags...");
    const tagsRes = await axios.get(`${OLLAMA_URL}/api/tags`, { timeout: 3000 });
    console.log("   Tags success! Models available:");
    const models = tagsRes.data.models || [];
    models.forEach(m => console.log(`   - ${m.name}`));
    
    const hasQwen = models.some(m => m.name.includes("qwen2.5-coder"));
    if (hasQwen) {
      console.log("   [OK] qwen2.5-coder found.");
    } else {
      console.log("   [WARN] qwen2.5-coder NOT found. Please run 'ollama pull qwen2.5-coder'");
    }
  } catch (e) {
    console.log(`   [FAIL] Could not reach /api/tags: ${e.message}`);
    if (e.code === 'ECONNREFUSED') {
      console.log("   Check if Ollama desktop or 'ollama serve' is actually running.");
    }
  }

  // 2. Try simple generation
  try {
    console.log("\n2. Attempting a simple generation test...");
    const genRes = await axios.post(`${OLLAMA_URL}/api/generate`, {
      model: "qwen2.5-coder",
      prompt: "hi",
      stream: false
    }, { timeout: 10000 });
    console.log("   Generation success!");
    console.log(`   Response: "${genRes.data.response}"`);
  } catch (e) {
    console.log(`   [FAIL] Generation failed: ${e.message}`);
  }
  
  console.log("\n--- Ollama Diagnostic End ---");
}

checkOllama();
