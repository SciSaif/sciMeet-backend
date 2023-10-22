import Conversation from "../../models/conversationModal.js";
import { SocketType } from "../../socketServer.js";
import { updateChatHistory } from "../updates/chat.js";

export const directChatHistoryHandler = async (
    socket: SocketType,
    conversation_id: string,
    fromMessageId?: string
) => {
    try {
        const conversation = await Conversation.findById(conversation_id);

        if (conversation) {
            updateChatHistory(
                conversation._id.toString(),
                socket.id,
                fromMessageId
            );
        }
    } catch (err) {
        console.log(err);
    }
};
