import { Request, Response } from "express";
import prisma from "../../lib/prisma";

/**
 * =========================================================
 * CREATE SITE EXPENSE
 * POST /api/site-exp
 * =========================================================
 */
export const createSiteExpense = async (req: Request, res: Response) => {
  try {
    const {
      siteId,
      expenseDate,
      expenseTitle,
      expenseSummary,
      paymentDetails,
      amount,
    } = req.body;

    /* ---------------- VALIDATION ---------------- */
    if (!siteId || !expenseDate || !amount) {
      return res.status(400).json({
        success: false,
        message: "siteId, expenseDate and amount are required",
      });
    }

    if (Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than zero",
      });
    }

    /* ---------------- CREATE ---------------- */
    const expense = await prisma.siteExpense.create({
      data: {
        siteId,
        expenseDate: new Date(expenseDate),
        expenseTitle: expenseTitle?.trim(),
        summary: expenseSummary?.trim(),
        paymentDetails: paymentDetails?.trim(),
        amount,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Site expense created successfully",
      data: expense,
    });
  } catch (error) {
    console.error("❌ Create Site Expense Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error while creating expense",
    });
  }
};

/**
 * =========================================================
 * GET ALL SITE EXPENSES
 * GET /api/site-exp
 * =========================================================
 */
export const getAllSiteExpenses = async (_req: Request, res: Response) => {
  try {
    const expenses = await prisma.siteExpense.findMany({
      orderBy: { expenseDate: "desc" },
      include: {
        site: {
          select: {
            id: true,
            siteName: true,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      count: expenses.length,
      data: expenses,
    });
  } catch (error) {
    console.error("❌ Get All Site Expenses Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch site expenses",
    });
  }
};

/**
 * =========================================================
 * GET EXPENSES BY SITE
 * GET /api/site-exp/site/:siteId
 * =========================================================
 */
export const getExpensesBySite = async (req: Request, res: Response) => {
  try {
    const { siteId } = req.params;

    if (!siteId) {
      return res.status(400).json({
        success: false,
        message: "Site ID is required",
      });
    }

    const expenses = await prisma.siteExpense.findMany({
      where: { siteId },
      orderBy: { expenseDate: "desc" },
    });

    return res.status(200).json({
      success: true,
      count: expenses.length,
      data: expenses,
    });
  } catch (error) {
    console.error("❌ Get Expenses By Site Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch site expenses",
    });
  }
};

/**
 * =========================================================
 * DELETE SITE EXPENSE
 * DELETE /api/site-exp/:id
 * =========================================================
 */
export const deleteSiteExpense = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Expense ID is required",
      });
    }

    await prisma.siteExpense.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: "Site expense deleted successfully",
    });
  } catch (error) {
    console.error("❌ Delete Site Expense Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete site expense",
    });
  }
};
