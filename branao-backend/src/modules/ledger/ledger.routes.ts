import express from "express";
import {
  createLedger,
  getLedgers,
  deleteLedger,
} from "./ledger.controller";

const router = express.Router();

router.get("/", getLedgers);
router.post("/", createLedger);
router.delete("/:id", deleteLedger);

export default router;
