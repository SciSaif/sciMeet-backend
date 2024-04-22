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

    const history: History[] = [];
    let currentRole: "model" | "user" | undefined;
    let currentParts: { text: string }[] = [];

    for (const message of messagesWithContent) {
        const role = message.isBot ? "model" : "user";
        const text = message.content as string;

        if (role === currentRole) {
            currentParts.push({ text });
        } else {
            if (currentRole !== undefined) {
                history.push({ role: currentRole, parts: currentParts });
            }
            currentRole = role;
            currentParts = [{ text }];
        }
    }

    if (currentRole !== undefined) {
        history.push({ role: currentRole, parts: currentParts });
    }

    return history;
};
