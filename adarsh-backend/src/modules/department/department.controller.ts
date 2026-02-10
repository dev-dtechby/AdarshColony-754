import { Request, Response } from "express";
import * as service from "./department.service";

/* ================================
   GET ALL ACTIVE DEPARTMENTS
================================ */
export const getDepartments = async (_req: Request, res: Response) => {
  try {
    const data = await service.getAllDepartments();

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Get Department Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch departments",
    });
  }
};

/* ================================
   GET ALL DELETED DEPARTMENTS
================================ */
export const getDeletedDepartments = async (_req: Request, res: Response) => {
  try {
    const data = await service.getDeletedDepartments();

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Get Deleted Department Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch deleted departments",
    });
  }
};

/* ================================
   CREATE DEPARTMENT
================================ */
export const createDepartment = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Department name is required",
      });
    }

    const department = await service.createDepartment(name.trim());

    res.status(201).json({
      success: true,
      data: department,
    });
  } catch (error: any) {
    console.error("Create Department Error:", error);

    res.status(400).json({
      success: false,
      message: error.message || "Department create failed",
    });
  }
};

/* ================================
   ✅ UPDATE DEPARTMENT
================================ */
export const updateDepartment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Department id is required",
      });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Department name is required",
      });
    }

    const updated = await service.updateDepartment(id, name.trim());

    res.status(200).json({
      success: true,
      data: updated,
      message: "Department updated successfully",
    });
  } catch (error: any) {
    console.error("Update Department Error:", error);

    res.status(400).json({
      success: false,
      message: error.message || "Department update failed",
    });
  }
};

/* ================================
   SOFT DELETE DEPARTMENT
   (Default Delete)
================================ */
export const deleteDepartment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await service.softDeleteDepartment(id);

    res.status(200).json({
      success: true,
      message: "Department moved to deleted records",
    });
  } catch (error) {
    console.error("Soft Delete Department Error:", error);

    res.status(500).json({
      success: false,
      message: "Department delete failed",
    });
  }
};

/* ================================
   RESTORE DEPARTMENT
================================ */
export const restoreDepartment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await service.restoreDepartment(id);

    res.status(200).json({
      success: true,
      message: "Department restored successfully",
    });
  } catch (error) {
    console.error("Restore Department Error:", error);

    res.status(500).json({
      success: false,
      message: "Department restore failed",
    });
  }
};

/* ================================
   HARD DELETE DEPARTMENT
   (Permanent – Admin Use)
================================ */
export const hardDeleteDepartment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await service.hardDeleteDepartment(id);

    res.status(200).json({
      success: true,
      message: "Department permanently deleted",
    });
  } catch (error) {
    console.error("Hard Delete Department Error:", error);

    res.status(500).json({
      success: false,
      message: "Permanent delete failed",
    });
  }
};
