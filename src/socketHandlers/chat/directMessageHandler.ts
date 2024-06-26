import { SocketType } from "../../socketServer.js";
import Message from "../../models/messageModal.js";
import Conversation from "../../models/conversationModal.js";
import { sendBotError, sendNewMessage } from ".././updates/chat.js";
import { putObject } from "../../utils/s3Functions.js";
import { getHistory } from "../../utils/chatUtils.js";
import { BOT_ERROR_CODES, GeminiChat } from "../../utils/gemini.js";
import botModel from "../../models/botModel.js";

export interface MessageType {
    conversation_id: string;
    content?: string;
    file?: any;
    fileName?: string;
    fileType?: string;
}

export const directMessageHandler = async (
    socket: SocketType,
    data: MessageType
) => {
    try {
        const user = socket.data.user;
        if (!user) return;
        let { conversation_id, content, file, fileName: fn, fileType } = data;

        // find if conversation exists with this two users - if not create new
        const conversation = await Conversation.findById(conversation_id);

        if (!conversation) return;
        if (fileType === "audio") {
            // generate a fileName
            // get the part of the user email before the @
            let email = user.email.split("@")[0];
            fn = email + ".webm";
        }
        // if type of File is not ArrayBuffer then return
        let fullPath = "";
        // if file exists, upload to s3
        if (file && fn) {
            const folderName = "messages/" + conversation._id + "/";
            const fileName = `${new Date().toISOString()}_${fn}`;

            fullPath = folderName + fileName;

            await putObject(fullPath, file);
        }
        const bot_user_id = conversation.participants.find(
            (id) => id.toString() !== user._id.toString()
        );
        // console.log("messages", conversation?.messages);
        // create a new message
        const message = await Message.create({
            content: content,
            author: user?._id,
            date: new Date(),
            type: "DIRECT",
            file: fullPath,
            fileName: fn,
            fileType,
            firstMessage: conversation?.messages.length === 0 ? true : false,
            seenBy: conversation.isBot
                ? [{ userId: bot_user_id, date: new Date() }]
                : [],
        });

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

        // check if conversation is with a bot
        // if so create a response from the bot
        if (!conversation.isBot || !content) return;

        // get the messages
        const messageIds = conversation.messages.map((m) => m.toString());
        const messages = await Message.find({
            _id: { $in: messageIds },
        });
        // cut the last message because thats not part of history yet
        messages.pop();

        const history = getHistory(messages);
        // if last history message is from user, then merge the last message and current message
        if (history.length > 0 && history[history.length - 1].role === "user") {
            const lastMessage = history.pop();
            const lastText = lastMessage?.parts.map((p) => p.text).join(" ");
            content = lastText + " " + content;
        }
        // get the bot
        const bot = await botModel.findById(conversation.botId);
        if (!bot) return;

        const gemini = new GeminiChat(bot.api_key);
        const botMessage = await gemini.askGemini(content, history);

        if (botMessage === BOT_ERROR_CODES.SAFETY) {
            // delete the last message
            conversation.messages.pop();
            await conversation.save();

            sendBotError(
                conversation.participants,
                conversation._id.toString(),
                BOT_ERROR_CODES.SAFETY
            );
            return;
        }

        const botMessageObj = await Message.create({
            content: botMessage,
            author: bot_user_id,
            date: new Date(),
            type: "DIRECT",
            isBot: true,
        });

        conversation.messages.push(botMessageObj._id);
        await conversation.save();

        sendNewMessage(
            conversation.participants,
            botMessageObj._id.toString(),
            conversation._id.toString()
        );
    } catch (err) {
        console.log("error", err);
    }
};
