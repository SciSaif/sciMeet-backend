import mongoose from "mongoose";

const Schema = mongoose.Schema;

const messageSchema = new Schema({
    author: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    content: {
        type: String,
    },
    file: {
        type: String,
    },
    fileName: {
        type: String,
    },
    fileType: {
        type: String,
    },
    date: { type: Date, default: Date.now },
    type: { type: String, default: "DIRECT" },
    seenBy: {
        type: [
            {
                userId: {
                    type: Schema.Types.ObjectId,
                    ref: "User",
                },
                date: { type: Date },
            },
        ],
        default: [],
    },
    firstMessage: {
        type: Boolean,
        default: false,
    },
    isBot: {
        type: Boolean,
        default: false,
    },
});

export interface IMessage {
    _id: mongoose.Types.ObjectId;
    author: string;
    content?: string;
    file?: string;
    fileName?: string;
    fileType?: string;
    date: Date;
    type: string;
    seenBy: {
        userId: string;
        date: Date;
    }[];
    firstMessage: boolean;
    isBot: boolean;
}

export default mongoose.model<IMessage>("Message", messageSchema);
