import { getActiveRoom, leaveActiveRoom } from "../serverStore.js";
import { SocketType } from "../socketServer.js";
import { updateRooms } from "./updates/rooms.js";

export const roomLeavehandler = (
    socket: SocketType,
    data: { roomid: string }
) => {
    const { roomid } = data;

    const activeRoom = getActiveRoom(roomid);

    if (activeRoom) {
        leaveActiveRoom(roomid, socket.id);

        updateRooms();
    }
};
