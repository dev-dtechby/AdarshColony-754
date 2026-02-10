// branao-backend/src/modules/dashboard/dashboard.service.ts
import prisma from "../../lib/prisma";

/**
 * This service is schema-resilient:
 * - Auto-detects SiteTransaction date field: entryDate | txnDate | date | createdAt
 * - Auto-detects Site name field: name | siteName | title | ...
 * - Avoids TS errors by using safe casting where needed
 */

type Params = {
  siteId: string;
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
};

const pad2 = (n: number) => String(n).padStart(2, "0");
const toYMD = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

const buildRange = (from?: string, to?: string) => {
  let fromDate: Date | undefined;
  let toDate: Date | undefined;

  if (from) {
    const [y, m, d] = from.split("-").map(Number);
    fromDate = new Date(y, m - 1, d, 0, 0, 0, 0);
  }
  if (to) {
    const [y, m, d] = to.split("-").map(Number);
    toDate = new Date(y, m - 1, d, 23, 59, 59, 999);
  }

  // default: last 30 days
  if (!fromDate && !toDate) {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    fromDate = start;
    toDate = end;
  }

  // if only one provided
  if (fromDate && !toDate) {
    const end = new Date(fromDate);
    end.setDate(end.getDate() + 30);
    end.setHours(23, 59, 59, 999);
    toDate = end;
  }
  if (!fromDate && toDate) {
    const start = new Date(toDate);
    start.setDate(start.getDate() - 30);
    start.setHours(0, 0, 0, 0);
    fromDate = start;
  }

  return { fromDate: fromDate!, toDate: toDate! };
};

const toNum = (v: any) => (v == null ? 0 : Number(v));

const resolveSiteName = (site: any) => {
  return (
    site?.name ??
    site?.siteName ??
    site?.site_name ??
    site?.title ??
    site?.siteTitle ??
    site?.site ??
    ""
  );
};

/**
 * Detect actual date column in SiteTransaction model.
 * Tries: entryDate -> txnDate -> date -> createdAt
 */
const detectTxnDateField = async (): Promise<string> => {
  const candidates = ["entryDate", "txnDate", "date", "createdAt"];

  for (const f of candidates) {
    try {
      // Try selecting this field from one record
      await (prisma.siteTransaction as any).findFirst({
        select: { [f]: true },
      });
      return f;
    } catch (_e) {
      // continue
    }
  }

  // fallback (most likely exists)
  return "createdAt";
};

/**
 * Detect optional columns for recent mapping.
 */
const pickFirstExisting = (obj: any, keys: string[]) => {
  for (const k of keys) {
    if (obj && obj[k] != null) return obj[k];
  }
  return undefined;
};

