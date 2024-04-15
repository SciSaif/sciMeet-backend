import express from "express";

import protect from "../middlewares/protectMiddleware.js";
import {
    createBot,
    deleteBot,
    getBotTypes,
    updateBot,
} from "../controllers/botController.js";

const router = express.Router();

// @route   /bots
router.post("/", protect, createBot).put("/", protect, updateBot);

// @route /bots/:botId
router.delete("/:botId", protect, deleteBot);

// @route /bots/types
router.get("/types", protect, getBotTypes);

export default router;
