import { Router } from "express";
import { getAll } from "./site-profit.controller";

const router = Router();
router.get("/", getAll);

export default router;
