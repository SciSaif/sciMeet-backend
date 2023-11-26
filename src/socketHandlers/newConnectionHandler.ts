import { addNewConnectedUser, getActiveRoomByUserId } from "../serverStore.js";
import { ServerType, SocketType } from "../socketServer.js";
import {
    updateFriends,
    updateFriendsPendingInvitations,
} from "./updates/friends.js";
import { notifyRoomParticipants, updateRooms } from "./updates/rooms.js";
import Conversation from "../models/conversationModal.js";
import { sendConversations } from "./updates/chat.js";

import settings from "../config/settings.js";
import { isMessageSeen } from "../utils/chatUtils.js";
import { getSignedUrl } from "../utils/s3Functions.js";
import { updateGroups } from "./updates/group.js";
const startingPageLimit = settings.startingPageLimit;

export const newConnectionHandler = async (
    socket: SocketType,
    io: ServerType
) => {
    const user = socket.data.user;
    if (!user) return;
    addNewConnectedUser(socket.id, user._id);

    // update pending friends invitations list
    updateFriendsPendingInvitations(user._id);

    const conversations: any = await Conversation.find({
        participants: { $in: [user._id] },
    }).populate({
        path: "messages",
        model: "Message",
        populate: {
            path: "author",
            model: "User",
            select: "username _id avatar",
        },
    });

    if (!conversations) return;

    // update friends list
    updateFriends(user._id, conversations);

    // update groups list
    updateGroups(user._id);

    // only send the upto latest $startingPageLimit messages or all the unread messages
    for (const conversation of conversations) {
        let messages = conversation.messages;
        let count = 0;
        // find the index of the read message
        for (let i = messages.length - 1; i >= 0; i--) {
            if (
                messages[i].author._id.toString() !== user._id &&
                !isMessageSeen(messages[i], user._id)
            ) {
                count++;
                continue;
            } else if (count > startingPageLimit) {
                break;
            } else {
                count++;
            }
        }

        conversation.messages = messages.slice(-count);
        for (let i = 0; i < messages.length; i++) {
            if (messages[i].file) {
                messages[i].file = await getSignedUrl(messages[i].file);
                // console.log(messages[i].file);
            }
        }

        count = 0;
    }

    // send all the conversations to newly connected user
    sendConversations(socket, conversations);

    setTimeout(() => {
        // updateRooms(socket.id);
        const activeRoom = getActiveRoomByUserId(user._id);
        if (!activeRoom) return;

        notifyRoomParticipants(activeRoom.roomid, socket.id);
    }, 2000);
};
