import { addNewActiveRoom, getActiveRoomByUserId } from "../../serverStore.js";
import { SocketType } from "../../socketServer.js";
import { notifyRoomParticipants, updateRooms } from "../updates/rooms.js";

export const roomCreateHandler = (
    socket: SocketType,
    data: {
        conversation_id: string;
        conversation_participants: string[];
    }
) => {
    console.log("handling room create event");

    const socketId = socket.id;
    const userId = socket.data.user?._id;

    if (!userId) return;

    const roomDetails = addNewActiveRoom(userId, socketId, data);

    socket.emit("room-create", {
        roomDetails,
    });

    console.log("new room created: ", roomDetails);
    // updateRooms();
    notifyRoomParticipants(roomDetails.roomid);
};
