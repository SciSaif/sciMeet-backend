import Conversation from "../../models/conversationModal.js";
import Message from "../../models/messageModal.js";
import {
    getActiveConnections,
    getOnlineUsers,
    getSocketServerInstance,
    getTypingUsers,
    setTypingUsers,
} from "../../serverStore.js";

import settings from "../../config/settings.js";
import { Types } from "mongoose";
import { SocketType } from "../../socketServer.js";
const perPageLimit = settings.perPageLimit;
const startingPageLimit = settings.startingPageLimit;

const getMessagesAfterMessageId = (messages: any[], fromMessageId: string) => {
    const fromIndex = messages.findIndex(
        (message) => message._id.toString() === fromMessageId
    );

    if (fromIndex === -1) return [];

    // latest message is at the end of the messages
    // so get the the messages from $fromIndex to $fromIndex - perPageLimit
    const start = fromIndex - perPageLimit >= 0 ? fromIndex - perPageLimit : 0;
    return messages.slice(start, fromIndex);
};

export const updateChatHistory = async (
    conversationId: string,
    toSpecifiedSocketId: string | null = null,
    fromMessageId?: string
) => {
    const conversation = await Conversation.findById(conversationId).populate({
        path: "messages",
        model: "Message",
        populate: {
            path: "author",
            model: "User",
            select: "username _id avatar",
        },
    });

    if (!conversation) return;

    const io = getSocketServerInstance();
    let messages = conversation.messages;

    if (toSpecifiedSocketId) {
        if (fromMessageId) {
            // load the next $perPageLimit messages starting from the $fromMessageId
            messages = getMessagesAfterMessageId(messages, fromMessageId);
        } else messages = messages.slice(-startingPageLimit);

        // initial update of chat history, when user opens chat window, we get the history of messages
        return io.to(toSpecifiedSocketId).emit("direct-chat-history", {
            _id: conversation._id,
            messages,
            participants: conversation.participants,
            append: fromMessageId ? true : false,
        });
    }

    // check if users of this conversation are online
    // if yes emit to them update of messages

    conversation.participants.forEach((userId) => {
        const activeConnections = getActiveConnections(userId.toString());

        if (activeConnections.length === 0) {
            return;
        }
        activeConnections.forEach((socketId) => {
            io.to(socketId).emit("direct-chat-history", {
                _id: conversation._id,
                messages: messages.slice(-startingPageLimit),
                participants: conversation.participants,
            });
        });
    });
};

export const sendNewMessage = async (
    participants: Types.ObjectId[],
    messageId: string,
    conversationId: string
) => {
    const io = getSocketServerInstance();

    const message = await Message.findById(messageId).populate({
        path: "author",
        model: "User",
        select: "username _id avatar",
    });

    if (!message) return;

    participants.forEach((userId) => {
        const activeConnections = getActiveConnections(userId.toString());

        if (activeConnections.length === 0) {
            return;
        }
        activeConnections.forEach((socketId) => {
            io.to(socketId).emit("direct-message", {
                conversationId,
                message,
            });
        });
    });
};

// const messageSchema = new Schema({
//     author: {
//         type: Schema.Types.ObjectId,
//         ref: "User",
//     },
//     content: {
//         type: String,
//     },
//     date: { type: Date },
//     type: { type: String },
//     seenBy: {
//         type: [
//             {
//                 userId: {
//                     type: Schema.Types.ObjectId,
//                     ref: "User",
//                 },
//                 date: { type: Date },
//             },
//         ],
//         default: [],
//     },
//     firstMessage: {
//         type: Boolean,
//         default: false,
//     },
// });

// send all the conversations without the messages to newly connected user
export const sendConversations = async (
    socket: SocketType,
    conversations: any
) => {
    const user = socket.data.user;
    if (!user) return;

    const io = getSocketServerInstance();

    // find all active connections of specific userId
    const receiverList = getActiveConnections(user._id);
    receiverList.forEach((receiverSocketId) => {
        io.to(receiverSocketId).emit("conversations", conversations);
    });
};

export const updateLastSeen = async (
    socket: SocketType,
    conversationId: string
) => {
    const user = socket.data.user;
    if (!user) return;
    // populate the messages field
    const conversation: any = await Conversation.findById(
        conversationId
    ).populate({
        path: "messages",
        model: "Message",
    });

    if (!conversation) return;

    let messages = conversation.messages;

    // add user._id to all the messages starting from the last message till you find a message that is already sseen by current user
    for (let i = messages.length - 1; i >= 0; i--) {
        const seenBy = messages[i].seenBy;
        if (messages[i].author.toString() === user._id) {
            continue;
        }
        if (
            seenBy.find(
                (d: { userId: string; date: string }) =>
                    d.userId.toString() === user._id
            )
        ) {
            console.log("breaking", seenBy, user._id);
            break;
        }

        // update the Message
        await Message.findByIdAndUpdate(messages[i]._id, {
            $push: {
                seenBy: { userId: user._id, date: new Date() },
            },
        });
    }

    // emit to all active participants of the conversation
    const io = getSocketServerInstance();
    const onlineUsers = getOnlineUsers();
    const allParticipants = conversation.participants;
    // get the participants who are online
    const onlineParticipants = onlineUsers.filter((onlineUser) => {
        return allParticipants.includes(onlineUser.userId);
    });

    // emit to all online participants
    onlineParticipants.forEach((onlineParticipant) => {
        io.to(onlineParticipant.socketId).emit("seen-messages", {
            conversationId,
            userId: user._id,
        });
    });
};

export interface TypingStatusProps {
    isTyping: boolean;
    conversationId: string;
    participantIds: string[];
}

export const updateTypingUsers = (
    socket: SocketType,
    { conversationId, isTyping, participantIds }: TypingStatusProps
) => {
    const user = socket.data.user;
    if (!user) return;
    const io = getSocketServerInstance();

    const existingUserIds = getTypingUsers(conversationId);
    if (isTyping) {
        setTypingUsers(conversationId, [...existingUserIds, user._id]);
    } else {
        setTypingUsers(
            conversationId,
            existingUserIds.filter((id) => id !== user._id)
        );
    }

    // emit typing status to all participants of the conversation
    const onlineUsers = getOnlineUsers();
    // get the participants who are online
    const onlineParticipants = onlineUsers.filter((onlineUser) => {
        if (onlineUser.userId === user._id) return false;
        return participantIds.includes(onlineUser.userId);
    });

    // emit to all online participants
    onlineParticipants.forEach((onlineParticipant) => {
        if (onlineParticipant.userId === user._id) return;
        io.to(onlineParticipant.socketId).emit("typing-status", {
            conversationId,
            typingUsers: getTypingUsers(conversationId).filter(
                (id) => id !== onlineParticipant.userId
            ),
        });
    });
};
