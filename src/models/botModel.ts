import mongoose from "mongoose";

const Schema = mongoose.Schema;

const botSchema = new Schema({
    creator_id: {
        type: Schema.Types.ObjectId,
        required: true,
    },

    conversation_id: {
        type: Schema.Types.ObjectId,
        ref: "Conversation",
    },
    bot_name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    avatar: {
        type: String,
    },
    api_key: {
        type: String,
    },
});

export default mongoose.model("Bot", botSchema);
