import prisma from "../../lib/prisma"; // ✅ aapke project me prisma import path agar alag ho, adjust kar dena
import crypto from "crypto";
import { uploadToCloudinary } from "../../utils/cloudinary"; // ✅ existing util (aapke project me hai)
import { safeUnlink } from "../../utils/safeUnlink"; // ✅ existing util (aapke project me hai)

type CreateArgs = {
  body: any;
  file: Express.Multer.File | null;
  ip?: string;
};

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

function makeRegNo(blockNo: string, flatNo: string) {
  const rand = crypto.randomBytes(3).toString("hex").toUpperCase(); // 6 chars
  const stamp = Date.now().toString(36).toUpperCase();
  return `AC754-${String(blockNo).trim()}-${String(flatNo).trim()}-${stamp}-${rand}`;
}

export async function createRegistration({ body, file }: CreateArgs) {
  // ====== REQUIRED VALIDATION (PDF aligned) ======
  required(body?.date, "Date is required");
  required((body?.headFirstName || "").trim(), "First Name is required");
  required((body?.residentType || "").trim(), "Resident Type is required");
  required((body?.blockNo || "").trim(), "Block No. is required");
  required((body?.flatNo || "").trim(), "Flat No. is required");
  required((body?.gender || "").trim(), "Gender is required");
  required((body?.mobileNo || "").trim(), "Mobile No. is required");
  required(String(body?.agree) === "true" || body?.agree === true, "Terms agreement is required");

  const date = new Date(body.date);
  if (isNaN(date.getTime())) throw new Error("Invalid date");

  const headFirstName = String(body.headFirstName || "").trim();
  const headLastName = String(body.headLastName || "").trim();
  const headName = String(body.headName || `${headFirstName} ${headLastName}`.trim()).trim();

  const residentType = String(body.residentType || "").trim();
  const gender = String(body.gender || "").trim();

  const blockNo = String(body.blockNo || "").trim();
  const flatNo = String(body.flatNo || "").trim();

  const dob = toDateOrNull(body.dob);
  const bloodGroup = (body.bloodGroup || "").toString().trim() || null;

  const email = (body.email || "").toString().trim() || null;
  const profession = (body.profession || "").toString().trim() || null;

  const mobileNo = String(body.mobileNo || "").trim();
  const whatsappNo = (body.whatsappNo || "").toString().trim() || null;
  const totalMembers = toInt(body.totalMembers);

  const twoWheelerCount = toInt(body.twoWheelerCount);
  const fourWheelerCount = toInt(body.fourWheelerCount);

  const familyMembers = parseJsonField("familyMembers", body.familyMembers);
  const emergency = parseJsonField("emergency", body.emergency);
  const twoWheelers = parseJsonField("twoWheelers", body.twoWheelers);
  const fourWheelers = parseJsonField("fourWheelers", body.fourWheelers);

  // ====== PHOTO UPLOAD (optional) ======
  let photoUrl: string | null = null;
  try {
    if (file?.path) {
      const uploaded = await uploadToCloudinary(file.path, "adarsh754/registration");
      photoUrl = uploaded?.secure_url || uploaded?.url || null;
    }
  } finally {
    if (file?.path) await safeUnlink(file.path);
  }

  // ====== UNIQUE REGISTRATION NO (safe) ======
  let registrationNo = makeRegNo(blockNo, flatNo);

  // rare collision safe retry
  for (let i = 0; i < 3; i++) {
    const exists = await prisma.registration.findUnique({ where: { registrationNo } });
    if (!exists) break;
    registrationNo = makeRegNo(blockNo, flatNo);
  }

  const created = await prisma.registration.create({
    data: {
      registrationNo,
      date,

      headFirstName,
      headLastName: headLastName || null,
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

      familyMembers: familyMembers ?? null,
      emergency: emergency ?? null,

      twoWheelerCount,
      fourWheelerCount,
      twoWheelers: twoWheelers ?? null,
      fourWheelers: fourWheelers ?? null,

      agree: true,
    },
  });

  return created;
}
