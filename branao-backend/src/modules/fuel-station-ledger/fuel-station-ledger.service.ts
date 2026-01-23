import prisma from "../../lib/prisma";

type PurchaseType = "OWN_VEHICLE" | "RENT_VEHICLE";

type BulkRow = {
  rowKey?: string;

  entryDate?: string; // ISO (row-wise)
  slipNo?: string | null;

  through?: string | null;
  purchaseType: PurchaseType;

  // ✅ only when RENT_VEHICLE
  ownerLedgerId?: string | null;

  vehicleNumber: string;
  vehicleName?: string | null;

  fuelType: string;
  qty: number | string;
  rate: number | string;

  remarks?: string | null;
};

const n = (v: any) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

const clean = (v: any) => String(v ?? "").trim();

/** Decimal.js safety: always JSON-safe */
const toJsonSafe = (row: any) => ({
  ...row,
  qty: row?.qty != null ? String(row.qty) : row?.qty,
  rate: row?.rate != null ? String(row.rate) : row?.rate,
  amount: row?.amount != null ? String(row.amount) : row?.amount,
});

function buildExpenseTitle(fuelType: string) {
  const ft = String(fuelType || "").trim();
  return ft ? `Fuel Purchase - ${ft}` : "Fuel Purchase";
}

function buildExpenseSummary(p: {
  fuelStationName: string;
  fuelType: string;
  purchaseType: string;

  // ✅ show owner name in summary for rent
  ownerName?: string | null;

  vehicleNumber: string;
  vehicleName?: string | null;
  through?: string | null;
  slipNo?: string | null;
  remarks?: string | null;
}) {
  const parts: string[] = [];
  parts.push(`Fuel Station: ${p.fuelStationName}`);
  if (p.fuelType) parts.push(`Fuel: ${p.fuelType}`);

  if (p.purchaseType === "RENT_VEHICLE") {
    parts.push(`PurchaseType: RENT_VEHICLE`);
    if (p.ownerName) parts.push(`Owner: ${p.ownerName}`);
  } else {
    parts.push(`PurchaseType: OWN_VEHICLE`);
  }

  parts.push(`VehicleNo: ${p.vehicleNumber}`);
  if (p.vehicleName) parts.push(`Vehicle: ${p.vehicleName}`);

  if (p.through) parts.push(`Through: ${p.through}`);
  if (p.slipNo) parts.push(`SlipNo: ${p.slipNo}`);
  if (p.remarks) parts.push(`Remarks: ${p.remarks}`);

  return parts.join(" | ");
}

/**
 * ✅ GET Ledger rows
 * FIX: return ownerLedgerId + ownerLedgerName explicitly at top-level
 */
export async function getLedger(filters: { ledgerId?: string; siteId?: string }) {
  const rows = await prisma.fuelStationLedger.findMany({
    where: {
      ...(filters.ledgerId ? { ledgerId: filters.ledgerId } : {}),
      ...(filters.siteId ? { siteId: filters.siteId } : {}),
    },
    include: {
      site: { select: { id: true, siteName: true } },
      ledger: { select: { id: true, name: true } },

      // ✅ NEW (relation must exist in schema)
      ownerLedger: { select: { id: true, name: true } },
    },
    orderBy: { entryDate: "asc" },
  });

  // ✅ Ensure UI always gets these fields
  return rows.map((r: any) => {
    const ownerId = r?.ownerLedgerId ?? r?.ownerLedger?.id ?? null;
    const ownerName = r?.ownerLedger?.name ?? null;

    return {
      ...toJsonSafe(r),
      ownerLedgerId: ownerId ? String(ownerId) : null,
      ownerLedgerName: ownerName ? String(ownerName) : null,
    };
  });
}

/**
 * ✅ CREATE BULK
 */
