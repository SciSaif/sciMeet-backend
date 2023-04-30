import Conversation from "../models/conversationModal.js";
import { SocketType } from "../socketServer.js";
import { updateChatHistory } from "./updates/chat.js";

export const directChatHistoryHandler = async (
    socket: SocketType,
    data: any
) => {
    try {
        const user = socket.data.user;
        const { receiverUserId } = data;

        const conversation = await Conversation.findOne({
            participants: { $all: [user?._id, receiverUserId] },
        });

        if (conversation) {
            updateChatHistory(conversation._id.toString(), socket.id);
        }
    } catch (err) {
        console.log(err);
    }
};
