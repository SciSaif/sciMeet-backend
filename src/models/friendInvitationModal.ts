import mongoose from "mongoose";

const Schema = mongoose.Schema;

const friendInvitationSchema = new Schema({
    senderId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    receiverId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
});

export default mongoose.model("FriendInvitation", friendInvitationSchema);
