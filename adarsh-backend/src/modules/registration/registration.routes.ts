import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { createRegistrationHandler } from "./registration.controller";

const router = Router();

// temp folder ensure
const tmpDir = path.join(process.cwd(), "tmp");
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, tmpDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || "");
      cb(null, `reg_${Date.now()}_${Math.random().toString(16).slice(2)}${ext}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

router.post("/", upload.single("photo"), createRegistrationHandler);

export default router;
