import { Router } from "express";
import multer from "multer";
import {
  getMembersHandler,
  getMemberByIdHandler,
  createMemberHandler,
  updateMemberHandler,
  deleteMemberHandler,
  importMembersExcelHandler,
  upsertRentalHandler,
  clearRentalHandler,
} from "./member.controller";

const router = Router();

/**
 * ✅ Using memoryStorage
 * - Excel import: field name "file"
 * - Rental docs: fields "rentAgreement" and "policeVerification"
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
});

// =====================
// ROUTES
// =====================

// List/Search/Sort
router.get("/", getMembersHandler);

// Excel Import (keep ABOVE "/:id")
router.post("/import", upload.single("file"), importMembersExcelHandler);

// ✅ Rental routes MUST be ABOVE "/:id" (otherwise "rental" becomes :id)
router.put(
  "/rental",
  upload.fields([
    { name: "rentAgreement", maxCount: 1 },
    { name: "policeVerification", maxCount: 1 },
  ]),
  upsertRentalHandler
);

router.put("/rental-clear", clearRentalHandler);

// CRUD (keep LAST)
router.get("/:id", getMemberByIdHandler);
router.post("/", createMemberHandler);
router.put("/:id", updateMemberHandler);
router.delete("/:id", deleteMemberHandler);

export default router;