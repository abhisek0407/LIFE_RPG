import { Router } from "express";
import { decomposeTask, feelStuck } from "../controllers/aiController.js";

const router = Router();

router.post("/decompose", decomposeTask);
router.post("/feel-stuck", feelStuck);

export default router;