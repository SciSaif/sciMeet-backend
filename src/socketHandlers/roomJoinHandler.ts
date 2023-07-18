import { getActiveRoom, joinActiveRoom } from "../serverStore.js";
import { SocketType } from "../socketServer.js";
import { updateRooms } from "./updates/rooms.js";

export const roomJoinHandler = (
    socket: SocketType,
    data: { roomid: string }
) => {
    const { roomid } = data;

    const participantDetails = {
        userId: socket.data.user?._id || "",
        socketId: socket.id,
    };

    const roomDetails = getActiveRoom(roomid);

    joinActiveRoom(roomid, participantDetails);
    updateRooms();
};