export async function createBulk(input: {
  ledgerId: string;
  siteId: string;
  entryDate?: string; // fallback date
  rows: BulkRow[];
}) {
  const fuelStationLedger = await prisma.ledger.findUnique({
    where: { id: input.ledgerId },
    select: { id: true, name: true },
  });

  if (!fuelStationLedger) throw new Error("Fuel station ledger not found");

  const fallbackDate = input.entryDate ? new Date(input.entryDate) : new Date();

  const tx = await prisma.$transaction(async (pr) => {
    const created: any[] = [];

    for (const r of input.rows) {
      const entryDate = r.entryDate ? new Date(r.entryDate) : fallbackDate;

      const qty = n(r.qty);
      const rate = n(r.rate);
      const amount = qty * rate;

      const fuelType = clean(r.fuelType);
      const vehicleNumber = clean(r.vehicleNumber);

      if (!fuelType) throw new Error("fuelType required");
      if (!vehicleNumber) throw new Error("vehicleNumber required");
      if (!(qty > 0)) throw new Error("qty must be > 0");
      if (!(rate > 0)) throw new Error("rate must be > 0");

      const purchaseType = r.purchaseType as PurchaseType;
      if (!purchaseType) throw new Error("purchaseType required");

      // ✅ validate owner for rent + fetch owner name
      let ownerLedgerId: string | null = null;
      let ownerName: string | null = null;

      if (purchaseType === "RENT_VEHICLE") {
        ownerLedgerId = clean(r.ownerLedgerId) || null;
        if (!ownerLedgerId) throw new Error("ownerLedgerId required for RENT_VEHICLE");

        const owner = await pr.ledger.findUnique({
          where: { id: ownerLedgerId },
          select: { id: true, name: true },
        });
        if (!owner) throw new Error("owner ledger not found");
        ownerName = owner.name;
      }

      // 1) create SiteExpense
      const expenseTitle = buildExpenseTitle(fuelType);
      const expenseSummary = buildExpenseSummary({
        fuelStationName: fuelStationLedger.name,
        fuelType,
        purchaseType,
        ownerName,
        vehicleNumber,
        vehicleName: r.vehicleName ?? null,
        through: r.through ?? null,
        slipNo: r.slipNo ?? null,
        remarks: r.remarks ?? null,
      });

      const siteExpense = await pr.siteExpense.create({
        data: {
          siteId: input.siteId,
          expenseDate: entryDate,
          expenseTitle,
          summary: expenseSummary,
          paymentDetails: r.through ? clean(r.through) : null,
          amount: amount as any,
        },
        select: { id: true },
      });

      // 2) create FuelStationLedger row
      const ledgerRow = await pr.fuelStationLedger.create({
        data: {
          ledgerId: input.ledgerId,
          siteId: input.siteId,
          siteExpenseId: siteExpense.id,

          entryDate,

          slipNo: r.slipNo ? clean(r.slipNo) : null,
          through: r.through ? clean(r.through) : null,
          purchaseType: purchaseType,

          // ✅ owner reference (must exist in schema)
          ownerLedgerId: ownerLedgerId,

          vehicleNumber,
          vehicleName: r.vehicleName ? clean(r.vehicleName) : null,

          fuelType,
          qty: qty as any,
          rate: rate as any,
          amount: amount as any,

          remarks: r.remarks ? clean(r.remarks) : null,
        },
        include: {
          site: { select: { id: true, siteName: true } },
          ledger: { select: { id: true, name: true } },

          // ✅ NEW
          ownerLedger: { select: { id: true, name: true } },
        },
      });

      const ownerId = ledgerRow?.ownerLedgerId ?? ledgerRow?.ownerLedger?.id ?? null;
      const ownerNm = ledgerRow?.ownerLedger?.name ?? null;

      created.push({
        ...toJsonSafe(ledgerRow),
        ownerLedgerId: ownerId ? String(ownerId) : null,
        ownerLedgerName: ownerNm ? String(ownerNm) : null,
      });
    }

    return created;
  });

  return { count: tx.length, data: tx };
}

/**
 * ✅ UPDATE ONE
 */
