import express from "express";
import {
  getMaterialMaster,
  getDeletedMaterialMaster,
  createMaterialMaster,
  updateMaterialMaster,
  deleteMaterialMaster,
  restoreMaterialMaster,
  hardDeleteMaterialMaster,
} from "./material-master.controller";

const router = express.Router();

// ✅ list
router.get("/", getMaterialMaster);
router.get("/deleted", getDeletedMaterialMaster);

// ✅ create / update
router.post("/", createMaterialMaster);
router.put("/:id", updateMaterialMaster);

// ✅ delete / restore
router.delete("/:id", deleteMaterialMaster); // soft delete
router.post("/:id/restore", restoreMaterialMaster); // restore
router.delete("/:id/hard", hardDeleteMaterialMaster); // hard delete

export default router;
