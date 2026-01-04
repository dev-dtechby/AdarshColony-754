import { Router } from "express";
import {
  getDepartments,
  getDeletedDepartments,
  createDepartment,
  deleteDepartment,
  restoreDepartment,
  hardDeleteDepartment,
  updateDepartment, // ✅ add
} from "./department.controller";

const router = Router();

/* ================================
   DEPARTMENT ROUTES (SOFT DELETE)
================================ */

// 🔹 GET ALL ACTIVE DEPARTMENTS
router.get("/", getDepartments);

// 🔹 GET DELETED DEPARTMENTS (RECYCLE BIN)
router.get("/deleted", getDeletedDepartments);

// 🔹 CREATE
router.post("/", createDepartment);

// ✅ UPDATE (EDIT)
router.put("/:id", updateDepartment);

// 🔹 SOFT DELETE (DEFAULT DELETE)
router.delete("/:id", deleteDepartment);

// 🔹 RESTORE DELETED DEPARTMENT
router.patch("/:id/restore", restoreDepartment);

// 🔹 HARD DELETE (PERMANENT – ADMIN USE)
router.delete("/:id/hard", hardDeleteDepartment);

export default router;
