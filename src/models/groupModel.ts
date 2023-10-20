import mongoose from "mongoose";

const Schema = mongoose.Schema;

const groupSchema = new Schema({
    creator_id: {
        type: Schema.Types.ObjectId,
    },
    conversation_id: {
        type: Schema.Types.ObjectId,
        ref: "Conversation",
    },
    group_name: {
        type: String,
        required: true,
    },
});

export default mongoose.model("Group", groupSchema);
