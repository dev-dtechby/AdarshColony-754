import express from "express";
import {
  createVoucherHandler,
  getVoucherByIdHandler,
  updateVoucherHandler,
  getAllVouchersHandler,
  deleteVoucherHandler, // ✅ ADD THIS
} from "./voucher.controller";

const router = express.Router();

/* ===============================
   CREATE
   POST /api/vouchers
================================ */
router.post("/", createVoucherHandler);

/* ===============================
   READ (ALL)
   GET /api/vouchers
================================ */
router.get("/", getAllVouchersHandler);

/* ===============================
   READ (SINGLE)
   GET /api/vouchers/:id
================================ */
router.get("/:id", getVoucherByIdHandler);

/* ===============================
   UPDATE
   PUT /api/vouchers/:id
================================ */
router.put("/:id", updateVoucherHandler);

/* ===============================
   DELETE ✅ (FIX FOR 404)
   DELETE /api/vouchers/:id
================================ */
router.delete("/:id", deleteVoucherHandler);

export default router;
