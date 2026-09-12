import { Router } from "express";
import { getStreaks } from "../controllers/streakController.js";

const router = Router();

router.get("/", getStreaks);

export default router;