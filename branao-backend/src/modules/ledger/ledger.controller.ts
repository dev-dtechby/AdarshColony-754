import { Request, Response } from "express";
import prisma from "../../lib/prisma";

/* =================================================
   GET ALL LEDGERS
   GET /api/ledgers
================================================= */
export const getLedgers = async (_req: Request, res: Response) => {
  try {
    const data = await prisma.ledger.findMany({
      where: { isDeleted: false },
      include: {
        ledgerType: { select: { id: true, name: true } },
        site: { select: { id: true, siteName: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("GET LEDGERS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch ledgers",
    });
  }
};

/* =================================================
   CREATE LEDGER
   POST /api/ledgers
================================================= */
export const createLedger = async (req: Request, res: Response) => {
  try {
    const {
      ledgerTypeId,
      siteId,
      name,
      address,
      mobile,
      openingBalance,
      closingBalance,
      remark,
    } = req.body;

    if (!ledgerTypeId || !name || !String(name).trim()) {
      return res.status(400).json({
        success: false,
        message: "Ledger Type and Ledger Name are required",
      });
    }

    const data = await prisma.ledger.create({
      data: {
        ledgerTypeId,
        siteId: siteId || null,
        name: String(name).trim(),
        address: address || null,
        mobile: mobile || null,
        openingBalance:
          openingBalance !== undefined && openingBalance !== null && openingBalance !== ""
            ? String(openingBalance)
            : null,
        closingBalance:
          closingBalance !== undefined && closingBalance !== null && closingBalance !== ""
            ? String(closingBalance)
            : null,
        remark: remark || null,
      },
      include: {
        ledgerType: { select: { id: true, name: true } },
        site: { select: { id: true, siteName: true } },
      },
    });

    return res.status(201).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("CREATE LEDGER ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Ledger create failed",
    });
  }
};

/* =================================================
   DELETE LEDGER (SOFT DELETE)
   DELETE /api/ledgers/:id
================================================= */
export const deleteLedger = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Ledger id is required",
      });
    }

    await prisma.ledger.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Ledger deleted successfully",
    });
  } catch (error) {
    console.error("DELETE LEDGER ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Ledger delete failed",
    });
  }
};
