import { Request, Response } from "express";
import prisma from "../../lib/prisma";

/* =================================================
   GET ALL LEDGERS
================================================= */
export const getLedgers = async (
  _req: Request,
  res: Response
) => {
  const data = await prisma.ledger.findMany({
    where: {
      isDeleted: false,
    },
    include: {
      ledgerType: true,
      site: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  res.json({
    success: true,
    data,
  });
};

/* =================================================
   CREATE LEDGER
================================================= */
export const createLedger = async (
  req: Request,
  res: Response
) => {
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

  // 🔒 Basic validation
  if (!ledgerTypeId || !name) {
    return res.status(400).json({
      success: false,
      message: "Ledger Type and Ledger Name are required",
    });
  }

  const data = await prisma.ledger.create({
    data: {
      ledgerTypeId,
      siteId: siteId || null,
      name,
      address,
      mobile,
      openingBalance,
      closingBalance,
      remark,
    },
  });

  res.json({
    success: true,
    data,
  });
};

/* =================================================
   DELETE LEDGER (SOFT DELETE)
================================================= */
export const deleteLedger = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;

  await prisma.ledger.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });

  res.json({
    success: true,
    message: "Ledger deleted successfully",
  });
};
