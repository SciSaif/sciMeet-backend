import mongoose, { InferSchemaType } from "mongoose";

const Schema = mongoose.Schema;

const conversationSchema = new Schema({
    participants: [
        {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    messages: [
        {
            type: Schema.Types.ObjectId,
            ref: "Message",
        },
    ],
    isGroup: {
        type: Boolean,
        default: false,
    },
    groupId: {
        type: Schema.Types.ObjectId,
        ref: "Group",
    },
});

export type TConversation = InferSchemaType<typeof conversationSchema> & {
    _id: string;
};

export default mongoose.model("Conversation", conversationSchema);
