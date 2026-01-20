import { Router } from "express";
import multer from "multer";
import path from "path";
import {
  createVehicle,
  updateVehicle,
  deleteVehicle,
  listVehicles,
  uploadAgreement,
  createLog,
  updateLog,
  deleteLog,
  listLogs,
  ownerSummary,
} from "./vehicle-rent.controller";

const router = Router();

// disk storage (Cloudinary upload service handles unlink)
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(process.cwd(), "uploads")),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

// Vehicles (master)
router.get("/vehicles", listVehicles); // ?ownerLedgerId=
router.post("/vehicles", createVehicle);
router.put("/vehicles/:id", updateVehicle);
router.delete("/vehicles/:id", deleteVehicle);

// Agreement upload
router.post("/vehicles/:id/agreement", upload.single("file"), uploadAgreement);

// Logs (logbook)
router.get("/logs", listLogs); 
// ?ownerLedgerId=&vehicleId=&siteId=&from=&to=
router.post("/logs", createLog);
router.put("/logs/:id", updateLog);
router.delete("/logs/:id", deleteLog);

// Owner ledger summary (totals + vehicles + sites)
router.get("/owner-summary", ownerSummary); 
// ?ownerLedgerId=&siteId=ALL or siteId

export default router;
