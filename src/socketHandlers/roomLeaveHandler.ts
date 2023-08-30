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

        const updatedActiveRoom = getActiveRoom(roomid);
        if (updatedActiveRoom) {
            console.log("participants", updatedActiveRoom.participants);
            updatedActiveRoom.participants.forEach((participant) => {
                socket.to(participant.socketId).emit("room-participant-left", {
                    connUserSocketId: socket.id,
                });
            });
        }

        updateRooms();
    }
};
