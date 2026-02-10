import express from "express";
import { getSiteProfit } from "./site-profit.controller";
const router = express.Router();
router.get("/", getSiteProfit);
export default router;
