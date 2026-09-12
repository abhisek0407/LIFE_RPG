import { Router } from "express";
import {
    getQuests,
    getQuestById,
    createQuest,
    updateQuest,
    deleteQuest,
    completeMicrotask,
} from "../controllers/questController.js";

const router = Router();

router.get("/", getQuests);
router.get("/:id", getQuestById);
router.post("/", createQuest);
router.patch("/:id", updateQuest);
router.delete("/:id", deleteQuest);

// ── Microtask completion ──
router.patch("/:questId/microtasks/:microtaskId/complete", completeMicrotask);

export default router;