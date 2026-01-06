import { Router } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { getLedger, createBulk } from "./material-supplier-ledger.controller";

const router = Router();

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

router.get("/", getLedger);

router.post(
  "/bulk",
  upload.fields([
    { name: "unloadingFiles", maxCount: 50 },
    { name: "receiptFiles", maxCount: 50 },
  ]),
  createBulk
);

export default router;
