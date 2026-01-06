import fs from "fs";
import prisma from "../../lib/prisma";
import { v2 as cloudinary } from "cloudinary";

/* =========================
   Cloudinary Config
   (env variables must exist in Railway/Local)
========================= */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
  api_key: process.env.CLOUDINARY_API_KEY || "",
  api_secret: process.env.CLOUDINARY_API_SECRET || "",
});

function toOptionalDecimal(v: any) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return n;
}

function toRequiredDecimal(v: any, fallback = 0) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return n;
}

async function safeUnlink(filePath?: string) {
  if (!filePath) return;
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch {
    // ignore
  }
}

async function uploadToCloudinary(file: Express.Multer.File, folder: string) {
  if (!file?.path) throw new Error("file path missing for upload");
  const res = await cloudinary.uploader.upload(file.path, {
    folder,
    resource_type: "image",
  });
  return res.secure_url; // ✅ this is what we store in DB
}

/* =========================
   GET Ledger
========================= */
export const getLedger = async (ledgerId: string, siteId?: string | null) => {
  return prisma.materialSupplierLedger.findMany({
    where: {
      ledgerId,
      ...(siteId ? { siteId } : {}),
    },
    orderBy: { entryDate: "desc" },
  });
};

/* =========================
   BULK CREATE
========================= */
export const createBulk = async (args: {
  entryDate: string;
  ledgerId: string;
  siteId: string | null;
  rows: any[];
  unloadingFiles: Express.Multer.File[];
  receiptFiles: Express.Multer.File[];
}) => {
  const { entryDate, ledgerId, siteId, rows, unloadingFiles, receiptFiles } = args;

  const dt = new Date(entryDate);
  if (isNaN(dt.getTime())) throw new Error("Invalid entryDate");

  if (!Array.isArray(rows) || rows.length === 0) throw new Error("rows required");
  if (!ledgerId) throw new Error("ledgerId required");

  if (unloadingFiles.length !== rows.length || receiptFiles.length !== rows.length) {
    throw new Error("Files count must match rows count");
  }

  // ✅ Upload all files first -> collect URLs -> then DB transaction
  const uploadedVehicleUrls: string[] = [];
  const uploadedReceiptUrls: string[] = [];

  try {
    for (let i = 0; i < rows.length; i++) {
      const vFile = unloadingFiles[i];
      const rFile = receiptFiles[i];

      const vehicleUrl = await uploadToCloudinary(vFile, "material-ledger/vehicle");
      const receiptUrl = await uploadToCloudinary(rFile, "material-ledger/receipt");

      uploadedVehicleUrls.push(vehicleUrl);
      uploadedReceiptUrls.push(receiptUrl);

      // ✅ remove local temp files after upload
      await safeUnlink(vFile?.path);
      await safeUnlink(rFile?.path);
    }

    // ✅ Now save to DB in a single transaction
    const created = await prisma.$transaction(async (tx) => {
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];

        // UI me rate nahi hai => default 0 (UI unchanged)
        const rate = toRequiredDecimal(r?.rate, 0);

        await tx.materialSupplierLedger.create({
          data: {
            entryDate: dt,
            receiptNo: r?.receiptNo ? String(r.receiptNo) : null,
            parchiPhoto: uploadedReceiptUrls[i],     // ✅ Cloudinary URL
            otp: r?.otp ? String(r.otp) : null,
            vehicleNo: r?.vehicleNo ? String(r.vehicleNo) : null,
            vehiclePhoto: uploadedVehicleUrls[i],    // ✅ Cloudinary URL

            material: String(r?.material || "").trim(),
            size: r?.size ? String(r.size) : null,
            qty: toRequiredDecimal(r?.qty, 0),        // Decimal(12,3)
            rate: rate,                               // Decimal(12,2)

            royaltyQty: toOptionalDecimal(r?.royaltyQty),
            royaltyRate: toOptionalDecimal(r?.royaltyRate),
            royaltyAmt: toOptionalDecimal(r?.royaltyAmt),

            gstPercent: toOptionalDecimal(r?.gstPercent),
            taxAmt: toOptionalDecimal(r?.taxAmt),
            totalAmt: toOptionalDecimal(r?.totalAmt),

            paymentAmt: toOptionalDecimal(r?.paymentAmt),
            balanceAmt: toOptionalDecimal(r?.balanceAmt),

            remarks: r?.remarks ? String(r.remarks) : null,

            ledgerId,
            siteId: siteId || null,
          },
        });
      }

      return { count: rows.length };
    });

    return created;
  } catch (e) {
    // ✅ if error occurs, still remove temp files
    for (const f of unloadingFiles) await safeUnlink(f?.path);
    for (const f of receiptFiles) await safeUnlink(f?.path);
    throw e;
  }
};
