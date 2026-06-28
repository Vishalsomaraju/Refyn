import dotenv from "dotenv";
dotenv.config();
import { fixWithOpenRouter } from "./services/openRouterService.js";

async function run() {
  try {
    const res = await fixWithOpenRouter("You are an expert.", "Fix this code: print(a)");
    console.log(res);
  } catch (err) {
    console.error("Test failed:", err.message);
  }
}
run();
