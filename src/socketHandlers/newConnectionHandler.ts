import { addNewConnectedUser } from "../serverStore.js";
import { ServerType, SocketType } from "../socketServer.js";
import {
    updateFriends,
    updateFriendsPendingInvitations,
} from "./updates/friends.js";
import { updateRooms } from "./updates/rooms.js";
import Conversation from "../models/conversationModal.js";
import { sendConversations } from "./updates/chat.js";

import settings from "../config/settings.js";
import { isMessageSeen } from "../utils/chatUtils.js";
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
        isGroup: false,
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
                conversation.messages = messages.slice(-count);
                break;
            } else {
                count++;
            }
        }
        count = 0;
    }

    // send all the conversations without the messages
    sendConversations(socket, conversations);

    setTimeout(() => {
        updateRooms(socket.id);
    }, 2000);
};
