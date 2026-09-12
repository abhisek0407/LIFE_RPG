import { Router } from "express";
import { createActivityLog } from "../controllers/activityLogController.js";

const router = Router();

router.post("/", createActivityLog);

export default router;
