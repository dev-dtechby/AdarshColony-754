import prisma from "../../lib/prisma";
import fs from "fs";
import cloudinary from "../../config/cloudinary";

/* ================= helpers ================= */

const cleanStr = (v: any) => {
  if (v === undefined || v === null) return undefined;
  const s = String(v).trim();
  return s ? s : undefined;
};

const toDateOrUndefined = (v: any) => {
  if (!v) return undefined;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? undefined : d;
};

const toNum0 = (v: any) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const safeUnlink = (p?: string) => {
  if (!p) return;
  try {
    fs.unlinkSync(p);
  } catch {}
};

async function uploadAgreement(file?: any) {
  if (!file?.path) return { url: undefined as string | undefined, name: undefined as string | undefined };

  try {
    const res = await cloudinary.uploader.upload(file.path, {
      folder: "branao/labour-agreements",
      resource_type: "auto",
    });

    return {
      url: res.secure_url,
      name: file.originalname || res.original_filename,
    };
  } finally {
    safeUnlink(file.path);
  }
}

/* =========================================================
   CONTRACTORS
========================================================= */

export const listContractors = async () => {
  return prisma.labourContractor.findMany({
    orderBy: { createdAt: "desc" },
  });
};

export const createContractor = async (body: any) => {
  const name = String(body?.name || "").trim();
  if (!name) throw new Error("Name required");

  return prisma.labourContractor.create({
    data: {
      name,
      mobile: cleanStr(body?.mobile) || null,
      address: cleanStr(body?.address) || null,
      notes: cleanStr(body?.notes) || null,
    },
  });
};

export const updateContractor = async (id: string, body: any) => {
  if (!id) throw new Error("id required");

  return prisma.labourContractor.update({
    where: { id },
    data: {
      name: body?.name !== undefined ? String(body.name || "").trim() : undefined,
      mobile: body?.mobile !== undefined ? (cleanStr(body.mobile) || null) : undefined,
      address: body?.address !== undefined ? (cleanStr(body.address) || null) : undefined,
      notes: body?.notes !== undefined ? (cleanStr(body.notes) || null) : undefined,
    },
  });
};

// ✅ HARD delete (permanent)
export const deleteContractorHard = async (id: string) => {
  if (!id) throw new Error("id required");

  // safety: block delete if any contract/payment exists
  const c = await prisma.labourContract.count({ where: { contractorId: id } });
  const p = await prisma.labourPayment.count({ where: { contractorId: id } });
  if (c > 0 || p > 0) {
    throw new Error("Cannot delete contractor: contracts/payments exist");
  }

  await prisma.labourContractor.delete({ where: { id } });
  return true;
};

/* =========================================================
   CONTRACTS (SITE DEALS + AGREEMENT)
========================================================= */

export const listContracts = async (q: { contractorId?: string; siteId?: string }) => {
  return prisma.labourContract.findMany({
    where: {
      ...(q.contractorId ? { contractorId: q.contractorId } : {}),
      ...(q.siteId ? { siteId: q.siteId } : {}),
    },
    include: {
      contractor: { select: { id: true, name: true } },
      site: { select: { id: true, siteName: true } },
    },
    orderBy: { createdAt: "desc" },
  });
};

export const createContract = async (body: any, file?: any) => {
  const contractorId = String(body?.contractorId || "").trim();
  const siteId = String(body?.siteId || "").trim();
  const agreedAmount = Number(body?.agreedAmount);

  if (!contractorId || !siteId) throw new Error("contractorId and siteId required");
  if (!Number.isFinite(agreedAmount) || agreedAmount < 0) throw new Error("agreedAmount must be >= 0");

  const startDate = toDateOrUndefined(body?.startDate);
  const endDate = toDateOrUndefined(body?.endDate);

  const up = await uploadAgreement(file);

  return prisma.labourContract.create({
    data: {
      contractorId,
      siteId,
      agreedAmount,
      startDate: startDate || null,
      endDate: endDate || null,
      agreementUrl: up.url || null,
      agreementName: up.name || null,
      remarks: cleanStr(body?.remarks) || null,
    },
    include: {
      contractor: { select: { id: true, name: true } },
      site: { select: { id: true, siteName: true } },
    },
  });
};

