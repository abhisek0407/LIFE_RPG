import { Router } from "express";
import { decomposeTask, voiceDecomposeTask, feelStuck } from "../controllers/aiController.js";

const router = Router();

router.post("/decompose", decomposeTask);
router.post("/voice-decompose", voiceDecomposeTask);
router.post("/feel-stuck", feelStuck);

export default router;