import {
    getActiveRoom,
    ignoreCall,
    leaveActiveRoom,
} from "../../serverStore.js";
import { SocketType } from "../../socketServer.js";
import {
    closeRoom,
    notifyRoomParticipants,
    updateRooms,
} from "../updates/rooms.js";

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
        } else {
            activeRoom.participants.forEach((participant) => {
                socket.to(participant.socketId).emit("room-participant-left", {
                    connUserSocketId: socket.id,
                    isGroup: activeRoom.isGroup,
                });
            });
        }

        // updateRooms();
        notifyRoomParticipants(roomid);
    }
};

export const rejectCallHandler = (
    socket: SocketType,
    data: { roomid: string }
) => {
    const { roomid } = data;

    const activeRoom = getActiveRoom(roomid);

    const socketId = socket.id;

    if (!activeRoom) return;

    // close the room and notify the room creator
    const creatorSocketId = activeRoom.roomCreator.socketId;
    closeRoom(roomid, creatorSocketId, socketId);

    // socket.to(creatorSocketId).emit("call-rejected", {
    //     roomid,
    // });
};

export const ignoreCallHandler = (
    socket: SocketType,
    data: { roomid: string }
) => {
    const { roomid } = data;
    const user_id = socket.data.user?._id;
    if (!user_id) return;

    ignoreCall(roomid, user_id);

    // send new active rooms to current user

    notifyRoomParticipants(roomid, socket.id);
};
