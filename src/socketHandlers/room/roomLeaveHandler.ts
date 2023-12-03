import { log } from "console";
import {
    getActiveRoom,
    ignoreCall,
    leaveActiveRoom,
} from "../../serverStore.js";
import { SocketType } from "../../socketServer.js";
import {
    closeRoom,
    notifyRoomParticipants,
    notifyRoomParticipantsByRoom,
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
            log("active room: 1", updatedActiveRoom);

            updatedActiveRoom.participants.forEach((participant) => {
                socket.to(participant.socketId).emit("room-participant-left", {
                    connUserSocketId: socket.id,
                });
            });
            notifyRoomParticipants(roomid);
        } else {
            log("active room: 2", activeRoom);
            activeRoom.participants.forEach((participant) => {
                console.log("participant: ", participant);
                socket.to(participant.socketId).emit("room-participant-left", {
                    connUserSocketId: socket.id,
                    isGroup: activeRoom.isGroup,
                });
            });

            notifyRoomParticipantsByRoom(activeRoom, true);
        }

        // updateRooms();
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
