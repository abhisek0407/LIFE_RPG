import { Router } from "express";
import {
    getStoreItems,
    getInventory,
    buyItem,
    useItem,
} from "../controllers/storeController.js";

const router = Router();

router.get("/items", getStoreItems);
router.get("/inventory", getInventory);
router.post("/buy", buyItem);
router.post("/use/:itemId", useItem);

export default router;