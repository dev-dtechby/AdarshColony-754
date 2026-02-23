import * as XLSX from "xlsx";
import prisma from "../../lib/prisma";
import { Prisma } from "@prisma/client";
import { uploadBufferToCloudinary, deleteFromCloudinary } from "../../utils/cloudinary";

/**
 * Registration No format:
 * AC754-0001-6-18
 * PREFIX-4digitSerial-Block-Flat
 */
const PREFIX = process.env.COLONY_PREFIX ?? "AC754";

function pad4(n: number) {
  return String(n).padStart(4, "0");
}

function normalizeMobile(v: any): string | null {
  const s = String(v ?? "").replace(/\D/g, "");
  return s ? s : null;
}

function normalizeStr(v: any): string {
  return String(v ?? "").trim();
}

function toInt(v: any): number {
  const n = Number(String(v ?? "").trim());
  return Number.isFinite(n) ? n : 0;
}

export type SortMode = "blockFlat" | "name";

function chunkArray<T>(arr: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/**
 * ✅ Normalize excel row keys: trim header names
 * (handles "Mobile No " or " Mobile No" etc.)
 */
function normalizeRowKeys(r: Record<string, any>) {
  return Object.fromEntries(Object.entries(r).map(([k, v]) => [String(k).trim(), v])) as Record<string, any>;
}

/**
 * ✅ Get mobile from multiple possible header names
 */
function getMobileFromRow(row: Record<string, any>) {
  return normalizeMobile(
    row["Mobile No"] ??
      row["Mobile No."] ??
      row["Mobile"] ??
      row["Mobile Number"] ??
      row["MobileNo"] ??
      row["Mobile Number."] ??
      row["मोबाइल"] ??
      row["मोबाइल नंबर"]
  );
}

function isTruthyQuery(v: any) {
  const s = String(v ?? "").trim().toLowerCase();
  return s === "1" || s === "true" || s === "yes" || s === "y";
}

// =====================
// LIST / SEARCH  ✅ rental columns + rentedOnly + insensitive
// =====================
export async function listMembers(opts: { block: string; q: string; sort: SortMode; rentedOnly?: boolean }) {
  const { block, q, sort } = opts;
  const rentedOnly = isTruthyQuery((opts as any).rentedOnly);

  const where: Prisma.ColonyMemberWhereInput = {};

  if (block && block !== "ALL") {
    const b = Number(block);
    if (Number.isFinite(b) && b > 0) where.blockNo = b;
  }

  // ✅ rentedOnly filter (DB-level)
  if (rentedOnly) {
    where.OR = [
      { rentalName: { not: null } },
      { rentalMobileNo: { not: null } },
      { rentAgreementUrl: { not: null } },
      { policeVerifyUrl: { not: null } },
    ];
  }

  // ✅ q search (case-insensitive) + includes rental fields also
  if (q) {
        const qOR: Prisma.ColonyMemberWhereInput[] = [
          { name: { contains: q } },
          { fatherOrHusbandName: { contains: q } },
          { mobileNo: { contains: q } },
          { memberCode: { contains: q } },
          { rentalName: { contains: q } },
          { rentalMobileNo: { contains: q } },
        ];

    // If already OR exists (rentedOnly), combine safely using AND
    if (where.OR) {
      where.AND = [{ OR: where.OR }, { OR: qOR }];
      delete (where as any).OR;
    } else {
      where.OR = qOR;
    }
  }

  const orderBy: Prisma.ColonyMemberOrderByWithRelationInput[] =
    sort === "name" ? [{ name: "asc" }] : [{ blockNo: "asc" }, { flatNo: "asc" }];

  // ✅ Select only required fields for UI + rental docs
  const rows = await prisma.colonyMember.findMany({
    where,
    orderBy,
    select: {
      id: true,
      serialNo: true,
      memberCode: true,
      name: true,
      fatherOrHusbandName: true,
      mobileNo: true,
      blockNo: true,
      floor: true,
      flatNo: true,

      rentalName: true,
      rentalMobileNo: true,
      rentAgreementUrl: true,
      rentAgreementPid: true,

      policeVerifyUrl: true,
      policeVerifyPid: true,

      registeredAt: true,
      createdAt: true,
      updatedAt: true,
    } as any,
  });

  // ✅ Frontend compatibility alias:
  // - UI में अक्सर "policeVerificationUrl" नाम रखा जाता है
  return rows.map((r: any) => ({
    ...r,
    policeVerificationUrl: r.policeVerifyUrl ?? null,
    policeVerificationPid: r.policeVerifyPid ?? null,
  }));
}

export async function getMemberById(id: string) {
  const r: any = await prisma.colonyMember.findUnique({ where: { id } });
  if (!r) return null;

  return {
    ...r,
    policeVerificationUrl: r.policeVerifyUrl ?? null,
    policeVerificationPid: r.policeVerifyPid ?? null,
  };
}

// =====================
// ✅ REGISTRATION NO ASSIGN (ONLY AFTER REGISTRATION)
// ✅ SERIAL NEVER REPEAT (requires RegistrationSerial table)
// =====================
export async function assignRegistrationNo(blockNo: number, flatNo: number) {
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      return await prisma.$transaction(async (tx) => {
        const existing = await tx.colonyMember.findUnique({
          where: { blockNo_flatNo: { blockNo, flatNo } },
        });

        if (!existing) {
          throw new Error("Member master record not found. Please import member list first.");
        }

        // Already registered
        if ((existing as any).memberCode) return existing;

        // ✅ Issue serial from separate table (never repeats even after deletes)
        // IMPORTANT: Add Prisma model "RegistrationSerial" (below in note)
        const issued = await (tx as any).registrationSerial.create({
          data: { prefix: PREFIX },
          select: { id: true },
        });

        const nextSerial = Number(issued.id);
        const memberCode = `${PREFIX}-${pad4(nextSerial)}-${blockNo}-${flatNo}`;

        return tx.colonyMember.update({
          where: { id: (existing as any).id },
          data: {
            serialNo: nextSerial,
            memberCode,
            registeredAt: new Date(),
          } as any,
        });
      });
    } catch (e: any) {
      // Unique conflict retry
      if (e?.code === "P2002" && attempt < 5) continue;
      throw e;
    }
  }

  throw new Error("Could not generate registration number. Please retry.");
}

