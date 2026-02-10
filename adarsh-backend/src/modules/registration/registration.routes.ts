import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  createRegistrationHandler,
  getAllRegistrationsHandler,
  deleteRegistrationHandler,
} from "./registration.controller";

const router = Router();

/* ================= TEMP UPLOAD FOLDER ================= */
const tmpDir = path.join(process.cwd(), "tmp");
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true });
}

/* ================= MULTER CONFIG ================= */
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, tmpDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || "");
      cb(
        null,
        `reg_${Date.now()}_${Math.random()
          .toString(16)
          .slice(2)}${ext}`
      );
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
});

/* ================= ROUTES ================= */

/**
 * Create Registration
 * POST /api/registration
 */
router.post("/", upload.single("photo"), createRegistrationHandler);

/**
 * Get All Registrations (List)
 * GET /api/registration
 */
router.get("/", getAllRegistrationsHandler);

/**
 * Delete Registration
 * DELETE /api/registration/:id
 */
router.delete("/:id", deleteRegistrationHandler);

export default router;
