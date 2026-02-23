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

type SortType = "blockFlat" | "name";

function toInt(val: any): number | null {
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}

function toStr(val: any): string {
  return val === null || val === undefined ? "" : String(val);
}

function isTruthyQuery(val: any) {
  const s = String(val ?? "").trim().toLowerCase();
  return s === "1" || s === "true" || s === "yes" || s === "y";
}

function isRentedRow(m: any) {
  return (
    m?.residentType === "TENANT" ||
    !!toStr(m?.rentalName).trim() ||
    !!toStr(m?.rentalMobileNo).trim() ||
    !!toStr(m?.rentAgreementUrl).trim() ||
    !!toStr(m?.policeVerificationUrl).trim()
  );
}

function globalSearchHit(m: any, termLower: string) {
  const hay = [
    m?.serialNo,
    m?.memberCode,
    m?.name,
    m?.fatherOrHusbandName,
    m?.mobileNo,
    m?.blockNo,
    m?.floor,
    m?.flatNo,

    // rental columns
    m?.rentalName,
    m?.rentalMobileNo,
    m?.rentAgreementUrl ? "rentagreement" : "",
    m?.policeVerificationUrl ? "policeverification" : "",
  ]
    .map(toStr)
    .join(" ")
    .toLowerCase();

  return hay.includes(termLower);
}

export async function getMembersHandler(req: Request, res: Response) {
  try {
    const block = (req.query.block as string) ?? "ALL";
    const q = ((req.query.q as string) ?? "").trim();

    const sortRaw = ((req.query.sort as string) ?? "blockFlat").trim();
    const sort: SortType = sortRaw === "name" ? "name" : "blockFlat";

    // ✅ rented flag supported: ?rented=1 OR /rented route injects it
    const rentedOnly = isTruthyQuery((req.query as any).rented);

    // Fetch from service (keep compatibility)
    let data: any[] = await listMembers({ block, q, sort } as any);

    // Safety: block filter (if service returns broader)
    if (block && block !== "ALL") {
      const b = Number(block);
      if (Number.isFinite(b)) data = data.filter((m) => Number(m?.blockNo) === b);
    }

    // ✅ rented-only filter
    if (rentedOnly) {
      data = data.filter(isRentedRow);
    }

    // ✅ global search across all columns (including rental columns)
    if (q) {
      const termLower = q.toLowerCase();
      data = data.filter((m) => globalSearchHit(m, termLower));
    }

    // ✅ sort safety (if needed)
    data.sort((a, b) => {
      if (sort === "name") return toStr(a?.name).localeCompare(toStr(b?.name));
      const ab = Number(a?.blockNo) - Number(b?.blockNo);
      if (ab !== 0) return ab;
      return Number(a?.flatNo) - Number(b?.flatNo);
    });

    return res.json({ ok: true, data });
  } catch (e: any) {
    return res
      .status(500)
      .json({ ok: false, message: e?.message ?? "Failed to fetch members" });
  }
}

export async function getMemberByIdHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data = await getMemberById(id);

    if (!data) return res.status(404).json({ ok: false, message: "Member not found" });
    return res.json({ ok: true, data });
  } catch (e: any) {
    return res
      .status(500)
      .json({ ok: false, message: e?.message ?? "Failed to fetch member" });
  }
}

export async function createMemberHandler(req: Request, res: Response) {
  try {
    const payload = req.body;

    if (!payload?.name) {
      return res.status(400).json({ ok: false, message: "name is required" });
    }

    const blockNo = toInt(payload?.blockNo);
    const flatNo = toInt(payload?.flatNo);
    if (!blockNo || !flatNo) {
      return res.status(400).json({ ok: false, message: "blockNo and flatNo are required" });
    }

    const created = await createMember({
      name: String(payload.name).trim(),
      fatherOrHusbandName: payload.fatherOrHusbandName
        ? String(payload.fatherOrHusbandName).trim()
        : null,
      mobileNo: payload.mobileNo ? String(payload.mobileNo).trim() : null,
      blockNo: blockNo,
      floor: payload.floor ? String(payload.floor).trim().toUpperCase() : null,
      flatNo: flatNo,
    });

    return res.status(201).json({ ok: true, data: created });
  } catch (e: any) {
    return res
      .status(500)
      .json({ ok: false, message: e?.message ?? "Failed to create member" });
  }
}

export async function updateMemberHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const payload = req.body;

    // IMPORTANT: registration fields (serialNo/memberCode) update मत करना
    const updated = await updateMember(id, {
      name: payload?.name !== undefined ? String(payload.name).trim() : undefined,
      fatherOrHusbandName:
        payload?.fatherOrHusbandName !== undefined
          ? payload.fatherOrHusbandName
            ? String(payload.fatherOrHusbandName).trim()
            : null
          : undefined,
      mobileNo:
        payload?.mobileNo !== undefined
          ? payload.mobileNo
            ? String(payload.mobileNo).trim()
            : null
          : undefined,
      blockNo: payload?.blockNo !== undefined ? Number(payload.blockNo) : undefined,
      floor:
        payload?.floor !== undefined
          ? payload.floor
            ? String(payload.floor).trim().toUpperCase()
            : null
          : undefined,
      flatNo: payload?.flatNo !== undefined ? Number(payload.flatNo) : undefined,
    });

    return res.json({ ok: true, data: updated });
  } catch (e: any) {
    return res
      .status(500)
      .json({ ok: false, message: e?.message ?? "Failed to update member" });
  }
}

export async function deleteMemberHandler(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await deleteMember(id);
    return res.json({ ok: true, message: "Deleted successfully" });
  } catch (e: any) {
    return res
      .status(500)
      .json({ ok: false, message: e?.message ?? "Failed to delete member" });
  }
}

export async function importMembersExcelHandler(req: Request, res: Response) {
  try {
    const file = (req as any).file as Express.Multer.File | undefined;

    if (!file?.buffer) {
      return res
        .status(400)
        .json({ ok: false, message: "Excel file missing (field name: file)" });
    }

    // IMPORTANT: import MUST NOT generate registration no
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
      rentalMobileNoRaw === undefined ||
      rentalMobileNoRaw === null ||
      String(rentalMobileNoRaw).trim() === ""
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