import User, { UserType } from "../../models/userModal.js";
import FriendInvitation from "../../models/friendInvitationModal.js";
import Conversation, { TConversation } from "../../models/conversationModal.js";
import {
    getActiveConnections,
    getSocketServerInstance,
} from "../../serverStore.js";
import { Types } from "mongoose";

export const updateFriendsPendingInvitations = async (userId: string) => {
    try {
        // find all active connections of specific userId
        const receiverList = getActiveConnections(userId);

        if (receiverList.length === 0) return;

        const pendingInvitations = await FriendInvitation.find({
            receiverId: userId,
        }).populate("senderId", "_id username email avatar");

        const io = getSocketServerInstance();

        receiverList.forEach((receiverSocketId) => {
            io.to(receiverSocketId).emit("friends-invitations", {
                pendingInvitations: pendingInvitations
                    ? pendingInvitations
                    : [],
            });
        });
    } catch (err) {
        console.log(err);
    }
};

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

export const updateFriends = async (userId: string, conversations?: any) => {
    try {
        const user = await User.findById(userId, {
            _id: 1,
            friends: 1,
        }).populate<{ friends: UserType[] }>(
            "friends",
            "_id username email avatar"
        );

        // find active connections of specific id (online users)
        const receiverList = getActiveConnections(userId);

        if (receiverList.length === 0 || !user) return;

        if (!conversations) {
            // get all the conversations where isGroup is false and the participants include this user
            conversations = await Conversation.find({
                isGroup: false,
                participants: { $in: [userId] },
            }).select("-messages");
        }
        const friendsList: any = [];

        for (const f of user.friends) {
            // get the conversation_id of the conversation where this user is in
            let conversation = conversations.find((c: any) =>
                // @ts-ignore
                c.participants.includes(f._id)
            );

            if (!conversation) {
                // create a new conversation
                conversation = await Conversation.create({
                    participants: [userId, f._id],
                    messages: [],
                });
            }

            friendsList.push({
                _id: f._id,
                email: f.email,
                username: f.username,
                avatar: f.avatar,
                conversation_id: conversation._id,
            });
        }

        // get io server instance
        const io = getSocketServerInstance();
        receiverList.forEach((receiverId) => {
            io.to(receiverId).emit("friends-list", {
                friends: friendsList ? friendsList : [],
            });
        });
    } catch (err) {
        console.log(err);
    }
};
