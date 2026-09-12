import { Router } from "express";
import {
    getDailyQuests,
    createDailyQuest,
    completeDailyQuest,
    deleteDailyQuest,
} from "../controllers/dailyQuestController.js";

const router = Router();

router.get("/", getDailyQuests);
router.post("/", createDailyQuest);
router.patch("/:id/complete", completeDailyQuest);
router.delete("/:id", deleteDailyQuest);

export default router;