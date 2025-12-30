import express from "express";
import dotenv from "dotenv";
import app from "./app"; // ✅ app.ts se express instance

// ====================
// Load ENV
// ====================
dotenv.config();

// ====================
// Port
// ====================
const PORT = Number(process.env.PORT) || 5000;

// ====================
// Start Server
// ====================
app.listen(PORT, () => {
  console.log("=====================================");
  console.log("🚀 Branao Backend running on port:", PORT);
  console.log("🌍 Environment:", process.env.NODE_ENV || "development");
  console.log("=====================================");
});
