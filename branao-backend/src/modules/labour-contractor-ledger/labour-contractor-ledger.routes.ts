import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import * as c from "./labour-contractor-ledger.controller";

const router = Router();

/* =========================
   multer (agreement upload)
========================= */

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const safeName = (name: string) =>
  String(name || "file")
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9._-]/g, "");

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}_${safeName(file.originalname)}`),
});

// allow basic docs + images + pdf
const allowed = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
  fileFilter: (_req, file, cb) => {
    if (!file?.mimetype) return cb(null, false);
    if (allowed.has(file.mimetype)) return cb(null, true);
    return cb(new Error("Invalid file type. Only PDF / Images / DOC/DOCX allowed."));
  },
});

/* =========================================================
   CONTRACTOR (MASTER)
========================================================= */
router.get("/contractors", c.listContractors);
router.post("/contractors", c.createContractor);
router.put("/contractors/:id", c.updateContractor);
router.delete("/contractors/:id", c.deleteContractorHard); // HARD DELETE

/* =========================================================
   CONTRACTS (SITE DEALS + AGREEMENT)
========================================================= */
router.get("/contracts", c.listContracts); // ?contractorId=&siteId=
router.post("/contracts", upload.single("agreement"), c.createContract);
router.put("/contracts/:id", upload.single("agreement"), c.updateContract);
router.delete("/contracts/:id", c.deleteContractHard);

/* =========================================================
   PAYMENTS (WEEKLY)
========================================================= */
router.get("/payments", c.listPayments); // ?contractorId=&siteId=&from=&to=
router.post("/payments", c.createPayment);
router.put("/payments/:id", c.updatePayment);
router.delete("/payments/:id", c.deletePaymentHard);

/* =========================================================
   LEDGER SUMMARY (contract + paid + balance)
========================================================= */
router.get("/ledger/:contractorId", c.getContractorLedger); // ?siteId=

export default router;
