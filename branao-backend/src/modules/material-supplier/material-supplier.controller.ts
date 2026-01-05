import { Request, Response } from "express";
import * as service from "./material-supplier.service";

/**
 * Endpoints assumed:
 * GET    /api/material-suppliers
 * GET    /api/material-suppliers/deleted
 * POST   /api/material-suppliers
 * PUT    /api/material-suppliers/:id
 * DELETE /api/material-suppliers/:id
 * POST   /api/material-suppliers/:id/restore
 * DELETE /api/material-suppliers/:id/hard
 */

export const getAllActive = async (_req: Request, res: Response) => {
  try {
    const data = await service.getAllMaterialSuppliers();
    return res.status(200).json({ success: true, count: data.length, data });
  } catch (err: any) {
    console.error("❌ MaterialSupplier getAllActive:", err);
    return res.status(500).json({
      success: false,
      message: err?.message || "Failed to fetch suppliers",
    });
  }
};

export const getAllDeleted = async (_req: Request, res: Response) => {
  try {
    const data = await service.getDeletedMaterialSuppliers();
    return res.status(200).json({ success: true, count: data.length, data });
  } catch (err: any) {
    console.error("❌ MaterialSupplier getAllDeleted:", err);
    return res.status(500).json({
      success: false,
      message: err?.message || "Failed to fetch deleted suppliers",
    });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || "SYSTEM";
    const ip = req.ip;

    const created = await service.createMaterialSupplier(req.body, userId, ip);

    return res.status(201).json({
      success: true,
      message: "Supplier created",
      data: created,
    });
  } catch (err: any) {
    console.error("❌ MaterialSupplier create:", err);
    return res.status(400).json({
      success: false,
      message: err?.message || "Create failed",
    });
  }
};

export const update = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: "id is required" });

    const userId = (req as any).user?.id || "SYSTEM";
    const ip = req.ip;

    const updated = await service.updateMaterialSupplier(id, req.body, userId, ip);

    return res.status(200).json({
      success: true,
      message: "Supplier updated",
      data: updated,
    });
  } catch (err: any) {
    console.error("❌ MaterialSupplier update:", err);
    return res.status(400).json({
      success: false,
      message: err?.message || "Update failed",
    });
  }
};

export const softDelete = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: "id is required" });

    const userId = (req as any).user?.id || "SYSTEM";
    const ip = req.ip;

    await service.softDeleteMaterialSupplier(id, userId, ip);

    return res.status(200).json({
      success: true,
      message: "Supplier moved to deleted records",
    });
  } catch (err: any) {
    console.error("❌ MaterialSupplier softDelete:", err);
    return res.status(400).json({
      success: false,
      message: err?.message || "Delete failed",
    });
  }
};

export const restore = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: "id is required" });

    const userId = (req as any).user?.id || "SYSTEM";
    const ip = req.ip;

    await service.restoreMaterialSupplier(id, userId, ip);

    return res.status(200).json({
      success: true,
      message: "Supplier restored",
    });
  } catch (err: any) {
    console.error("❌ MaterialSupplier restore:", err);
    return res.status(400).json({
      success: false,
      message: err?.message || "Restore failed",
    });
  }
};

export const hardDelete = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: "id is required" });

    const userId = (req as any).user?.id || "SYSTEM";
    const ip = req.ip;

    await service.hardDeleteMaterialSupplier(id, userId, ip);

    return res.status(200).json({
      success: true,
      message: "Supplier permanently deleted",
    });
  } catch (err: any) {
    console.error("❌ MaterialSupplier hardDelete:", err);
    return res.status(400).json({
      success: false,
      message: err?.message || "Hard delete failed",
    });
  }
};
