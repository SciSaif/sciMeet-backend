import { getActiveRooms, removeConnectedUser } from "../serverStore.js";
import { SocketType } from "../socketServer.js";
import { roomLeavehandler } from "./room/roomLeaveHandler.js";

export const disconnectHandler = (socket: SocketType) => {
    // check if user is in room and remove him from room
    const activeRooms = getActiveRooms();

    activeRooms.forEach((activeRoom) => {
        const userInRoom = activeRoom.participants.some((participant) => {
            return participant.socketId === socket.id;
        });

        if (userInRoom) {
            roomLeavehandler(socket, { roomid: activeRoom.roomid });
        }
    });

    removeConnectedUser(socket.id);
};
