import { Request, Response } from "express";
import { getSiteProfitData } from "./site-profit.service";

export const getAll = async (_req: Request, res: Response) => {
  try {
    const data = await getSiteProfitData();
    res.status(200).json(data);
  } catch (error) {
    console.error("Site Profit Fetch Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch site profit data",
    });
  }
};
