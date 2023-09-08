import { addNewActiveRoom } from "../../serverStore.js";
import { SocketType } from "../../socketServer.js";
import { updateRooms } from "../updates/rooms.js";

export const roomCreateHandler = (socket: SocketType) => {
    console.log("handling room create event");

    const socketId = socket.id;
    const userId = socket.data.user?._id;

    if (!userId) return;

    const roomDetails = addNewActiveRoom(userId, socketId);

    socket.emit("room-create", {
        roomDetails,
    });

    updateRooms();
};
