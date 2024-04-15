import { Types } from "mongoose";
import { IMessage } from "../models/messageModal.js";
import { History } from "./gemini.js";

// function to check if message is seen by userId or not
export const isMessageSeen = (message: any, userId: string) => {
    return message.seenBy.find(
        (d: { userId: Types.ObjectId; date: string }) =>
            d.userId.toString() === userId
    );
};

// function that takes Messages and returns the history
export const getHistory = (messages: IMessage[]): History[] => {
    const messagesWithContent = messages.filter((m) => m.content !== undefined);

    const history = messagesWithContent.map((message) => {
        return {
            role: message.isBot ? "model" : "user",
            parts: [{ text: message.content as string }],
        };
    });
    return history;
};
