import { Request, Response } from "express";
import { materialMasterService } from "./material-master.service";

const getUserId = (req: Request) => {
  // ✅ Try multiple sources (as per your project patterns)
  const anyReq = req as any;
  const fromUser = anyReq?.user?.id || anyReq?.userId;
  const fromHeader =
    (req.headers["x-user-id"] as string) ||
    (req.headers["x-admin-id"] as string);
  const fromBody = (req.body?.deletedBy as string) || null;

  return (fromUser || fromHeader || fromBody || null) as string | null;
};

export const getMaterialMaster = async (req: Request, res: Response) => {
  try {
    const data = await materialMasterService.getActive();
    return res.json({ data });
  } catch (e: any) {
    return res.status(500).json({
      message: e?.message || "Failed to load materials",
    });
  }
};

export const getDeletedMaterialMaster = async (req: Request, res: Response) => {
  try {
    const data = await materialMasterService.getDeleted();
    return res.json({ data });
  } catch (e: any) {
    return res.status(500).json({
      message: e?.message || "Failed to load deleted materials",
    });
  }
};

export const createMaterialMaster = async (req: Request, res: Response) => {
  try {
    const name = String(req.body?.name || "").trim();
    if (!name) {
      return res.status(400).json({ message: "Material name required" });
    }

    const created = await materialMasterService.create(name);
    return res.status(201).json({ message: "Material added", data: created });
  } catch (e: any) {
    return res.status(400).json({
      message: e?.message || "Create failed",
    });
  }
};

export const updateMaterialMaster = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id || "").trim();
    const name = String(req.body?.name || "").trim();

    if (!id) return res.status(400).json({ message: "Id required" });
    if (!name) return res.status(400).json({ message: "Material name required" });

    const updated = await materialMasterService.update(id, name);
    return res.json({ message: "Material updated", data: updated });
  } catch (e: any) {
    return res.status(400).json({
      message: e?.message || "Update failed",
    });
  }
};

export const deleteMaterialMaster = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id || "").trim();
    if (!id) return res.status(400).json({ message: "Id required" });

    const deletedBy = getUserId(req);
    await materialMasterService.softDelete(id, deletedBy);

    return res.json({ message: "Material deleted (soft)" });
  } catch (e: any) {
    return res.status(400).json({
      message: e?.message || "Delete failed",
    });
  }
};

export const restoreMaterialMaster = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id || "").trim();
    if (!id) return res.status(400).json({ message: "Id required" });

    const restored = await materialMasterService.restore(id);
    return res.json({ message: "Material restored", data: restored });
  } catch (e: any) {
    return res.status(400).json({
      message: e?.message || "Restore failed",
    });
  }
};

export const hardDeleteMaterialMaster = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id || "").trim();
    if (!id) return res.status(400).json({ message: "Id required" });

    await materialMasterService.hardDelete(id);
    return res.json({ message: "Material deleted permanently" });
  } catch (e: any) {
    return res.status(400).json({
      message: e?.message || "Hard delete failed",
    });
  }
};
