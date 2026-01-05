import { Request, Response } from "express";
import prisma from "../../lib/prisma";

export const getSiteProfit = async (_req: Request, res: Response) => {
  try {
    // 1) Base sites (with department + status)
    const sites = await prisma.site.findMany({
      where: { isDeleted: false },
      include: {
        department: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // 2) Expense sum from SiteExpense
    const siteExpenseAgg = await prisma.siteExpense.groupBy({
      by: ["siteId"],
      where: { isDeleted: false },
      _sum: { amount: true },
    });

    const expenseMap = new Map<string, number>();
    for (const r of siteExpenseAgg) {
      expenseMap.set(r.siteId, Number(r._sum.amount || 0));
    }

    // 3) Received sum from SiteReceipt (profit module old logic)
    const siteReceiptAgg = await prisma.siteReceipt.groupBy({
      by: ["siteId"],
      where: { isDeleted: false },
      _sum: { amount: true },
    });

    const receiptMap = new Map<string, number>();
    for (const r of siteReceiptAgg) {
      receiptMap.set(r.siteId, Number(r._sum.amount || 0));
    }

    // 4) ✅ Voucher received sum (chequeAmt) — THIS WAS MISSING
    const voucherAgg = await prisma.voucher.groupBy({
      by: ["siteId"],
      _sum: { chequeAmt: true },
    });

    const voucherMap = new Map<string, number>();
    for (const r of voucherAgg) {
      voucherMap.set(r.siteId, Number(r._sum.chequeAmt || 0));
    }

    // 5) ✅ Staff IN sum (only those linked to a site)
    const staffInAgg = await prisma.staffExpense.groupBy({
      by: ["siteId"],
      where: {
        siteId: { not: null },
        inAmount: { not: null },
      },
      _sum: { inAmount: true },
    });

    const staffInMap = new Map<string, number>();
    for (const r of staffInAgg) {
      if (!r.siteId) continue;
      staffInMap.set(r.siteId, Number(r._sum.inAmount || 0));
    }

    // 6) ✅ Staff OUT (old rows) that are NOT mirrored into SiteExpense yet
    //    (New rows should be mirrored via SiteExpense.staffExpenseId link)
    const unMirroredStaffOut = await prisma.staffExpense.findMany({
      where: {
        siteId: { not: null },
        outAmount: { not: null },
        // relation exists in your schema:
        siteExpense: { is: null }, // ✅ only those not mirrored
      },
      select: { siteId: true, outAmount: true },
    });

    const staffOutUnmirroredMap = new Map<string, number>();
    for (const r of unMirroredStaffOut) {
      if (!r.siteId) continue;
      const prev = staffOutUnmirroredMap.get(r.siteId) || 0;
      staffOutUnmirroredMap.set(r.siteId, prev + Number(r.outAmount || 0));
    }

    // 7) Build response rows
    const rows = sites.map((s) => {
      const siteId = s.id;

      const expenses =
        (expenseMap.get(siteId) || 0) + (staffOutUnmirroredMap.get(siteId) || 0);

      const amountReceived =
        (receiptMap.get(siteId) || 0) +
        (voucherMap.get(siteId) || 0) +
        (staffInMap.get(siteId) || 0);

      const profit = amountReceived - expenses;

      return {
        siteId,
        department: s.department?.name || "",
        siteName: s.siteName,
        expenses,
        amountReceived,
        profit,
        status: s.status,
      };
    });

    return res.json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (e) {
    console.error("SITE PROFIT ERROR:", e);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch site profit",
      data: [],
    });
  }
};
