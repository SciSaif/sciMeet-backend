import { z } from "zod";
import asyncRequestHandler from "../utils/asyncRequestHandler.js";
import User from "../models/userModal.js";
import Group from "../models/groupModel.js";
import Conversation from "../models/conversationModal.js";
import {
    getActiveConnections,
    getOnlineUsers,
    getSocketServerInstance,
} from "../serverStore.js";
// for reference:
// // check if friend that we would like to invite is not current user
// if (
//     user.email.toLocaleLowerCase() ===
//     targetEmailAddress.toLocaleLowerCase()
// ) {
//     res.status(400);
//     throw new Error("You can't invite yourself");
// }

// const targetUser = await User.findOne({
//     email: targetEmailAddress.toLocaleLowerCase(),
// });

// if (!targetUser) {
//     res.status(400);
//     throw new Error("User with this email does not exist");
// }

// // check if invitation has been already sent
// const invitation = await FriendInvitation.findOne({
//     senderId: user._id,
//     receiverId: targetUser._id,
// });

// if (invitation) {
//     res.status(409);
//     throw new Error("Invitation has been already sent");
// }

// // check if the user which we would like to invite is already our friend
// const isAlreadyFriend = targetUser.friends.find(
//     (friendId) => friendId.toString() === user._id.toString()
// );

// if (isAlreadyFriend) {
//     res.status(409);
//     throw new Error("User is already your friend");
// }

// // create new invitation in database
// const newInvitation = await FriendInvitation.create({
//     senderId: user._id,
//     receiverId: targetUser._id,
// });

// // if invitation has been created successfully, update friends invitations if other user is online
// if (newInvitation) {
//     // send pending invitations to all active connections of target user
//     updateFriendsPendingInvitations(targetUser._id.toString());
// }

// return res.status(201).send({ toast: "Invitation has been sent" });

// const conversationSchema = new Schema({
//     participants: [
//         {
//             type: Schema.Types.ObjectId,
//             ref: "User",
//         },
//     ],
//     messages: [
//         {
//             type: Schema.Types.ObjectId,
//             ref: "Message",
//         },
//     ],
//     isGroup: {
//         type: Boolean,
//         default: false,
//     },
//     groupId: {
//         type: Schema.Types.ObjectId,
//         ref: "Group",
//     },
// });

// const groupSchema = new Schema({
//     creator_id: {
//         type: Schema.Types.ObjectId,
//     },
//     conversationId: {
//         type: Schema.Types.ObjectId,
//         ref: "Conversation",
//     },
//     groupName: {
//         type: String,
//         required: true,
//     },
// });

// @DESC Create a new group
// @ROUTE POST /groups
// @ACCESS Private
export const createGroup = asyncRequestHandler(
    z.object({
        group_name: z.string().min(1),
        participants: z.array(z.string()),
        avatar: z.string(),
    }),
    async (req, res) => {
        let { group_name, participants, avatar } = req.body;
        const user = req.user;

        // create a group with the given groupName
        const group = await Group.create({
            group_name,
            creator_id: user._id,
            avatar,
        });

        // add current userid to participants
        participants.push(user._id);
        // create a new conversation
        const conversation = await Conversation.create({
            participants,
            isGroup: true,
            groupId: group._id,
        });

        // add conversation id to group
        group.conversation_id = conversation._id;
        await group.save();

        const curr_conversation: any = await Conversation.findById(
            conversation._id
        ).populate({
            path: "messages",
            model: "Message",
            populate: {
                path: "author",
                model: "User",
                select: "username _id avatar",
            },
        });

        const io = getSocketServerInstance();

        // find all active connections of specific userId
        const onlineUsers = getOnlineUsers();
        // get all online participants
        const receiverList = onlineUsers.filter((onlineUser) =>
            participants.includes(onlineUser.userId)
        );

        receiverList.forEach((receiverSocketId) => {
            io.to(receiverSocketId.socketId).emit("new-group", {
                group,
                conversation: curr_conversation,
            });
        });

        return res.status(201).json({ toast: "Group created successfully!" });
    }
);

// @DESC delete a group
// @ROUTE DELETE /groups/:groupId
// @ACCESS Private
export const deleteGroup = asyncRequestHandler(null, async (req, res) => {
    const { groupId } = req.params;
    const user = req.user;

    const group = await Group.findById(groupId);
    if (!group) {
        return res.status(400).json({ toast: "Group does not exist" });
    }

    // check if current user is the creator of the group
    if (group.creator_id.toString() !== user._id) {
        return res.status(401).json({ toast: "You are not the creator" });
    }

    // delete group
    await Group.findByIdAndDelete(groupId);

    // get the conversation
    const conversation = await Conversation.findOne({
        groupId,
    });

    if (!conversation) {
        return res.status(400).json({ toast: "Conversation does not exist" });
    }

    // delete conversation
    await Conversation.findOneAndDelete({
        groupId,
    });

    const participants = conversation.participants;

    // send group deleted event to all participants
    const onlineUsers = getOnlineUsers();
    const receiverList = onlineUsers.filter((onlineUser) =>
        participants.includes(onlineUser.userId as any)
    );

    const io = getSocketServerInstance();

    receiverList.forEach((receiverSocketId) => {
        io.to(receiverSocketId.socketId).emit("group-deleted", {
            groupId,
        });
    });

    return res.status(200).json({ toast: "Group deleted successfully!" });
});
