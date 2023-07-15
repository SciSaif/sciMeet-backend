import Conversation from "../../models/conversationModal.js";
import {
    getActiveConnections,
    getSocketServerInstance,
} from "../../serverStore.js";

export const updateChatHistory = async (
    conversationId: string,
    toSpecifiedSocketId: string | null = null
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

    if (conversation) {
        const io = getSocketServerInstance();

        if (toSpecifiedSocketId) {
            // initial update of chat history, when user opens chat window, we get the history of messages
            return io.to(toSpecifiedSocketId).emit("direct-chat-history", {
                messages: conversation.messages,
                participants: conversation.participants,
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
                    messages: conversation.messages,
                    participants: conversation.participants,
                });
            });
        });
    }
};