export const getSiteDashboardSummary = async ({ siteId, from, to }: Params) => {
  const { fromDate, toDate } = buildRange(from, to);

  // 1) Site info (avoid select errors; take full record)
  const siteRow = await prisma.site.findUnique({
    where: { id: siteId },
  });

  if (!siteRow) throw new Error("Site not found");

  const site = {
    id: (siteRow as any).id,
    name: resolveSiteName(siteRow),
  };

  // 2) Resolve transaction date field
  const dateField = await detectTxnDateField();

  // Build where using dynamic key
  const baseWhere: any = {
    siteId,
    [dateField]: { gte: fromDate, lte: toDate },
  };

  // 3) Inflow/Outflow/Profit (best-effort nature values)
  // If your enum differs, replace these values accordingly.
  const creditNatureCandidates = ["CREDIT", "IN", "RECEIPT"];
  const debitNatureCandidates = ["DEBIT", "OUT", "EXPENSE"];

  const sumByNature = async (natureList: string[]) => {
    // try "nature in [...]" first; if schema differs, fallback to raw sum without nature
    try {
      const agg = await (prisma.siteTransaction as any).aggregate({
        where: { ...baseWhere, nature: { in: natureList } },
        _sum: { amount: true },
      });
      return toNum(agg?._sum?.amount);
    } catch (_e) {
      // fallback: 0 instead of crashing
      return 0;
    }
  };

  const [inflow, outflow] = await Promise.all([
    sumByNature(creditNatureCandidates),
    sumByNature(debitNatureCandidates),
  ]);

  const profit = inflow - outflow;

  // 4) Cost breakdown by source (DEBIT only)
  let costBreakdown: Array<{ label: string; amount: number }> = [];
  try {
    const debitBySource = await (prisma.siteTransaction as any).groupBy({
      by: ["source"],
      where: { ...baseWhere, nature: { in: debitNatureCandidates } },
      _sum: { amount: true },
    });

    costBreakdown = (debitBySource || []).map((r: any) => ({
      label: String(r.source),
      amount: toNum(r._sum?.amount),
    }));
  } catch (_e) {
    costBreakdown = [];
  }

  // 5) Profit trend (daily) using SQL, based on detected dateField
  // We must keep table name "SiteTransaction" same as Prisma model mapping.
  // If your table name is different, replace it accordingly.
  let profitTrend: Array<{ date: string; inflow: number; outflow: number; profit: number }> = [];
  try {
    const rows: any[] = await prisma.$queryRawUnsafe(
      `
      SELECT
        DATE(st.${dateField}) AS day,
        SUM(CASE WHEN st.nature IN (${creditNatureCandidates.map(() => "?").join(",")}) THEN st.amount ELSE 0 END) AS inflow,
        SUM(CASE WHEN st.nature IN (${debitNatureCandidates.map(() => "?").join(",")}) THEN st.amount ELSE 0 END) AS outflow
      FROM SiteTransaction st
      WHERE st.siteId = ?
        AND st.${dateField} >= ?
        AND st.${dateField} <= ?
      GROUP BY DATE(st.${dateField})
      ORDER BY DATE(st.${dateField}) ASC
      `,
      ...creditNatureCandidates,
      ...debitNatureCandidates,
      siteId,
      fromDate,
      toDate
    );

    profitTrend = (rows || []).map((r: any) => {
      const infl = toNum(r.inflow);
      const out = toNum(r.outflow);
      const dayStr =
        typeof r.day === "string" ? r.day : toYMD(new Date(r.day as any));
      return { date: dayStr, inflow: infl, outflow: out, profit: infl - out };
    });
  } catch (_e) {
    profitTrend = [];
  }

  // 6) Staff/Supervisor counts (if your ledger types differ, adjust names)
  let staffCount = 0;
  let supervisorCount = 0;
  try {
    const types = await prisma.ledgerType.findMany({
      select: { id: true, name: true },
    });

    const staffType = types.find((t) => String(t.name).toUpperCase() === "STAFF");
    const supType = types.find(
      (t) => String(t.name).toUpperCase() === "SUPERVISOR"
    );

    if (staffType) staffCount = await prisma.ledger.count({ where: { ledgerTypeId: staffType.id } });
    if (supType) supervisorCount = await prisma.ledger.count({ where: { ledgerTypeId: supType.id } });
  } catch (_e) {
    staffCount = 0;
    supervisorCount = 0;
  }

  // 7) Source-wise sums (diesel/rent/labour) - update these sources as per your enum
  const sumBySource = async (sourceValue: string) => {
    try {
      const agg = await (prisma.siteTransaction as any).aggregate({
        where: {
          ...baseWhere,
          nature: { in: debitNatureCandidates },
          source: sourceValue,
        },
        _sum: { amount: true },
      });
      return toNum(agg?._sum?.amount);
    } catch (_e) {
      return 0;
    }
  };

  const [dieselAmount, vehicleRentAmount, labourAmount] = await Promise.all([
    sumBySource("FUEL"),
    sumBySource("VEHICLE_RENT"),
    sumBySource("LABOUR"),
  ]);

  // Diesel qty / vehicle summary / station summary / contractor summary:
  // These depend on your actual fuel/labour tables OR metadata fields in SiteTransaction.
  // We'll keep safe defaults here (no crash).
  const dieselQty = 0;

  const vehicleFuelSummary: Array<{
    vehicleNo: string;
    qty: number;
    amount: number;
    avgRate: number;
    entries: number;
  }> = [];

  const fuelStationSummary: Array<{
    stationName: string;
    qty: number;
    amount: number;
  }> = [];

  const contractorSummary: Array<{
    contractorName: string;
    amount: number;
  }> = [];

  // 8) Recent transactions (top 20)
  let recent: Array<{
    date: string;
    source: string;
    refNo?: string;
    party?: string;
    amount: number;
    remark?: string;
  }> = [];

  try {
    const txRows = await (prisma.siteTransaction as any).findMany({
      where: baseWhere,
      orderBy: { [dateField]: "desc" },
      take: 20,
    });

    recent = (txRows || []).map((r: any) => {
      const dt = pickFirstExisting(r, [dateField, "createdAt", "updatedAt"]);
      const party = pickFirstExisting(r, ["party", "particulars", "ledgerName", "name", "description"]);
      const remark = pickFirstExisting(r, ["remark", "notes", "narration", "description"]);
      const refNo = pickFirstExisting(r, ["sourceId", "refNo", "referenceNo", "id"]);

      return {
        date: dt ? toYMD(new Date(dt)) : toYMD(new Date()),
        source: String(r.source ?? "UNKNOWN"),
        refNo: refNo ? String(refNo) : undefined,
        party: party ? String(party) : undefined,
        amount: toNum(r.amount),
        remark: remark ? String(remark) : undefined,
      };
    });
  } catch (_e) {
    recent = [];
  }

  return {
    site,
    range: { from: toYMD(fromDate), to: toYMD(toDate) },

    kpis: {
      inflow,
      outflow,
      profit,
      staffCount,
      supervisorCount,
      dieselQty,
      dieselAmount,
      vehicleRentAmount,
      labourAmount,
    },

    profitTrend,
    costBreakdown,

    vehicleFuelSummary,
    fuelStationSummary,
    contractorSummary,

    recent,
  };
};
