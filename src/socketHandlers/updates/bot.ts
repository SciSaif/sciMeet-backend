import Conversation from "../../models/conversationModal.js";
import {
    getActiveConnections,
    getSocketServerInstance,
} from "../../serverStore.js";
import botModel from "../../models/botModel.js";

export const updateBots = async (userId: string) => {
    try {
        // get the bots
        const conversations = await Conversation.find({
            participants: userId,
            isBot: true,
        });

        const bots = await Promise.all(
            conversations.map(async (conversation) => {
                const bot = await botModel.findById(conversation.botId);
                return bot;
            })
        );

        // find active connections of specific id (online users)
        const receiverList = getActiveConnections(userId);

        if (receiverList.length === 0) return;

        const io = getSocketServerInstance();

        // send the updated bots to all the online users
        for (const receiver of receiverList) {
            io.to(receiver).emit("bots-list", bots);
        }
    } catch (err) {
        console.log(err);
    }
};
