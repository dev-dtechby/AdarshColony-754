import express from "express";
import {
  getLedgerTypes,
  createLedgerType,
  deleteLedgerType,
} from "./ledger-type.controller";

const router = express.Router();

router.get("/", getLedgerTypes);
router.post("/", createLedgerType);
router.delete("/:id", deleteLedgerType);

export default router;
