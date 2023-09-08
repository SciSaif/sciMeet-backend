import mongoose from "mongoose";

const Schema = mongoose.Schema;

const groupSchema = new Schema({
    conversationId: {
        type: Schema.Types.ObjectId,
        ref: "Conversation",
    },
    groupName: {
        type: String,
        required: true,
    },
});

export default mongoose.model("Group", groupSchema);
