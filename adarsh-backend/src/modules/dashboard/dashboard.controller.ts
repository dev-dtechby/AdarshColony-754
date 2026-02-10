// branao-backend/src/modules/dashboard/dashboard.controller.ts
import { Request, Response } from "express";
import { getSiteDashboardSummary } from "./dashboard.service";

const isYMD = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);

export const getSiteSummary = async (req: Request, res: Response) => {
  try {
    const siteId = String(req.query.siteId || "").trim();
    const from = String(req.query.from || "").trim();
    const to = String(req.query.to || "").trim();

    if (!siteId) {
      return res.status(400).json({
        success: false,
        message: "siteId is required",
      });
    }

    if (from && !isYMD(from)) {
      return res.status(400).json({
        success: false,
        message: "from must be in YYYY-MM-DD format",
      });
    }

    if (to && !isYMD(to)) {
      return res.status(400).json({
        success: false,
        message: "to must be in YYYY-MM-DD format",
      });
    }

    const data = await getSiteDashboardSummary({ siteId, from, to });

    return res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error("❌ Dashboard Summary Error:", error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to load dashboard summary",
    });
  }
};
