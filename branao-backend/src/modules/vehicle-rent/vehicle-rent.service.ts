import prisma from "../../lib/prisma";
import cloudinary from "../../config/cloudinary";
import fs from "fs";

/* =========================
   Helpers
========================= */
const safeUnlink = (p?: string) => {
  if (!p) return;
  try {
    if (fs.existsSync(p)) fs.unlinkSync(p);
  } catch {
    // ignore
  }
};

const num = (v: any) => {
  const x = Number(String(v ?? "").trim());
  return Number.isFinite(x) ? x : 0;
};

const calc = (start: number, end: number, gen: number, pay: number) => {
  const wh = Math.max(0, num(end) - num(start));
  const bal = num(gen) - num(pay);
  return { workingHour: wh, balanceAmt: bal };
};

async function uploadToCloudinary(localPath: string, folder: string) {
  // NOTE: using your existing cloudinary config: src/config/cloudinary.ts
  const res = await cloudinary.uploader.upload(localPath, {
    folder,
    resource_type: "auto",
  });
  return res; // has secure_url, public_id
}

/* =========================
   Vehicles
========================= */
export const listVehicles = async ({
  ownerLedgerId,
}: {
  ownerLedgerId?: string;
}) => {
  return prisma.vehicleRentVehicle.findMany({
    where: ownerLedgerId ? { ownerLedgerId } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      ownerLedger: { select: { id: true, name: true } },
    },
  });
};

export const createVehicle = async (payload: any) => {
  const ownerLedgerId = String(payload?.ownerLedgerId || "").trim();
  const vehicleNo = String(payload?.vehicleNo || "").trim();
  const vehicleName = String(payload?.vehicleName || "").trim();

  if (!ownerLedgerId) throw new Error("ownerLedgerId required");
  if (!vehicleNo) throw new Error("vehicleNo required");
  if (!vehicleName) throw new Error("vehicleName required");

  const rentBasisRaw = String(payload?.rentBasis || "HOURLY").toUpperCase();
  const rentBasis = rentBasisRaw === "MONTHLY" ? "MONTHLY" : "HOURLY";

  const hourlyRate = rentBasis === "HOURLY" ? num(payload?.hourlyRate) : null;
  const monthlyRate = rentBasis === "MONTHLY" ? num(payload?.monthlyRate) : null;

  if (rentBasis === "HOURLY" && (!hourlyRate || hourlyRate <= 0)) {
    throw new Error("hourlyRate required");
  }
  if (rentBasis === "MONTHLY" && (!monthlyRate || monthlyRate <= 0)) {
    throw new Error("monthlyRate required");
  }

  return prisma.vehicleRentVehicle.create({
    data: {
      ownerLedgerId,
      vehicleNo,
      vehicleName,
      rentBasis: rentBasis as any,
      hourlyRate,   // Decimal? => number ok
      monthlyRate,  // Decimal? => number ok
    },
  });
};

export const updateVehicle = async (id: string, patch: any) => {
  const rentBasisRaw = patch?.rentBasis
    ? String(patch.rentBasis).toUpperCase()
    : undefined;

  const rentBasis =
    rentBasisRaw === "MONTHLY"
      ? "MONTHLY"
      : rentBasisRaw === "HOURLY"
      ? "HOURLY"
      : undefined;

  // If rentBasis is changing, normalize rates accordingly
  const hourlyRate =
    patch?.hourlyRate !== undefined ? num(patch.hourlyRate) : undefined;
  const monthlyRate =
    patch?.monthlyRate !== undefined ? num(patch.monthlyRate) : undefined;

  const data: any = {
    vehicleNo: patch.vehicleNo !== undefined ? String(patch.vehicleNo).trim() : undefined,
    vehicleName: patch.vehicleName !== undefined ? String(patch.vehicleName).trim() : undefined,
    rentBasis: rentBasis as any,
  };

  // ✅ Only set fields if provided, else don't touch
  if (hourlyRate !== undefined) data.hourlyRate = hourlyRate;
  if (monthlyRate !== undefined) data.monthlyRate = monthlyRate;

  // ✅ If rentBasis provided, null out irrelevant rate (keeps DB clean)
  if (rentBasis === "HOURLY") data.monthlyRate = null;
  if (rentBasis === "MONTHLY") data.hourlyRate = null;

  return prisma.vehicleRentVehicle.update({
    where: { id },
    data,
  });
};

export const deleteVehicle = async (id: string) => {
  // hard delete (Cascade logs)
  await prisma.vehicleRentVehicle.delete({ where: { id } });
};

export const uploadAgreement = async (
  vehicleId: string,
  file: Express.Multer.File
) => {
  try {
    const up = await uploadToCloudinary(
      file.path,
      "branao/vehicle-rent-agreements"
    );

    const updated = await prisma.vehicleRentVehicle.update({
      where: { id: vehicleId },
      data: {
        agreementUrl: up.secure_url,
        agreementPublicId: up.public_id,
      },
    });

    return updated;
  } finally {
    safeUnlink(file.path);
  }
};

