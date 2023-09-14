import mongoose from "mongoose";

const Schema = mongoose.Schema;

const messageSchema = new Schema({
    author: {
        type: Schema.Types.ObjectId,
        ref: "User",
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
    date: { type: Date },
    type: { type: String },
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
});

export default mongoose.model("Message", messageSchema);
