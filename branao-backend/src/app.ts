import express from "express";
import cors from "cors";
import morgan from "morgan";

// Routes
import siteRoutes from "./modules/site/site.routes";
import departmentRoutes from "./modules/department/department.routes";
import siteExpRoutes from "./modules/site-exp/site-exp.routes";

const app = express();

// ====================
// ✅ CORS (LOCAL + PROD)
// ====================
const allowedOrigins = [
  "http://localhost:3000",          // local frontend
  "https://branao.in",              // production
  "https://www.branao.in",
  "https://branao.vercel.app",      // vercel default
];

app.use(
  cors({
    origin: (origin, callback) => {
      // allow server-to-server / Postman / curl
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS not allowed: " + origin));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ====================
// Middlewares
// ====================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// ====================
// Health Check
// ====================
app.get("/", (_req, res) => {
  res.status(200).send("🚀 Branao Backend API Running");
});

// ====================
// API Routes
// ====================
app.use("/api/sites", siteRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/site-exp", siteExpRoutes);
// ====================
// 404 Handler
// ====================
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

export default app;
