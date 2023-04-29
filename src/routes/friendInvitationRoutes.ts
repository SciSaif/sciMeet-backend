import express from "express";
import {
    acceptInvitation,
    postInvite,
    rejectInvitation,
} from "../controllers/friendInvitationController.js";
import protect from "../middlewares/protectMiddleware.js";

const router = express.Router();

// @route   POST /friend-invitation/invite
router.post("/invite", protect, postInvite);

// @route POST /friend-invitation/accept
router.post("/accept", protect, acceptInvitation);

// @route POST /friend-invitation/reject
router.post("/reject", protect, rejectInvitation);

export default router;
