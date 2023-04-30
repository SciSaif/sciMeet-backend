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
    date: { type: Date },
    type: { type: String },
});

export default mongoose.model("Message", messageSchema);
