// branao-backend/src/modules/dashboard/dashboard.routes.ts
import { Router } from "express";
import { getSiteSummary } from "./dashboard.controller";

const router = Router();

/**
 * GET /api/dashboard/site-summary?siteId=...&from=YYYY-MM-DD&to=YYYY-MM-DD
 */
router.get("/site-summary", getSiteSummary);

export default router;