export const updateContract = async (id: string, body: any, file?: any) => {
  if (!id) throw new Error("contractId required");

  const patch: any = {};

  if (body?.contractorId !== undefined) patch.contractorId = String(body.contractorId || "").trim();
  if (body?.siteId !== undefined) patch.siteId = String(body.siteId || "").trim();

  if (body?.agreedAmount !== undefined) {
    const amt = Number(body.agreedAmount);
    if (!Number.isFinite(amt) || amt < 0) throw new Error("Invalid agreedAmount");
    patch.agreedAmount = amt;
  }

  if (body?.startDate !== undefined) patch.startDate = toDateOrUndefined(body.startDate) || null;
  if (body?.endDate !== undefined) patch.endDate = toDateOrUndefined(body.endDate) || null;

  if (body?.remarks !== undefined) patch.remarks = cleanStr(body.remarks) || null;

  if (file?.path) {
    const up = await uploadAgreement(file);
    patch.agreementUrl = up.url || null;
    patch.agreementName = up.name || null;
  }

  return prisma.labourContract.update({
    where: { id },
    data: patch,
    include: {
      contractor: { select: { id: true, name: true } },
      site: { select: { id: true, siteName: true } },
    },
  });
};

export const deleteContractHard = async (id: string) => {
  if (!id) throw new Error("contractId required");

  const p = await prisma.labourPayment.count({ where: { contractId: id } });
  if (p > 0) throw new Error("Cannot delete contract: payments exist");

  await prisma.labourContract.delete({ where: { id } });
  return true;
};

/* =========================================================
   PAYMENTS (WEEKLY)
========================================================= */

export const listPayments = async (q: {
  contractorId?: string;
  siteId?: string;
  from?: string;
  to?: string;
}) => {
  const fromD = q.from ? toDateOrUndefined(q.from) : undefined;
  const toD = q.to ? toDateOrUndefined(q.to) : undefined;

  return prisma.labourPayment.findMany({
    where: {
      ...(q.contractorId ? { contractorId: q.contractorId } : {}),
      ...(q.siteId ? { siteId: q.siteId } : {}),
      ...(fromD || toD
        ? {
            paymentDate: {
              ...(fromD ? { gte: fromD } : {}),
              ...(toD ? { lte: toD } : {}),
            },
          }
        : {}),
    },
    include: {
      contractor: { select: { id: true, name: true } },
      site: { select: { id: true, siteName: true } },
      contract: { select: { id: true, agreedAmount: true } },
    },
    orderBy: { paymentDate: "desc" },
  });
};