// =====================
// CREATE / UPDATE / DELETE
// =====================

/**
 * ✅ Create master record WITHOUT generating registration number.
 * (Reg no will be assigned only on registration submit via assignRegistrationNo)
 */
export async function createMember(input: {
  name: string;
  fatherOrHusbandName: string | null;
  mobileNo: string | null;
  blockNo: number;
  floor: string | null;
  flatNo: number;
}) {
  if (!input.name) throw new Error("name is required");
  if (!input.blockNo || !input.flatNo) throw new Error("blockNo and flatNo are required");

  return prisma.$transaction(async (tx) => {
    const existing = await tx.colonyMember.findUnique({
      where: { blockNo_flatNo: { blockNo: input.blockNo, flatNo: input.flatNo } },
    });

    if (existing) {
      // ✅ Update master info only; DO NOT touch memberCode/serialNo
      return tx.colonyMember.update({
        where: { id: (existing as any).id },
        data: {
          name: input.name,
          fatherOrHusbandName: input.fatherOrHusbandName,
          mobileNo: input.mobileNo,
          floor: input.floor,
        } as any,
      });
    }

    // ✅ Create without serialNo/memberCode (Not Registered)
    return tx.colonyMember.create({
      data: {
        name: input.name,
        fatherOrHusbandName: input.fatherOrHusbandName,
        mobileNo: input.mobileNo,
        blockNo: input.blockNo,
        floor: input.floor,
        flatNo: input.flatNo,
      } as any,
    });
  });
}

