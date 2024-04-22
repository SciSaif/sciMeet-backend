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
import { getSignedUrl } from "../../utils/s3Functions.js";
import { BOT_ERROR_CODES } from "../../utils/gemini.js";
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
    conversation_id: string,
    toSpecifiedSocketId: string | null = null,
    fromMessageId?: string
) => {
    const conversation: any = await Conversation.findById(
        conversation_id
    ).populate({
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

        // for each message, if file exists, get signed url of the file
        for (let i = 0; i < messages.length; i++) {
            if (messages[i].file) {
                messages[i].file = await getSignedUrl(messages[i].file);
            }
        }

        // initial update of chat history, when user opens chat window, we get the history of messages or fetching more messages
        return io.to(toSpecifiedSocketId).emit("direct-chat-history", {
            _id: conversation._id,
            messages,
            participants: conversation.participants,
            append: fromMessageId ? true : false,
        });
    }

    // for each message, if file exists, get signed url of the file
    for (let i = 0; i < messages.length; i++) {
        if (messages[i].file) {
            messages[i].file = await getSignedUrl(messages[i].file);
        }
    }

    // check if users of this conversation are online
    // if yes emit to them update of messages

    conversation.participants.forEach((userId: string) => {
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
    conversation_id: string
) => {
    const io = getSocketServerInstance();

    const message = await Message.findById(messageId).populate({
        path: "author",
        model: "User",
        select: "username _id avatar",
    });

    if (!message) return;

    // if message contains file then get signed url
    if (message.file) {
        message.file = await getSignedUrl(message.file);
    }

    participants.forEach((userId) => {
        const activeConnections = getActiveConnections(userId.toString());

        if (activeConnections.length === 0) {
            return;
        }
        activeConnections.forEach((socketId) => {
            io.to(socketId).emit("direct-message", {
                conversation_id,
                message,
            });
        });
    });
};

//send bot error to all participants of the conversation
export const sendBotError = (
    participants: Types.ObjectId[],
    conversation_id: string,
    code: BOT_ERROR_CODES
) => {
    const io = getSocketServerInstance();

    participants.forEach((userId) => {
        const activeConnections = getActiveConnections(userId.toString());

        if (activeConnections.length === 0) {
            return;
        }
        activeConnections.forEach((socketId) => {
            io.to(socketId).emit("bot-error", {
                conversation_id,
                code,
            });
        });
    });
};

// send all the conversations to newly connected user
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
    conversation_id: string
) => {
    const user = socket.data.user;
    if (!user) return;
    // populate the messages field
    const conversation: any = await Conversation.findById(
        conversation_id
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
            conversation_id,
            userId: user._id,
        });
    });
};

export interface TypingStatusProps {
    isTyping: boolean;
    conversation_id: string;
    participantIds: string[];
}

export const updateTypingUsers = (
    socket: SocketType,
    { conversation_id, isTyping, participantIds }: TypingStatusProps
) => {
    const user = socket.data.user;
    if (!user) return;
    const io = getSocketServerInstance();

    const existingUserIds = getTypingUsers(conversation_id);
    if (isTyping) {
        setTypingUsers(conversation_id, [...existingUserIds, user._id]);
    } else {
        setTypingUsers(
            conversation_id,
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
            conversation_id,
            typingUsers: getTypingUsers(conversation_id).filter(
                (id) => id !== onlineParticipant.userId
            ),
        });
    });
};
