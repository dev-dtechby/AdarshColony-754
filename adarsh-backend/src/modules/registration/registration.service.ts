import prisma from "../../lib/prisma";
import { uploadToCloudinary } from "../../utils/cloudinary";
import { safeUnlink } from "../../utils/safeUnlink";
import type { Express } from "express";

type CreateArgs = {
  body: any;
  file: Express.Multer.File | null;
  ip?: string;
};

/* ================= HELPERS ================= */

function toInt(v: any): number | null {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function toDateOrNull(v: any): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function parseJsonField(name: string, v: any) {
  if (!v) return null;
  if (typeof v === "object") return v;
  if (typeof v !== "string") return null;
  try {
    return JSON.parse(v);
  } catch {
    throw new Error(`${name} is not valid JSON`);
  }
}

function required(cond: any, msg: string) {
  if (!cond) throw new Error(msg);
}

/* ================= REGISTRATION NO GENERATOR ================= */
/**
 * Format:
 * AC754-0001-6-18
 * AC754-0002-6-18
 */
async function generateRegistrationNo(blockNo: string, flatNo: string) {
  const prefix = "AC754";

  // Get latest registration
  const last = await prisma.registration.findFirst({
    orderBy: { createdAt: "desc" },
    select: { registrationNo: true },
  });

  let nextSerial = 1;

  if (last?.registrationNo) {
    // AC754-0007-6-18
    const parts = last.registrationNo.split("-");
    if (parts.length >= 2) {
      const parsed = parseInt(parts[1], 10);
      if (!isNaN(parsed)) {
        nextSerial = parsed + 1;
      }
    }
  }

  const serial4 = String(nextSerial).padStart(4, "0");
  return `${prefix}-${serial4}-${blockNo}-${flatNo}`;
}

/* ================= CREATE REGISTRATION ================= */

export async function createRegistration({ body, file }: CreateArgs) {
  /* ===== REQUIRED VALIDATION ===== */
  required(body?.date, "Date is required");
  required((body?.headFirstName || "").trim(), "First Name is required");
  required((body?.residentType || "").trim(), "Resident Type is required");
  required((body?.blockNo || "").trim(), "Block No. is required");
  required((body?.flatNo || "").trim(), "Flat No. is required");
  required((body?.gender || "").trim(), "Gender is required");
  required((body?.mobileNo || "").trim(), "Mobile No. is required");
  required(
    String(body?.agree) === "true" || body?.agree === true,
    "Terms agreement is required"
  );

  const date = new Date(body.date);
  if (isNaN(date.getTime())) throw new Error("Invalid date");

  /* ===== BASIC FIELDS ===== */
  const headFirstName = String(body.headFirstName).trim();
  const headLastName = String(body.headLastName || "").trim() || null;
  const headName =
    String(body.headName || `${headFirstName} ${headLastName || ""}`)
      .trim();

  const residentType = String(body.residentType).trim();
  const gender = String(body.gender).trim();

  const blockNo = String(body.blockNo).trim();
  const flatNo = String(body.flatNo).trim();

  const dob = toDateOrNull(body.dob);
  const bloodGroup = String(body.bloodGroup || "").trim() || null;

  const email = String(body.email || "").trim() || null;
  const profession = String(body.profession || "").trim() || null;

  const mobileNo = String(body.mobileNo).trim();
  const whatsappNo = String(body.whatsappNo || "").trim() || null;
  const totalMembers = toInt(body.totalMembers);

  const twoWheelerCount = toInt(body.twoWheelerCount);
  const fourWheelerCount = toInt(body.fourWheelerCount);

  const familyMembers = parseJsonField("familyMembers", body.familyMembers);
  const emergency = parseJsonField("emergency", body.emergency);
  const twoWheelers = parseJsonField("twoWheelers", body.twoWheelers);
  const fourWheelers = parseJsonField("fourWheelers", body.fourWheelers);

  /* ===== PHOTO UPLOAD ===== */
  let photoUrl: string | null = null;
  try {
    if (file?.path) {
      const uploaded = await uploadToCloudinary(
        file.path,
        "adarsh754/registration"
      );
      photoUrl = uploaded?.secure_url || uploaded?.url || null;
    }
  } finally {
    if (file?.path) await safeUnlink(file.path);
  }

  /* ===== REGISTRATION NO (SERIAL, NO DUPLICATE) ===== */
  let registrationNo = await generateRegistrationNo(blockNo, flatNo);

  // ultra-safe retry (race condition protection)
  for (let i = 0; i < 3; i++) {
    const exists = await prisma.registration.findUnique({
      where: { registrationNo },
    });
    if (!exists) break;
    registrationNo = await generateRegistrationNo(blockNo, flatNo);
  }

  /* ===== DB INSERT ===== */
  const created = await prisma.registration.create({
    data: {
      registrationNo,
      date,

      headFirstName,
      headLastName,
      headName,

      residentType,
      gender,

      blockNo,
      flatNo,

      dob,
      bloodGroup,
      email,
      profession,

      mobileNo,
      whatsappNo,
      totalMembers,

      photoUrl,

      familyMembers,
      emergency,

      twoWheelerCount,
      fourWheelerCount,
      twoWheelers,
      fourWheelers,

      agree: true,
    },
  });

  return created;
}
