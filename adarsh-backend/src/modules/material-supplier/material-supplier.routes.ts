import { Router } from "express";
import * as c from "./material-supplier.controller";

const router = Router();

// ACTIVE
router.get("/", c.getAllActive);

// DELETED
router.get("/deleted", c.getAllDeleted);

// CRUD
router.post("/", c.create);
router.put("/:id", c.update);

// DELETE / RESTORE
router.delete("/:id", c.softDelete);
router.post("/:id/restore", c.restore);
router.delete("/:id/hard", c.hardDelete);

export default router;
