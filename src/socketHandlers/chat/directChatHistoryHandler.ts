import Conversation from "../../models/conversationModal.js";
import { SocketType } from "../../socketServer.js";
import { updateChatHistory } from "../updates/chat.js";

export const directChatHistoryHandler = async (
    socket: SocketType,
    friend_id: string,
    pageNumber?: number
) => {
    try {
        const user = socket.data.user;

        const conversation = await Conversation.findOne({
            participants: { $all: [user?._id, friend_id] },
        });

        if (conversation) {
            updateChatHistory(
                conversation._id.toString(),
                socket.id,
                pageNumber
            );
        }
    } catch (err) {
        console.log(err);
    }
};