export async function updateMember(
  id: string,
  input: Partial<{
    name: string;
    fatherOrHusbandName: string | null;
    mobileNo: string | null;
    blockNo: number;
    floor: string | null;
    flatNo: number;
  }>
) {
  return prisma.$transaction(async (tx) => {
    const existing: any = await tx.colonyMember.findUnique({ where: { id } });
    if (!existing) throw new Error("Member not found");

    const newBlock = input.blockNo ?? existing.blockNo;
    const newFlat = input.flatNo ?? existing.flatNo;

    const dataToUpdate: Prisma.ColonyMemberUpdateInput = {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.fatherOrHusbandName !== undefined ? { fatherOrHusbandName: input.fatherOrHusbandName } : {}),
      ...(input.mobileNo !== undefined ? { mobileNo: input.mobileNo } : {}),
      ...(input.blockNo !== undefined ? { blockNo: input.blockNo } : {}),
      ...(input.floor !== undefined ? { floor: input.floor } : {}),
      ...(input.flatNo !== undefined ? { flatNo: input.flatNo } : {}),
    };

    // ✅ If registered (serialNo exists), keep memberCode consistent on block/flat change.
    // ✅ If NOT registered (serialNo null), DO NOT generate memberCode here.
    if (existing.serialNo != null && (newBlock !== existing.blockNo || newFlat !== existing.flatNo)) {
      dataToUpdate.memberCode = `${PREFIX}-${pad4(existing.serialNo)}-${newBlock}-${newFlat}`;
    }

    return tx.colonyMember.update({ where: { id }, data: dataToUpdate });
  });
}

export async function deleteMember(id: string) {
  await prisma.colonyMember.delete({ where: { id } });
}

// =====================
// IMPORT (Excel) ✅ NO REGISTRATION NO GENERATION
// =====================

/**
 * Excel Import:
 * Master list only (no reg no):
 * Name | Father / Husband Name | Mobile No | Block | Floor | Flat
 */
export async function importMembersFromExcel(
  fileBuffer: Buffer
): Promise<{
  total: number;
  created: number;
  updated: number;
  skipped: number;
}> {
  const wb = XLSX.read(fileBuffer, { type: "buffer" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: "" });

  const total = rawRows.length;
  let created = 0;
  let updated = 0;
  let skipped = 0;

  const rows: Array<{
    name: string;
    fatherOrHusbandName: string | null;
    mobileNo: string | null;
    blockNo: number;
    floor: string | null;
    flatNo: number;
  }> = [];

  for (const r0 of rawRows) {
    const r = normalizeRowKeys(r0);

    const name = normalizeStr(r["Name"]);
    const fh = normalizeStr(r["Father / Husband Name"]);
    const mobile = getMobileFromRow(r);
    const blockNo = toInt(r["Block"]);
    const floor = normalizeStr(r["Floor"]).toUpperCase();
    const flatNo = toInt(r["Flat"]);

    if (!name || !blockNo || !flatNo) {
      skipped++;
      continue;
    }

    rows.push({
      name,
      fatherOrHusbandName: fh ? fh : null,
      mobileNo: mobile,
      blockNo,
      floor: floor ? floor : null,
      flatNo,
    });
  }

  if (!rows.length) return { total, created, updated, skipped };

  // Fetch existing members for involved blocks only
  const blocks = Array.from(new Set(rows.map((r) => r.blockNo))).sort((a, b) => a - b);

  const existing = await prisma.colonyMember.findMany({
    where: { blockNo: { in: blocks } },
    select: { id: true, blockNo: true, flatNo: true },
  });

  const existingMap = new Map<string, { id: string }>();
  for (const e of existing as any[]) existingMap.set(`${e.blockNo}-${e.flatNo}`, { id: e.id });

  const createData: Prisma.ColonyMemberCreateManyInput[] = [];
  const updateData: Array<{ id: string; data: Prisma.ColonyMemberUpdateInput }> = [];
  const seenKeys = new Set<string>();

  for (const r of rows) {
    const key = `${r.blockNo}-${r.flatNo}`;
    if (seenKeys.has(key)) {
      skipped++;
      continue;
    }
    seenKeys.add(key);

    const ex = existingMap.get(key);

    if (ex) {
      // ✅ Update master info only (do NOT touch serialNo/memberCode)
      updateData.push({
        id: ex.id,
        data: {
          name: r.name,
          fatherOrHusbandName: r.fatherOrHusbandName,
          mobileNo: r.mobileNo,
          floor: r.floor,
        },
      });
    } else {
      // ✅ Create master record WITHOUT registration number
      createData.push({
        name: r.name,
        fatherOrHusbandName: r.fatherOrHusbandName,
        mobileNo: r.mobileNo,
        blockNo: r.blockNo,
        floor: r.floor,
        flatNo: r.flatNo,
      } as any);
    }
  }

  for (const chunk of chunkArray(createData, 300)) {
    const res = await prisma.colonyMember.createMany({
      data: chunk,
      skipDuplicates: true,
    });
    created += res.count;
  }

  for (const chunk of chunkArray(updateData, 50)) {
    await prisma.$transaction(
      chunk.map((u) =>
        prisma.colonyMember.update({
          where: { id: u.id },
          data: u.data,
        })
      )
    );
    updated += chunk.length;
  }

  return { total, created, updated, skipped };
}

