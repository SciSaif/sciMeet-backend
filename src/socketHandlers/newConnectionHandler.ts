import { addNewConnectedUser } from "../serverStore.js";
import { ServerType, SocketType } from "../socketServer.js";
import {
    updateFriends,
    updateFriendsPendingInvitations,
} from "./updates/friends.js";

export const newConnectionHandler = async (
    socket: SocketType,
    io: ServerType
) => {
    const user = socket.data.user;
    if (!user) return;
    addNewConnectedUser(socket.id, user._id);

    // update pending friends invitations list
    updateFriendsPendingInvitations(user._id);
    // update friends list
    updateFriends(user._id);
};
