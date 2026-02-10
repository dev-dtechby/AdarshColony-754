// D:\Projects\AdarshColony754\AdrashApp\adarsh-backend\src\app.ts
import express from "express";
import cors from "cors";
import morgan from "morgan";

// ====================
// ROUTES (AdarshApp)
// ====================
import registrationRoutes from "./modules/registration/registration.routes";

const app = express();

// ====================
// ✅ CORS (AdarshApp LOCAL + PROD)
// ====================
// Keep this list strictly for AdarshApp frontend(s) only.
// Branao origins intentionally NOT included.
const allowedOrigins = [
  "http://localhost:3000",
  // Add your AdarshApp production frontend domains here when deployed:
  // "https://adarshapp.in",
  // "https://www.adarshapp.in",
  // "https://adarshapp.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // allow server-to-server / Postman / curl
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) return callback(null, true);

      return callback(new Error("CORS not allowed: " + origin), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ====================
// ✅ Disable caching (avoid stale data in dev/prod)
// ====================
app.disable("etag");
app.use((_req, res, next) => {
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
  next();
});

// ====================
// MIDDLEWARES
// ====================
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));
app.use(morgan("dev"));

// ====================
// HEALTH CHECK
// ====================
app.get("/", (_req, res) => {
  res.status(200).send("🚀 AdarshApp Backend API Running");
});

// ====================
// API ROUTES (AdarshApp)
// ====================
// Registration module
app.use("/api/registration", registrationRoutes);

// ====================
// 404 HANDLER
// ====================
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

export default app;