/* =========================
   Logs
========================= */
export const listLogs = async (q: {
  ownerLedgerId?: string;
  vehicleId?: string;
  siteId?: string;
  from?: string;
  to?: string;
}) => {
  const where: any = {};

  if (q.vehicleId) where.vehicleId = q.vehicleId;
  if (q.siteId && q.siteId !== "ALL") where.siteId = q.siteId;

  if (q.from || q.to) {
    where.entryDate = {};
    if (q.from) where.entryDate.gte = new Date(q.from);
    if (q.to) where.entryDate.lte = new Date(q.to);
  }

  // owner filter needs relation
  if (q.ownerLedgerId) {
    where.vehicle = { ownerLedgerId: q.ownerLedgerId };
  }

  return prisma.vehicleRentLog.findMany({
    where,
    orderBy: { entryDate: "desc" },
    include: {
      site: { select: { id: true, siteName: true } },
      vehicle: {
        select: { id: true, vehicleNo: true, vehicleName: true, ownerLedgerId: true },
      },
    },
  });
};

export const createLog = async (payload: any) => {
  if (!payload?.vehicleId) throw new Error("vehicleId required");
  if (!payload?.siteId) throw new Error("siteId required");
  if (!payload?.entryDate) throw new Error("entryDate required");

  const start = num(payload.startMeter);
  const end = num(payload.endMeter);
  const generated = num(payload.generatedAmt);
  const paid = num(payload.paymentAmt);
  const diesel = num(payload.dieselExp);

  const { workingHour, balanceAmt } = calc(start, end, generated, paid);

  const data = await prisma.vehicleRentLog.create({
    data: {
      vehicleId: String(payload.vehicleId),
      siteId: String(payload.siteId),
      entryDate: new Date(payload.entryDate),

      startMeter: start,
      endMeter: end,
      workingHour: workingHour,

      dieselExp: diesel,
      generatedAmt: generated,
      paymentAmt: paid,
      balanceAmt: balanceAmt,

      remarks: payload.remarks ? String(payload.remarks) : null,
    },
  });

  return data;
};

export const updateLog = async (id: string, patch: any) => {
  const prev = await prisma.vehicleRentLog.findUnique({ where: { id } });
  if (!prev) throw new Error("Not found");

  const start =
    patch.startMeter !== undefined ? num(patch.startMeter) : num(prev.startMeter);
  const end =
    patch.endMeter !== undefined ? num(patch.endMeter) : num(prev.endMeter);
  const gen =
    patch.generatedAmt !== undefined ? num(patch.generatedAmt) : num(prev.generatedAmt);
  const pay =
    patch.paymentAmt !== undefined ? num(patch.paymentAmt) : num(prev.paymentAmt);

  const { workingHour, balanceAmt } = calc(start, end, gen, pay);

  return prisma.vehicleRentLog.update({
    where: { id },
    data: {
      vehicleId: patch.vehicleId ? String(patch.vehicleId) : undefined,
      siteId: patch.siteId ? String(patch.siteId) : undefined,
      entryDate: patch.entryDate ? new Date(patch.entryDate) : undefined,

      startMeter: patch.startMeter !== undefined ? num(patch.startMeter) : undefined,
      endMeter: patch.endMeter !== undefined ? num(patch.endMeter) : undefined,
      workingHour: workingHour, // always recompute

      dieselExp: patch.dieselExp !== undefined ? num(patch.dieselExp) : undefined,
      generatedAmt: patch.generatedAmt !== undefined ? num(patch.generatedAmt) : undefined,
      paymentAmt: patch.paymentAmt !== undefined ? num(patch.paymentAmt) : undefined,
      balanceAmt: balanceAmt, // always recompute

      remarks: patch.remarks !== undefined ? (patch.remarks ? String(patch.remarks) : null) : undefined,
    },
  });
};

export const deleteLog = async (id: string) => {
  await prisma.vehicleRentLog.delete({ where: { id } });
};

/* =========================
   Owner Summary
========================= */
export const ownerSummary = async ({
  ownerLedgerId,
  siteId,
}: {
  ownerLedgerId: string;
  siteId: string;
}) => {
  if (!ownerLedgerId) throw new Error("ownerLedgerId required");

  const where: any = { vehicle: { ownerLedgerId } };
  if (siteId && siteId !== "ALL") where.siteId = siteId;

  const logs = await prisma.vehicleRentLog.findMany({
    where,
    orderBy: { entryDate: "desc" },
    include: {
      site: { select: { id: true, siteName: true } },
      vehicle: { select: { id: true, vehicleNo: true, vehicleName: true } },
    },
  });

  const totals = logs.reduce(
    (a, r) => {
      a.generated += Number(r.generatedAmt || 0);
      a.paid += Number(r.paymentAmt || 0);
      a.diesel += Number(r.dieselExp || 0);
      a.balance += Number(r.balanceAmt || 0);
      return a;
    },
    { generated: 0, paid: 0, diesel: 0, balance: 0 }
  );

  return { logs, totals };
};
