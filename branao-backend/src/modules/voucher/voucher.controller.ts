import { Request, Response } from "express";
import {
  createVoucher,
  getAllVouchers,
  getVoucherById,
  updateVoucher,
  deleteVoucher, // ✅ DELETE SERVICE
} from "./voucher.service";

/* =====================================================
   CREATE VOUCHER
   POST /api/vouchers
===================================================== */
export const createVoucherHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const voucher = await createVoucher(req.body);

    res.status(201).json({
      success: true,
      message: "Voucher created successfully",
      data: voucher,
    });
  } catch (error) {
    console.error("CREATE VOUCHER ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create voucher",
    });
  }
};

/* =====================================================
   GET ALL VOUCHERS (LIST PAGE)
   GET /api/vouchers
===================================================== */
export const getAllVouchersHandler = async (
  _req: Request,
  res: Response
) => {
  try {
    const vouchers = await getAllVouchers();

    res.status(200).json({
      success: true,
      data: vouchers,
    });
  } catch (error) {
    console.error("GET ALL VOUCHERS ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch vouchers",
    });
  }
};

/* =====================================================
   GET SINGLE VOUCHER (EDIT PAGE)
   GET /api/vouchers/:id
===================================================== */
export const getVoucherByIdHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    const voucher = await getVoucherById(id);

    if (!voucher) {
      return res.status(404).json({
        success: false,
        message: "Voucher not found",
      });
    }

    res.status(200).json({
      success: true,
      data: voucher,
    });
  } catch (error) {
    console.error("GET VOUCHER ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch voucher",
    });
  }
};

/* =====================================================
   UPDATE VOUCHER
   PUT /api/vouchers/:id
===================================================== */
export const updateVoucherHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    const voucher = await updateVoucher(id, req.body);

    res.status(200).json({
      success: true,
      message: "Voucher updated successfully",
      data: voucher,
    });
  } catch (error) {
    console.error("UPDATE VOUCHER ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update voucher",
    });
  }
};

/* =====================================================
   DELETE VOUCHER ✅ (FIX FOR 404)
   DELETE /api/vouchers/:id
===================================================== */
export const deleteVoucherHandler = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    await deleteVoucher(id);

    res.status(200).json({
      success: true,
      message: "Voucher deleted successfully",
    });
  } catch (error) {
    console.error("DELETE VOUCHER ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete voucher",
    });
  }
};
