import { SocketType } from "../../socketServer.js";
import Message from "../../models/messageModal.js";
import Conversation from "../../models/conversationModal.js";
import { updateChatHistory } from ".././updates/chat.js";

export const directMessageHandler = async (socket: SocketType, data: any) => {
    try {
        const user = socket.data.user;
        const { friend_id, content } = data;

        // create a new message
        const message = await Message.create({
            content: content,
            author: user?._id,
            date: new Date(),
            type: "DIRECT",
        });

        // find if conversation exists with this two users - if not create new
        const conversation = await Conversation.findOne({
            participants: { $all: [user?._id, friend_id] },
        });

        if (conversation) {
            // add message to conversation
            conversation.messages.push(message._id);
            await conversation.save();

            // perform and update to sender and receiver if is online
            updateChatHistory(conversation._id.toString());
        } else {
            // create new conversation
            const newConversation = await Conversation.create({
                participants: [user?._id, friend_id],
                messages: [message._id],
            });

            // perform and update to sender and receiver if is online
            updateChatHistory(newConversation._id.toString());
        }
    } catch (err) {
        console.log(err);
    }
};
