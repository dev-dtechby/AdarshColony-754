import { Request, Response } from "express";
import * as s from "./labour-contractor-ledger.service";

const toNum = (v: any) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

const paramId = (req: Request, ...keys: string[]) => {
  for (const k of keys) {
    const v = (req.params as any)?.[k];
    if (v) return String(v);
  }
  return String((req.params as any)?.id || "");
};

/* ===================== CONTRACTORS ===================== */

export const listContractors = async (_req: Request, res: Response) => {
  try {
    const data = await s.listContractors();
    return res.json({ success: true, count: data.length, data });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e?.message || "Failed", data: [] });
  }
};

export const createContractor = async (req: Request, res: Response) => {
  try {
    const name = String(req.body?.name || "").trim();
    if (!name) return res.status(400).json({ success: false, message: "Name required" });

    const data = await s.createContractor(req.body);
    return res.status(201).json({ success: true, data });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e?.message || "Create failed" });
  }
};

export const updateContractor = async (req: Request, res: Response) => {
  try {
    const id = paramId(req, "contractorId", "id");
    if (!id) return res.status(400).json({ success: false, message: "id required" });

    const data = await s.updateContractor(id, req.body);
    return res.json({ success: true, data });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e?.message || "Update failed" });
  }
};

export const deleteContractorHard = async (req: Request, res: Response) => {
  try {
    const id = paramId(req, "contractorId", "id");
    if (!id) return res.status(400).json({ success: false, message: "id required" });

    await s.deleteContractorHard(id);
    return res.json({ success: true, message: "Deleted permanently" });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e?.message || "Delete failed" });
  }
};

/* ===================== CONTRACTS ===================== */

export const listContracts = async (req: Request, res: Response) => {
  try {
    const data = await s.listContracts({
      contractorId: (req.query.contractorId as string | undefined) || undefined,
      siteId: (req.query.siteId as string | undefined) || undefined,
    });
    return res.json({ success: true, count: data.length, data });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e?.message || "Failed", data: [] });
  }
};

export const createContract = async (req: Request, res: Response) => {
  try {
    const contractorId = String(req.body?.contractorId || "").trim();
    const siteId = String(req.body?.siteId || "").trim();
    const agreedAmount = toNum(req.body?.agreedAmount);

    if (!contractorId || !siteId || agreedAmount === undefined) {
      return res
        .status(400)
        .json({ success: false, message: "contractorId, siteId, agreedAmount required" });
    }
    if (agreedAmount < 0) {
      return res.status(400).json({ success: false, message: "agreedAmount must be >= 0" });
    }

    // multer file (optional)
    const file = (req as any).file as Express.Multer.File | undefined;

    const data = await s.createContract(
      { ...req.body, agreedAmount }, // ensure numeric
      file
    );

    return res.status(201).json({ success: true, data });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e?.message || "Create failed" });
  }
};

export const updateContract = async (req: Request, res: Response) => {
  try {
    // ✅ supports :id OR :contractId
    const id = paramId(req, "contractId", "id");
    if (!id) return res.status(400).json({ success: false, message: "contractId required" });

    const patch: any = { ...req.body };

    // normalize numeric if present
    if (patch.agreedAmount !== undefined) {
      const a = toNum(patch.agreedAmount);
      if (a === undefined || a < 0) {
        return res.status(400).json({ success: false, message: "Invalid agreedAmount" });
      }
      patch.agreedAmount = a;
    }

    const file = (req as any).file as Express.Multer.File | undefined;

    const data = await s.updateContract(id, patch, file);
    return res.json({ success: true, data });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e?.message || "Update failed" });
  }
};

export const deleteContractHard = async (req: Request, res: Response) => {
  try {
    // ✅ supports :id OR :contractId
    const id = paramId(req, "contractId", "id");
    if (!id) return res.status(400).json({ success: false, message: "contractId required" });

    await s.deleteContractHard(id);
    return res.json({ success: true, message: "Deleted permanently" });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e?.message || "Delete failed" });
  }
};

/* ===================== PAYMENTS ===================== */

export const listPayments = async (req: Request, res: Response) => {
  try {
    const data = await s.listPayments({
      contractorId: (req.query.contractorId as string | undefined) || undefined,
      siteId: (req.query.siteId as string | undefined) || undefined,
      from: (req.query.from as string | undefined) || undefined,
      to: (req.query.to as string | undefined) || undefined,
    });
    return res.json({ success: true, count: data.length, data });
  } catch (e: any) {
    return res.status(500).json({ success: false, message: e?.message || "Failed", data: [] });
  }
};

export const createPayment = async (req: Request, res: Response) => {
  try {
    const contractorId = String(req.body?.contractorId || "").trim();
    const siteId = String(req.body?.siteId || "").trim();
    const paymentDate = String(req.body?.paymentDate || "").trim();
    const amount = toNum(req.body?.amount);

    if (!contractorId || !siteId || !paymentDate || amount === undefined) {
      return res
        .status(400)
        .json({ success: false, message: "contractorId, siteId, paymentDate, amount required" });
    }
    if (amount <= 0) return res.status(400).json({ success: false, message: "amount must be > 0" });

    const data = await s.createPayment({ ...req.body, amount });
    return res.status(201).json({ success: true, data });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e?.message || "Create failed" });
  }
};

export const updatePayment = async (req: Request, res: Response) => {
  try {
    // ✅ supports :id OR :paymentId
    const id = paramId(req, "paymentId", "id");
    if (!id) return res.status(400).json({ success: false, message: "paymentId required" });

    const patch: any = { ...req.body };

    if (patch.amount !== undefined) {
      const amt = toNum(patch.amount);
      if (amt === undefined || amt <= 0) {
        return res.status(400).json({ success: false, message: "Invalid amount" });
      }
      patch.amount = amt;
    }

    const data = await s.updatePayment(id, patch);
    return res.json({ success: true, data });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e?.message || "Update failed" });
  }
};

export const deletePaymentHard = async (req: Request, res: Response) => {
  try {
    // ✅ supports :id OR :paymentId
    const id = paramId(req, "paymentId", "id");
    if (!id) return res.status(400).json({ success: false, message: "paymentId required" });

    await s.deletePaymentHard(id);
    return res.json({ success: true, message: "Deleted permanently" });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e?.message || "Delete failed" });
  }
};

/* ===================== LEDGER SUMMARY ===================== */

export const getContractorLedger = async (req: Request, res: Response) => {
  try {
    const contractorId = String(req.params.contractorId || "").trim();
    if (!contractorId) return res.status(400).json({ success: false, message: "contractorId required" });

    const siteId = (req.query.siteId as string | undefined) || undefined;
    const data = await s.getContractorLedger(contractorId, { siteId });

    return res.json({ success: true, data });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e?.message || "Failed" });
  }
};
