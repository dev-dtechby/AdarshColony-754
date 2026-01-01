import { Router } from "express";
import {
  createSiteExpense,
  getAllSiteExpenses,
  getExpensesBySite,
  deleteSiteExpense,
  updateSiteExpense,
} from "./site-exp.controller";

const router = Router();

/**
 * =========================================================
 * SITE EXPENSE ROUTES
 * Base Path: /api/site-exp
 * =========================================================
 */

/**
 * @route   POST /api/site-exp
 * @desc    Create new site expense
 */
router.post("/", createSiteExpense);

/**
 * @route   GET /api/site-exp
 * @desc    Get all site expenses
 */
router.get("/", getAllSiteExpenses);

/**
 * @route   GET /api/site-exp/site/:siteId
 * @desc    Get expenses for a specific site
 */
router.get("/site/:siteId", getExpensesBySite);

/**
 * @route   PUT /api/site-exp/:id
 * @desc    Update a site expense (EDIT)
 */
router.put("/:id", updateSiteExpense);

/**
 * @route   DELETE /api/site-exp/:id
 * @desc    Soft delete a site expense
 */
router.delete("/:id", deleteSiteExpense);

export default router;
