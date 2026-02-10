const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const match = envContent.match(/GEMINI_API_KEY=(.*)/);
const API_KEY = match ? match[1].trim() : null;

if (!API_KEY || API_KEY.startsWith('TODO')) {
 console.error("No valid GEMINI_API_KEY found in .env");
 process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

async function listModels() {
 try {
  // Note: listModels is not on genAI directly in some versions, but let's try via direct fetch if needed
  // Actually SDK has it on the client usually? Or via model manager.
  // Let's try to just use a known robust model: "gemini-1.5-flash-latest" or check if listModels exists

  // The SDK documentation says output should be logged.
  console.log("Testing model 'gemini-1.5-flash'...");
  try {
   const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
   const result = await model.generateContent("Hello");
   console.log("Success with gemini-1.5-flash:", result.response.text());
   return;
  } catch (e) { console.log("Failed gemini-1.5-flash", e.message); }

  console.log("Testing model 'gemini-pro'...");
  try {
   const model = genAI.getGenerativeModel({ model: "gemini-pro" });
   const result = await model.generateContent("Hello");
   console.log("Success with gemini-pro:", result.response.text());
   return;
  } catch (e) { console.log("Failed gemini-pro", e.message); }

 } catch (error) {
  console.error("Error listed:", error);
 }
}

listModels();
