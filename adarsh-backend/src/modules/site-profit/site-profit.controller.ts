import { Request, Response } from "express";
import prisma from "../../lib/prisma";

const n = (v: any) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

const rowTotal = (r: any) => {
  // prefer DB totalAmt else qty*rate
  const t = r?.totalAmt;
  if (t !== null && t !== undefined && Number.isFinite(Number(t))) return n(t);
  return n(r?.qty) * n(r?.rate);
};

export const getSiteProfit = async (_req: Request, res: Response) => {
  try {
    /**
     * HARD DELETE MODE:
     * - No isDeleted filters anywhere.
     */

    // 1) Base sites
    const sites = await prisma.site.findMany({
      include: {
        department: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const siteIds = sites.map((s) => s.id);

    // If no sites, return empty quickly
    if (!siteIds.length) {
      return res.json({ success: true, count: 0, data: [] });
    }

    // 2) Manual SiteExpense sum
    const siteExpenseAgg = await prisma.siteExpense.groupBy({
      by: ["siteId"],
      where: { siteId: { in: siteIds } },
      _sum: { amount: true },
    });

    const expenseMap = new Map<string, number>();
    for (const r of siteExpenseAgg) {
      if (!r.siteId) continue;
      expenseMap.set(r.siteId, Number(r._sum.amount || 0));
    }

    // 3) AUTO Material cost from MaterialSupplierLedger (qty*rate OR totalAmt)
    const matRows = await prisma.materialSupplierLedger.findMany({
      where: { siteId: { in: siteIds } },
      select: { siteId: true, qty: true, rate: true, totalAmt: true },
    } as any);

    const materialCostMap = new Map<string, number>();
    for (const r of matRows) {
      if (!r.siteId) continue;
      materialCostMap.set(r.siteId, (materialCostMap.get(r.siteId) || 0) + rowTotal(r));
    }

    // 4) AUTO Vehicle Rent cost (generatedAmt) from VehicleRentLog
    // (If model name differs, adjust accordingly)
    const rentRows = await prisma.vehicleRentLog.findMany({
      where: { siteId: { in: siteIds } },
      select: { siteId: true, generatedAmt: true },
    } as any);

    const vehicleRentCostMap = new Map<string, number>();
    for (const r of rentRows) {
      if (!r.siteId) continue;
      vehicleRentCostMap.set(r.siteId, (vehicleRentCostMap.get(r.siteId) || 0) + n(r.generatedAmt));
    }

    // 5) AUTO Labour Contractor cost from LabourPayment (site-wise sum)
    // (Model name assumed: labourPayment)
    const labourAgg = await prisma.labourPayment.groupBy({
      by: ["siteId"],
      where: { siteId: { in: siteIds } },
      _sum: { amount: true },
    });

    const labourCostMap = new Map<string, number>();
    for (const r of labourAgg) {
      if (!r.siteId) continue;
      labourCostMap.set(r.siteId, Number(r._sum.amount || 0));
    }

    // 6) Received sum from SiteReceipt
    const siteReceiptAgg = await prisma.siteReceipt.groupBy({
      by: ["siteId"],
      where: { siteId: { in: siteIds } },
      _sum: { amount: true },
    });

    const receiptMap = new Map<string, number>();
    for (const r of siteReceiptAgg) {
      if (!r.siteId) continue;
      receiptMap.set(r.siteId, Number(r._sum.amount || 0));
    }

    // 7) Voucher received sum (chequeAmt)
    const voucherAgg = await prisma.voucher.groupBy({
      by: ["siteId"],
      where: { siteId: { in: siteIds } },
      _sum: { chequeAmt: true },
    });

    const voucherMap = new Map<string, number>();
    for (const r of voucherAgg) {
      if (!r.siteId) continue;
      voucherMap.set(r.siteId, Number(r._sum.chequeAmt || 0));
    }

    // 8) Staff IN sum (linked to a site)
    const staffInAgg = await prisma.staffExpense.groupBy({
      by: ["siteId"],
      where: {
        siteId: { in: siteIds },
        inAmount: { not: null },
      },
      _sum: { inAmount: true },
    });

    const staffInMap = new Map<string, number>();
    for (const r of staffInAgg) {
      if (!r.siteId) continue;
      staffInMap.set(r.siteId, Number(r._sum.inAmount || 0));
    }

    // 9) Staff OUT rows NOT mirrored into SiteExpense yet
    // NOTE: This assumes you have relation field staffExpense.siteExpense
    const unMirroredStaffOut = await prisma.staffExpense.findMany({
      where: {
        siteId: { in: siteIds },
        outAmount: { not: null },
        siteExpense: { is: null }, // only those not mirrored
      },
      select: { siteId: true, outAmount: true },
    });

    const staffOutUnmirroredMap = new Map<string, number>();
    for (const r of unMirroredStaffOut) {
      if (!r.siteId) continue;
      staffOutUnmirroredMap.set(r.siteId, (staffOutUnmirroredMap.get(r.siteId) || 0) + n(r.outAmount));
    }

    // 10) Build response
    const rows = sites.map((s) => {
      const siteId = s.id;

      const manualExpense = expenseMap.get(siteId) || 0;
      const staffOutNotMirrored = staffOutUnmirroredMap.get(siteId) || 0;
      const materialPurchaseCost = materialCostMap.get(siteId) || 0;
      const labourContractorCost = labourCostMap.get(siteId) || 0;
      const vehicleRentCost = vehicleRentCostMap.get(siteId) || 0;

      // ✅ Correct expense calculation (no duplicates, labour included)
      const expenses =
        manualExpense +
        staffOutNotMirrored +
        materialPurchaseCost +
        labourContractorCost +
        vehicleRentCost;

      const siteReceipt = receiptMap.get(siteId) || 0;
      const voucherReceived = voucherMap.get(siteId) || 0;
      const staffIn = staffInMap.get(siteId) || 0;

      const amountReceived = siteReceipt + voucherReceived + staffIn;
      const profit = amountReceived - expenses; // negative => loss

      return {
        siteId,
        department: s.department?.name || "",
        siteName: s.siteName,
        status: s.status,

        amountReceived,
        expenses,
        profit,

        // ✅ breakup for UI/debug (optional but very helpful)
        breakup: {
          manualSiteExpense: manualExpense,
          staffOutUnmirrored: staffOutNotMirrored,
          materialPurchaseCost,
          labourContractorCost,
          vehicleRentCost,
          siteReceipt,
          voucherReceived,
          staffIn,
        },
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
