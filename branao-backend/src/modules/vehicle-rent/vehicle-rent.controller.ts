import { Request, Response } from "express";
import * as svc from "./vehicle-rent.service";

/* =========================
   Helpers
========================= */
const str = (v: any) => String(v ?? "").trim();

const optStr = (v: any) => {
  const s = str(v);
  return s ? s : undefined;
};

const n = (v: any) => {
  const x = Number(String(v ?? "").trim());
  return Number.isFinite(x) ? x : 0;
};

const rentBasisNorm = (v: any) => {
  const x = str(v).toUpperCase();
  return x === "MONTHLY" ? ("MONTHLY" as const) : ("HOURLY" as const);
};

/* =========================
   Vehicles
========================= */
export const listVehicles = async (req: Request, res: Response) => {
  try {
    const ownerLedgerId = optStr(req.query.ownerLedgerId);
    const data = await svc.listVehicles({ ownerLedgerId });
    return res.json({ success: true, data });
  } catch (e: any) {
    console.error("VEHICLE_RENT listVehicles ERROR:", e);
    return res.status(500).json({
      success: false,
      message: e?.message || "Failed",
    });
  }
};

export const createVehicle = async (req: Request, res: Response) => {
  try {
    const body = req.body || {};

    const ownerLedgerId = str(body.ownerLedgerId);
    const vehicleNo = str(body.vehicleNo);
    const vehicleName = str(body.vehicleName);
    const rentBasis = rentBasisNorm(body.rentBasis);

    const hourlyRate = body.hourlyRate;
    const monthlyRate = body.monthlyRate;

    const data = await svc.createVehicle({
      ownerLedgerId,
      vehicleNo,
      vehicleName,
      rentBasis,
      hourlyRate,
      monthlyRate,
    });

    return res.status(201).json({ success: true, data });
  } catch (e: any) {
    // service throws validation errors => 400
    return res.status(400).json({
      success: false,
      message: e?.message || "Create failed",
    });
  }
};

export const updateVehicle = async (req: Request, res: Response) => {
  try {
    const id = str(req.params.id);
    if (!id) throw new Error("id required");

    const body = req.body || {};
    const data = await svc.updateVehicle(id, {
      vehicleNo: body.vehicleNo,
      vehicleName: body.vehicleName,
      rentBasis: body.rentBasis,
      hourlyRate: body.hourlyRate,
      monthlyRate: body.monthlyRate,
    });

    return res.json({ success: true, data });
  } catch (e: any) {
    return res.status(400).json({
      success: false,
      message: e?.message || "Update failed",
    });
  }
};

export const deleteVehicle = async (req: Request, res: Response) => {
  try {
    const id = str(req.params.id);
    if (!id) throw new Error("id required");

    await svc.deleteVehicle(id);
    return res.json({ success: true, message: "Deleted" });
  } catch (e: any) {
    return res.status(400).json({
      success: false,
      message: e?.message || "Delete failed",
    });
  }
};

export const uploadAgreement = async (req: Request, res: Response) => {
  try {
    const id = str(req.params.id);
    if (!id) throw new Error("id required");

    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) throw new Error("File missing");

    const data = await svc.uploadAgreement(id, file);
    return res.json({ success: true, data });
  } catch (e: any) {
    return res.status(400).json({
      success: false,
      message: e?.message || "Upload failed",
    });
  }
};

/* =========================
   Logs
========================= */
export const listLogs = async (req: Request, res: Response) => {
  try {
    const q = req.query || {};

    const data = await svc.listLogs({
      ownerLedgerId: optStr(q.ownerLedgerId),
      vehicleId: optStr(q.vehicleId),
      siteId: optStr(q.siteId),
      from: optStr(q.from),
      to: optStr(q.to),
    });

    return res.json({ success: true, data });
  } catch (e: any) {
    console.error("VEHICLE_RENT listLogs ERROR:", e);
    return res.status(500).json({
      success: false,
      message: e?.message || "Failed",
    });
  }
};

export const createLog = async (req: Request, res: Response) => {
  try {
    const b = req.body || {};

    const data = await svc.createLog({
      vehicleId: str(b.vehicleId),
      siteId: str(b.siteId),
      entryDate: str(b.entryDate),

      // controller ensures numbers
      startMeter: n(b.startMeter),
      endMeter: n(b.endMeter),
      dieselExp: n(b.dieselExp),
      generatedAmt: n(b.generatedAmt),
      paymentAmt: n(b.paymentAmt),

      remarks: b.remarks ? str(b.remarks) : null,
    });

    return res.status(201).json({ success: true, data });
  } catch (e: any) {
    return res.status(400).json({
      success: false,
      message: e?.message || "Create failed",
    });
  }
};

export const updateLog = async (req: Request, res: Response) => {
  try {
    const id = str(req.params.id);
    if (!id) throw new Error("id required");

    const b = req.body || {};
    const data = await svc.updateLog(id, {
      entryDate: b.entryDate,
      startMeter: b.startMeter,
      endMeter: b.endMeter,
      dieselExp: b.dieselExp,
      generatedAmt: b.generatedAmt,
      paymentAmt: b.paymentAmt,
      remarks: b.remarks,
      siteId: b.siteId,
      vehicleId: b.vehicleId,
    });

    return res.json({ success: true, data });
  } catch (e: any) {
    return res.status(400).json({
      success: false,
      message: e?.message || "Update failed",
    });
  }
};

export const deleteLog = async (req: Request, res: Response) => {
  try {
    const id = str(req.params.id);
    if (!id) throw new Error("id required");

    await svc.deleteLog(id);
    return res.json({ success: true, message: "Deleted" });
  } catch (e: any) {
    return res.status(400).json({
      success: false,
      message: e?.message || "Delete failed",
    });
  }
};

/* =========================
   Owner Summary
========================= */
export const ownerSummary = async (req: Request, res: Response) => {
  try {
    const ownerLedgerId = str(req.query.ownerLedgerId);
    const siteId = str(req.query.siteId || "ALL"); // ALL or UUID

    const data = await svc.ownerSummary({ ownerLedgerId, siteId });
    return res.json({ success: true, data });
  } catch (e: any) {
    return res.status(400).json({
      success: false,
      message: e?.message || "Failed",
    });
  }
};
