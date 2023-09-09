import { SocketType } from "../../socketServer.js";
import Message from "../../models/messageModal.js";
import Conversation from "../../models/conversationModal.js";
import { sendNewMessage, updateChatHistory } from ".././updates/chat.js";

export const directMessageHandler = async (socket: SocketType, data: any) => {
    try {
        const user = socket.data.user;
        const { friend_id, content } = data;

        // find if conversation exists with this two users - if not create new
        const conversation = await Conversation.findOne({
            participants: { $all: [user?._id, friend_id] },
        });
        // create a new message
        const message = await Message.create({
            content: content,
            author: user?._id,
            date: new Date(),
            type: "DIRECT",
            firstMessage: conversation?.messages.length === 0 ? true : false,
        });

        if (!conversation) return;

        // add message to conversation
        conversation.messages.push(message._id);
        await conversation.save();

        // perform and update to sender and receiver if is online
        // updateChatHistory(conversation._id.toString());
        sendNewMessage(
            conversation.participants,
            message._id.toString(),
            conversation._id.toString()
        );
    } catch (err) {
        console.log(err);
    }
};