// =====================
// RENTAL (tenant + docs) ✅ Cloudinary (memory buffer)
// =====================

export async function upsertRentalByFlat(input: {
  blockNo: number;
  flatNo: number;
  rentalName: string;
  rentalMobileNo: string | null;

  // optional docs (multer memoryStorage)
  rentAgreementBuffer?: Buffer;
  policeVerificationBuffer?: Buffer;
  rentAgreementOriginalName?: string;
  policeVerificationOriginalName?: string;
}) {
  const { blockNo, flatNo } = input;
  const rentalName = (input.rentalName || "").trim();
  const rentalMobileNo = input.rentalMobileNo ? String(input.rentalMobileNo).trim() : null;

  if (!blockNo || !flatNo) throw new Error("blockNo and flatNo are required");
  if (!rentalName) throw new Error("rentalName is required");

  const existing: any = await prisma.colonyMember.findUnique({
    where: { blockNo_flatNo: { blockNo, flatNo } },
  });

  if (!existing) throw new Error("Owner/master record not found. Please import member list first.");

  // Existing doc fields
  let rentAgreementUrl = existing.rentAgreementUrl ?? null;
  let rentAgreementPid = existing.rentAgreementPid ?? null;

  let policeVerifyUrl = existing.policeVerifyUrl ?? null;
  let policeVerifyPid = existing.policeVerifyPid ?? null;

  const folder = `adarshapp/rentals/block-${blockNo}/flat-${flatNo}`;

  // Rent Agreement upload
  if (input.rentAgreementBuffer) {
    if (rentAgreementPid) await deleteFromCloudinary(rentAgreementPid);
    const up = await uploadBufferToCloudinary(input.rentAgreementBuffer, folder);
    rentAgreementUrl = up.secure_url;
    rentAgreementPid = up.public_id;
  }

  // Police verification upload
  if (input.policeVerificationBuffer) {
    if (policeVerifyPid) await deleteFromCloudinary(policeVerifyPid);
    const up = await uploadBufferToCloudinary(input.policeVerificationBuffer, folder);
    policeVerifyUrl = up.secure_url;
    policeVerifyPid = up.public_id;
  }

  const updated: any = await prisma.colonyMember.update({
    where: { id: existing.id },
    data: {
      rentalName,
      rentalMobileNo,
      rentAgreementUrl,
      rentAgreementPid,
      policeVerifyUrl,
      policeVerifyPid,
    } as any,
  });

  // Alias for frontend
  return {
    ...updated,
    policeVerificationUrl: updated.policeVerifyUrl ?? null,
    policeVerificationPid: updated.policeVerifyPid ?? null,
  };
}

export async function clearRentalByFlat(input: { blockNo: number; flatNo: number }) {
  const { blockNo, flatNo } = input;
  if (!blockNo || !flatNo) throw new Error("blockNo and flatNo are required");

  const existing: any = await prisma.colonyMember.findUnique({
    where: { blockNo_flatNo: { blockNo, flatNo } },
  });

  if (!existing) throw new Error("Owner/master record not found.");

  const rentAgreementPid = existing.rentAgreementPid as string | null;
  const policeVerifyPid = existing.policeVerifyPid as string | null;

  if (rentAgreementPid) await deleteFromCloudinary(rentAgreementPid);
  if (policeVerifyPid) await deleteFromCloudinary(policeVerifyPid);

  const updated: any = await prisma.colonyMember.update({
    where: { id: existing.id },
    data: {
      rentalName: null,
      rentalMobileNo: null,
      rentAgreementUrl: null,
      rentAgreementPid: null,
      policeVerifyUrl: null,
      policeVerifyPid: null,
    } as any,
  });

  return {
    ...updated,
    policeVerificationUrl: updated.policeVerifyUrl ?? null,
    policeVerificationPid: updated.policeVerifyPid ?? null,
  };
}