export async function updateOne(id: string, patch: any) {
  const existing = await prisma.fuelStationLedger.findUnique({
    where: { id },
    include: {
      ledger: { select: { id: true, name: true } },
      siteExpense: { select: { id: true } },

      // ✅ NEW
      ownerLedger: { select: { id: true, name: true } },
    },
  });

  if (!existing) throw new Error("Row not found");

  const nextQty = patch.qty != null ? n(patch.qty) : n(existing.qty);
  const nextRate = patch.rate != null ? n(patch.rate) : n(existing.rate);
  const nextAmount = patch.amount != null ? n(patch.amount) : nextQty * nextRate;

  const nextFuelType = patch.fuelType != null ? clean(patch.fuelType) : clean(existing.fuelType);
  const nextPurchaseType = patch.purchaseType != null ? patch.purchaseType : existing.purchaseType;

  const nextVehicleNumber =
    patch.vehicleNumber != null ? clean(patch.vehicleNumber) : clean(existing.vehicleNumber);

  const nextVehicleName =
    patch.vehicleName != null ? (clean(patch.vehicleName) || null) : (existing.vehicleName ?? null);

  const nextThrough = patch.through != null ? (clean(patch.through) || null) : (existing.through ?? null);
  const nextSlipNo = patch.slipNo != null ? (clean(patch.slipNo) || null) : (existing.slipNo ?? null);
  const nextRemarks = patch.remarks != null ? (clean(patch.remarks) || null) : (existing.remarks ?? null);

  const nextEntryDate = patch.entryDate != null ? new Date(patch.entryDate) : existing.entryDate;

  // ✅ owner update
  let nextOwnerLedgerId =
    patch.ownerLedgerId !== undefined
      ? (clean(patch.ownerLedgerId) || null)
      : (existing.ownerLedgerId ?? null);

  // If switching to OWN_VEHICLE => owner must be null
  if (String(nextPurchaseType) === "OWN_VEHICLE") nextOwnerLedgerId = null;

  let ownerName: string | null = existing.ownerLedger?.name || null;

  if (String(nextPurchaseType) === "RENT_VEHICLE") {
    if (!nextOwnerLedgerId) throw new Error("ownerLedgerId required for RENT_VEHICLE");

    const owner = await prisma.ledger.findUnique({
      where: { id: nextOwnerLedgerId },
      select: { id: true, name: true },
    });

    if (!owner) throw new Error("owner ledger not found");
    ownerName = owner.name;
  } else {
    ownerName = null;
  }

  const expenseTitle = buildExpenseTitle(nextFuelType);
  const expenseSummary = buildExpenseSummary({
    fuelStationName: existing.ledger?.name || "Fuel Station",
    fuelType: nextFuelType,
    purchaseType: String(nextPurchaseType),
    ownerName,
    vehicleNumber: nextVehicleNumber,
    vehicleName: nextVehicleName,
    through: nextThrough,
    slipNo: nextSlipNo,
    remarks: nextRemarks,
  });

  const updated = await prisma.$transaction(async (pr) => {
    // 1) update linked SiteExpense
    if (existing.siteExpenseId) {
      await pr.siteExpense.update({
        where: { id: existing.siteExpenseId },
        data: {
          expenseDate: nextEntryDate,
          expenseTitle,
          summary: expenseSummary,
          paymentDetails: nextThrough || null,
          amount: nextAmount as any,
        },
      });
    }

    // 2) update FuelStationLedger
    return pr.fuelStationLedger.update({
      where: { id },
      data: {
        entryDate: nextEntryDate,

        slipNo: nextSlipNo || null,
        through: nextThrough || null,
        purchaseType: nextPurchaseType as any,

        // ✅ NEW
        ownerLedgerId: nextOwnerLedgerId,

        vehicleNumber: nextVehicleNumber,
        vehicleName: nextVehicleName || null,

        fuelType: nextFuelType,
        qty: nextQty as any,
        rate: nextRate as any,
        amount: nextAmount as any,

        remarks: nextRemarks || null,
      },
      include: {
        site: { select: { id: true, siteName: true } },
        ledger: { select: { id: true, name: true } },

        // ✅ NEW
        ownerLedger: { select: { id: true, name: true } },
      },
    });
  });

  const ownerId = (updated as any)?.ownerLedgerId ?? (updated as any)?.ownerLedger?.id ?? null;
  const ownerNm = (updated as any)?.ownerLedger?.name ?? null;

  return {
    ...toJsonSafe(updated),
    ownerLedgerId: ownerId ? String(ownerId) : null,
    ownerLedgerName: ownerNm ? String(ownerNm) : null,
  };
}

/**
 * ✅ HARD DELETE
 * - delete FuelStationLedger row AND linked SiteExpense
 */
export async function deleteOne(id: string) {
  const row = await prisma.fuelStationLedger.findUnique({
    where: { id },
    select: { id: true, siteExpenseId: true },
  });

  if (!row) return;

  await prisma.$transaction(async (pr) => {
    await pr.fuelStationLedger.delete({ where: { id: row.id } });

    if (row.siteExpenseId) {
      await pr.siteExpense.delete({ where: { id: row.siteExpenseId } });
    }
  });
}
