import { Request, Response } from "express";
import prisma from "../../lib/prisma";

/* ================= GET ================= */
export const getLedgerTypes = async (
  _req: Request,
  res: Response
) => {
  const data = await prisma.ledgerType.findMany({
    where: { isDeleted: false },
    orderBy: { name: "asc" },
  });

  res.json({ success: true, data });
};

/* ================= CREATE ================= */
export const createLedgerType = async (
  req: Request,
  res: Response
) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({
      success: false,
      message: "Ledger Type name is required",
    });
  }

  const exists = await prisma.ledgerType.findFirst({
    where: {
      name,
      isDeleted: false,
    },
  });

  if (exists) {
    return res.status(400).json({
      success: false,
      message: "Ledger Type already exists",
    });
  }

  const data = await prisma.ledgerType.create({
    data: { name },
  });

  res.json({ success: true, data });
};

/* ================= DELETE (SOFT) ================= */
export const deleteLedgerType = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;

  await prisma.ledgerType.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });

  res.json({ success: true });
};
