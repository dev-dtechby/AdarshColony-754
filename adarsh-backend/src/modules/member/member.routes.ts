import { Router, type RequestHandler } from "express";
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
// HELPERS (route-level)
// =====================

// ✅ Rented-only list: we reuse getMembersHandler by injecting a query flag
const rentedOnly: RequestHandler = (req, _res, next) => {
  // controller/service should read this flag to filter rented records
  // e.g. req.query.rented === "1"
  (req.query as any).rented = "1";
  next();
};

// =====================
// ROUTES
// =====================

// ✅ List/Search/Sort (Example query: ?block=ALL|6&sort=blockFlat|name&q=...&rented=1)
router.get("/", getMembersHandler);

// ✅ Rented list (separate endpoint)
router.get("/rented", rentedOnly, getMembersHandler);

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