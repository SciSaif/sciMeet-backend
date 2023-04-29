import { z } from "zod";
import asyncRequestHandler from "../utils/asyncRequestHandler.js";
import User from "../models/userModal.js";
import FriendInvitation from "../models/friendInvitationModal.js";
import {
    updateFriends,
    updateFriendsPendingInvitations,
} from "../socketHandlers/updates/friends.js";

// @DESC post invite
// @ROUTE POST /friend-invitation/invite
// @ACCESS Private
export const postInvite = asyncRequestHandler(
    z.object({
        email: z.string().email(),
    }),
    async (req, res) => {
        const { email: targetEmailAddress } = req.body;
        const user = req.user;

        // check if friend that we would like to invite is not current user
        if (
            user.email.toLocaleLowerCase() ===
            targetEmailAddress.toLocaleLowerCase()
        ) {
            res.status(400);
            throw new Error("You can't invite yourself");
        }

        const targetUser = await User.findOne({
            email: targetEmailAddress.toLocaleLowerCase(),
        });

        if (!targetUser) {
            res.status(400);
            throw new Error("User with this email does not exist");
        }

        // check if invitation has been already sent
        const invitation = await FriendInvitation.findOne({
            senderId: user._id,
            receiverId: targetUser._id,
        });

        if (invitation) {
            res.status(409);
            throw new Error("Invitation has been already sent");
        }

        // check if the user which we would like to invite is already our friend
        const isAlreadyFriend = targetUser.friends.find(
            (friendId) => friendId.toString() === user._id.toString()
        );

        if (isAlreadyFriend) {
            res.status(409);
            throw new Error("User is already your friend");
        }

        // create new invitation in database
        const newInvitation = await FriendInvitation.create({
            senderId: user._id,
            receiverId: targetUser._id,
        });

        // if invitation has been created successfully, update friends invitations if other user is online
        if (newInvitation) {
            // send pending invitations to all active connections of target user
            updateFriendsPendingInvitations(targetUser._id.toString());
        }

        return res.status(201).send({ toast: "Invitation has been sent" });
    }
);

// @DESC post accept
// @ROUTE POST /friend-invitation/accept
// @ACCESS Private
export const acceptInvitation = asyncRequestHandler(
    z.object({
        _id: z.string(),
    }),
    async (req, res) => {
        const { _id } = req.body;
        const user = req.user;

        // check if invitation exists
        const invitation = await FriendInvitation.findById(_id);

        if (!invitation) {
            res.status(401);
            throw new Error("Error occured. Please try again");
        }

        const { senderId, receiverId } = invitation;

        // add friends to both users
        const senderUser = await User.findById(senderId);
        const receiverUser = await User.findById(receiverId);

        if (!senderUser || !receiverUser) {
            res.status(401);
            throw new Error("Error occured. Please try again");
        }

        senderUser.friends = [...senderUser.friends, receiverId];
        receiverUser.friends = [...receiverUser.friends, senderId];
        await senderUser.save();
        await receiverUser.save();

        // delete invitation
        await FriendInvitation.findByIdAndDelete(_id);

        // update list of the friends if the users are online
        updateFriends(senderId.toString());
        updateFriends(receiverId.toString());

        // update list of friends pending invitations
        updateFriendsPendingInvitations(receiverId.toString());

        res.send({ toast: "Invitation has been accepted" });
    }
);

// @DESC post reject
// @ROUTE POST /friend-invitation/reject
// @ACCESS Private
export const rejectInvitation = asyncRequestHandler(
    z.object({
        _id: z.string(),
    }),
    async (req, res) => {
        const { _id } = req.body;
        const user = req.user;

        // check if invitation exists
        const invitation = await FriendInvitation.exists({ _id });

        if (!invitation) {
            res.status(400);
            throw new Error("Invitation does not exist");
        }

        await FriendInvitation.findByIdAndDelete(_id);

        // update pending invitations
        updateFriendsPendingInvitations(user._id.toString());

        res.send({ toast: "Invitation has been rejected" });
    }
);
