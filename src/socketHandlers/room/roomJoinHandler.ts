import { getActiveRoom, joinActiveRoom } from "../../serverStore.js";
import { SocketType } from "../../socketServer.js";
import { updateRooms } from "../updates/rooms.js";

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
    if (!roomDetails) return;

    // check if the user is already in the room
    const participantsInRoom = roomDetails.participants;
    const alreadyInRoom = participantsInRoom.find(
        (participant) => participant.socketId === participantDetails.socketId
    );
    if (alreadyInRoom) return;

    const allowedParticipants = roomDetails?.conversation_participants;
    if (!allowedParticipants.includes(participantDetails.userId)) return;

    joinActiveRoom(roomid, participantDetails);

    // send information to users in room that they should prepare for incoming connection
    roomDetails?.participants.forEach((participant) => {
        // don't send to self
        if (participant.socketId !== participantDetails.socketId) {
            socket.to(participant.socketId).emit("conn-prepare", {
                connUserSocketId: participantDetails.socketId,
            });
        }
    });

    updateRooms();
};