export const createPayment = async (body: any) => {
  const contractorId = String(body?.contractorId || "").trim();
  const siteId = String(body?.siteId || "").trim();
  const paymentDate = toDateOrUndefined(body?.paymentDate);
  const amount = Number(body?.amount);

  if (!contractorId || !siteId || !paymentDate) throw new Error("contractorId, siteId, paymentDate required");
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("amount must be > 0");

  // optional: auto-attach latest contract for this contractor+site
  let contractId = cleanStr(body?.contractId) || null;
  if (!contractId) {
    const latest = await prisma.labourContract.findFirst({
      where: { contractorId, siteId },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
    contractId = latest?.id || null;
  }

  return prisma.labourPayment.create({
    data: {
      contractorId,
      siteId,
      contractId,
      paymentDate,
      amount,
      mode: body?.mode || "CASH",
      refNo: cleanStr(body?.refNo) || null,
      through: cleanStr(body?.through) || null,
      remarks: cleanStr(body?.remarks) || null,
    },
    include: {
      contractor: { select: { id: true, name: true } },
      site: { select: { id: true, siteName: true } },
      contract: { select: { id: true, agreedAmount: true } },
    },
  });
};

export const updatePayment = async (id: string, body: any) => {
  if (!id) throw new Error("paymentId required");

  const patch: any = {};

  if (body?.contractorId !== undefined) patch.contractorId = String(body.contractorId || "").trim();
  if (body?.siteId !== undefined) patch.siteId = String(body.siteId || "").trim();
  if (body?.contractId !== undefined) patch.contractId = cleanStr(body.contractId) || null;

  if (body?.paymentDate !== undefined) {
    const d = toDateOrUndefined(body.paymentDate);
    if (!d) throw new Error("Invalid paymentDate");
    patch.paymentDate = d;
  }

  if (body?.amount !== undefined) {
    const amt = Number(body.amount);
    if (!Number.isFinite(amt) || amt <= 0) throw new Error("Invalid amount");
    patch.amount = amt;
  }

  if (body?.mode !== undefined) patch.mode = body.mode;
  if (body?.refNo !== undefined) patch.refNo = cleanStr(body.refNo) || null;
  if (body?.through !== undefined) patch.through = cleanStr(body.through) || null;
  if (body?.remarks !== undefined) patch.remarks = cleanStr(body.remarks) || null;

  return prisma.labourPayment.update({
    where: { id },
    data: patch,
    include: {
      contractor: { select: { id: true, name: true } },
      site: { select: { id: true, siteName: true } },
      contract: { select: { id: true, agreedAmount: true } },
    },
  });
};

export const deletePaymentHard = async (id: string) => {
  if (!id) throw new Error("paymentId required");
  await prisma.labourPayment.delete({ where: { id } });
  return true;
};

/* =========================================================
   LEDGER SUMMARY
========================================================= */

export const getContractorLedger = async (contractorId: string, opt: { siteId?: string }) => {
  if (!contractorId) throw new Error("contractorId required");

  const contracts = await prisma.labourContract.findMany({
    where: {
      contractorId,
      ...(opt.siteId ? { siteId: opt.siteId } : {}),
    },
    include: {
      site: { select: { id: true, siteName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const payments = await prisma.labourPayment.findMany({
    where: {
      contractorId,
      ...(opt.siteId ? { siteId: opt.siteId } : {}),
    },
    include: {
      site: { select: { id: true, siteName: true } },
    },
    orderBy: { paymentDate: "desc" },
  });

  // paid per site
  const paidBySite = new Map<string, number>();
  for (const p of payments) {
    const sid = p.siteId;
    paidBySite.set(sid, (paidBySite.get(sid) || 0) + toNum0(p.amount));
  }

  const rows = contracts.map((c) => {
    const paid = paidBySite.get(c.siteId) || 0;
    const agreed = toNum0(c.agreedAmount);
    const bal = agreed - paid;

    return {
      contractId: c.id,
      siteId: c.siteId,
      siteName: c.site.siteName,
      agreedAmount: Number(agreed.toFixed(2)),
      paidAmount: Number(paid.toFixed(2)),
      balanceAmount: Number(bal.toFixed(2)),
      agreementUrl: c.agreementUrl,
      agreementName: c.agreementName,
      remarks: c.remarks,
      startDate: c.startDate,
      endDate: c.endDate,
      createdAt: c.createdAt,
    };
  });

  const totalAgreed = rows.reduce((s, r) => s + toNum0(r.agreedAmount), 0);
  const totalPaid = rows.reduce((s, r) => s + toNum0(r.paidAmount), 0);
  const totalBal = rows.reduce((s, r) => s + toNum0(r.balanceAmount), 0);

  return {
    summary: {
      contractorId,
      totalAgreed: Number(totalAgreed.toFixed(2)),
      totalPaid: Number(totalPaid.toFixed(2)),
      totalBalance: Number(totalBal.toFixed(2)),
    },
    contracts: rows,
    payments,
  };
};
