import User, { UserType } from "../../models/userModal.js";
import FriendInvitation from "../../models/friendInvitationModal.js";
import Conversation, { TConversation } from "../../models/conversationModal.js";
import {
    getActiveConnections,
    getSocketServerInstance,
} from "../../serverStore.js";
import { Types } from "mongoose";
import groupModel from "../../models/groupModel.js";

export const updateGroups = async (userId: string) => {
    try {
        // get the groups
        const conversations = await Conversation.find({
            participants: userId,
            isGroup: true,
        });

        const groups = await Promise.all(
            conversations.map(async (conversation) => {
                const group = await groupModel.findById(conversation.groupId);
                return group;
            })
        );

        // find active connections of specific id (online users)
        const receiverList = getActiveConnections(userId);

        if (receiverList.length === 0) return;

        const io = getSocketServerInstance();

        // send the updated groups to all the online users
        for (const receiver of receiverList) {
            io.to(receiver).emit("groups-list", groups);
        }
    } catch (err) {
        console.log(err);
    }
};
