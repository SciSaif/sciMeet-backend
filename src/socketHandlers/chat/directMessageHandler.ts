import { SocketType } from "../../socketServer.js";
import Message from "../../models/messageModal.js";
import Conversation from "../../models/conversationModal.js";
import { sendNewMessage, updateChatHistory } from ".././updates/chat.js";
import { putObject } from "../../utils/s3Functions.js";

export interface MessageType {
    friend_id: string;
    content?: string;
    // file?: string | ArrayBuffer | null;
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
        let { friend_id, content, file, fileName: fn, fileType } = data;

        // find if conversation exists with this two users - if not create new
        const conversation = await Conversation.findOne({
            participants: { $all: [user?._id, friend_id] },
        });

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
    } catch (err) {
        console.log(err);
    }
};
