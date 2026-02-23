import { Request, Response } from "express";
import {
  listMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember,
  importMembersFromExcel,
  upsertRentalByFlat,
  clearRentalByFlat,
} from "./member.service";

/**
 * NOTE:
 * - Excel import uses memoryStorage: req.file.buffer
 * - Rental save uses memoryStorage fields:
 *    rentAgreement (optional)
 *    policeVerification (optional)
 */

export async function getMembersHandler(req: Request, res: Response) {
  try {
    const block = (req.query.block as string) ?? "ALL";
    const q = ((req.query.q as string) ?? "").trim();
    const sort = ((req.query.sort as string) ?? "blockFlat") as "blockFlat" | "name";

    const data = await listMembers({ block, q, sort });
    return res.json({ ok: true, data });
  } catch (e: any) {
    return res.status(500).json({ ok: false, message: e?.message ?? "Failed to fetch members" });
  }
}

export async function getMemberByIdHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data = await getMemberById(id);

    if (!data) return res.status(404).json({ ok: false, message: "Member not found" });
    return res.json({ ok: true, data });
  } catch (e: any) {
    return res.status(500).json({ ok: false, message: e?.message ?? "Failed to fetch member" });
  }
}

export async function createMemberHandler(req: Request, res: Response) {
  try {
    const payload = req.body;

    if (!payload?.name) {
      return res.status(400).json({ ok: false, message: "name is required" });
    }
    if (!payload?.blockNo || !payload?.flatNo) {
      return res.status(400).json({ ok: false, message: "blockNo and flatNo are required" });
    }

    const created = await createMember({
      name: String(payload.name).trim(),
      fatherOrHusbandName: payload.fatherOrHusbandName ? String(payload.fatherOrHusbandName).trim() : null,
      mobileNo: payload.mobileNo ? String(payload.mobileNo).trim() : null,
      blockNo: Number(payload.blockNo),
      floor: payload.floor ? String(payload.floor).trim().toUpperCase() : null,
      flatNo: Number(payload.flatNo),
    });

    return res.status(201).json({ ok: true, data: created });
  } catch (e: any) {
    return res.status(500).json({ ok: false, message: e?.message ?? "Failed to create member" });
  }
}

export async function updateMemberHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const payload = req.body;

    const updated = await updateMember(id, {
      name: payload?.name !== undefined ? String(payload.name).trim() : undefined,
      fatherOrHusbandName:
        payload?.fatherOrHusbandName !== undefined
          ? payload.fatherOrHusbandName
            ? String(payload.fatherOrHusbandName).trim()
            : null
          : undefined,
      mobileNo:
        payload?.mobileNo !== undefined ? (payload.mobileNo ? String(payload.mobileNo).trim() : null) : undefined,
      blockNo: payload?.blockNo !== undefined ? Number(payload.blockNo) : undefined,
      floor:
        payload?.floor !== undefined ? (payload.floor ? String(payload.floor).trim().toUpperCase() : null) : undefined,
      flatNo: payload?.flatNo !== undefined ? Number(payload.flatNo) : undefined,
    });

    return res.json({ ok: true, data: updated });
  } catch (e: any) {
    return res.status(500).json({ ok: false, message: e?.message ?? "Failed to update member" });
  }
}

export async function deleteMemberHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await deleteMember(id);
    return res.json({ ok: true, message: "Deleted successfully" });
  } catch (e: any) {
    return res.status(500).json({ ok: false, message: e?.message ?? "Failed to delete member" });
  }
}

export async function importMembersExcelHandler(req: Request, res: Response) {
  try {
    const file = (req as any).file as Express.Multer.File | undefined;

    if (!file?.buffer) {
      return res.status(400).json({ ok: false, message: "Excel file missing (field name: file)" });
    }

    const result = await importMembersFromExcel(file.buffer);

    return res.json({
      ok: true,
      created: result.created,
      updated: result.updated,
      skipped: result.skipped,
      total: result.total,
    });
  } catch (e: any) {
    return res.status(500).json({ ok: false, message: e?.message ?? "Import failed" });
  }
}

export async function upsertRentalHandler(req: Request, res: Response) {
  try {
    const blockNo = Number(req.body?.blockNo);
    const flatNo = Number(req.body?.flatNo);
    const rentalName = String(req.body?.rentalName ?? "").trim();
    const rentalMobileNoRaw = req.body?.rentalMobileNo;

    const rentalMobileNo =
      rentalMobileNoRaw === undefined || rentalMobileNoRaw === null || String(rentalMobileNoRaw).trim() === ""
        ? null
        : String(rentalMobileNoRaw).trim();

    if (!blockNo || !flatNo) {
      return res.status(400).json({ ok: false, message: "blockNo and flatNo are required" });
    }
    if (!rentalName) {
      return res.status(400).json({ ok: false, message: "rentalName is required" });
    }

    // ✅ optional files (memoryStorage)
    const files = (req as any).files as Record<string, Express.Multer.File[]> | undefined;
    const rentAgreement = files?.rentAgreement?.[0];
    const policeVerification = files?.policeVerification?.[0];

    const data = await upsertRentalByFlat({
      blockNo,
      flatNo,
      rentalName,
      rentalMobileNo,
      rentAgreementBuffer: rentAgreement?.buffer,
      policeVerificationBuffer: policeVerification?.buffer,
      rentAgreementOriginalName: rentAgreement?.originalname,
      policeVerificationOriginalName: policeVerification?.originalname,
    } as any);

    return res.json({ ok: true, message: "Rental saved", data });
  } catch (e: any) {
    return res.status(400).json({ ok: false, message: e?.message ?? "Failed to save rental" });
  }
}

export async function clearRentalHandler(req: Request, res: Response) {
  try {
    const blockNo = Number(req.body?.blockNo);
    const flatNo = Number(req.body?.flatNo);

    if (!blockNo || !flatNo) {
      return res.status(400).json({ ok: false, message: "blockNo and flatNo are required" });
    }

    const data = await clearRentalByFlat({ blockNo, flatNo });
    return res.json({ ok: true, message: "Rental cleared", data });
  } catch (e: any) {
    return res.status(400).json({ ok: false, message: e?.message ?? "Failed to clear rental" });
  }
}