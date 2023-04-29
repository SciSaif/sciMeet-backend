import User, { UserType } from "../../models/userModal.js";
import FriendInvitation from "../../models/friendInvitationModal.js";
import {
    getActiveConnections,
    getSocketServerInstance,
} from "../../serverStore.js";

export const updateFriendsPendingInvitations = async (userId: string) => {
    try {
        // find all active connections of specific userId
        const receiverList = getActiveConnections(userId);

        if (receiverList.length === 0) return;

        const pendingInvitations = await FriendInvitation.find({
            receiverId: userId,
        }).populate("senderId", "_id username email");

        const io = getSocketServerInstance();

        receiverList.forEach((receiverSocketId) => {
            io.to(receiverSocketId).emit("friends-invitations", {
                pendingInvitations: pendingInvitations
                    ? pendingInvitations
                    : [],
            });
        });
    } catch (err) {
        console.log(err);
    }
};

export const updateFriends = async (userId: string) => {
    try {
        const user = await User.findById(userId, {
            _id: 1,
            friends: 1,
        }).populate<{ friends: UserType[] }>("friends", "_id username email");

        // find active connections of specific id (online users)
        const receiverList = getActiveConnections(userId);

        if (receiverList.length === 0) return;

        if (user) {
            const friendsList = user.friends.map((f) => {
                return {
                    _id: f._id,
                    email: f.email,
                    username: f.username,
                };
            });

            // get io server instance
            const io = getSocketServerInstance();
            receiverList.forEach((receiverId) => {
                io.to(receiverId).emit("friends-list", {
                    friends: friendsList ? friendsList : [],
                });
            });
        }
    } catch (err) {
        console.log(err);
    }
};
