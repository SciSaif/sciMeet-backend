import express from "express";

import protect from "../middlewares/protectMiddleware.js";
import { createGroup, deleteGroup } from "../controllers/groupController.js";

const router = express.Router();

// @route   /groups
router.post("/", protect, createGroup);

// @route /groups/:groupId
router.delete("/:groupId", protect, deleteGroup);

export default router;
