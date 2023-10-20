import express from "express";

import protect from "../middlewares/protectMiddleware.js";
import { createGroup } from "../controllers/groupController.js";

const router = express.Router();

// @route   POST /groups
router.post("/", protect, createGroup);

export default router;
