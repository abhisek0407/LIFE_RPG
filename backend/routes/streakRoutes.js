import { Router } from "express";
import { getStreaks } from "../controllers/streakController.js";
import { checkInStreak } from "../controllers/activityLogController.js";

const router = Router();

router.get("/", getStreaks);
router.post("/checkin", checkInStreak);

export default router;