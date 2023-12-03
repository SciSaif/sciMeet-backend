import { log } from "console";
import conversationModal from "../../models/conversationModal.js";
import {
    ActiveRoom,
    getActiveRoom,
    getActiveRooms,
    getOnlineUsers,
    getSocketServerInstance,
    leaveActiveRoom,
} from "../../serverStore.js";

export const updateRooms = (toSpecifiedSocketId: string | null = null) => {
    const io = getSocketServerInstance();

    const activeRooms = getActiveRooms();
    console.log("in update rooms");

    if (toSpecifiedSocketId) {
        io.to(toSpecifiedSocketId).emit("active-rooms", { activeRooms });
    } else {
        io.emit("active-rooms", { activeRooms });
    }
};
export const notifyRoomParticipants = async (
    room_id: string,
    toSpecifiedSocketId: string | null = null
) => {
    const io = getSocketServerInstance();

    const activeRoom = getActiveRoom(room_id);
    log("active room: ignore", activeRoom);

    if (!activeRoom) return;
    console.log("in notify room participants: ");

    if (toSpecifiedSocketId) {
        io.to(toSpecifiedSocketId).emit("active-rooms", {
            activeRooms: [activeRoom],
        });
    } else {
        notifyRoomParticipantsByRoom(activeRoom);
    }
};

export const notifyRoomParticipantsByRoom = async (
    activeRoom: ActiveRoom,
    emptyRoom?: boolean
) => {
    const io = getSocketServerInstance();

    const conversation_id = activeRoom.conversation_id;
    // get all the participants of the conversation
    const conversation = await conversationModal.findById(conversation_id, {
        participants: 1,
    });

    if (!conversation) return;

    const participants = conversation.participants;
    // io.emit("active-rooms", { activeRooms: [activeRoom] });

    const onlineUsers = getOnlineUsers();
    // get the participants who are online
    const onlineParticipants = onlineUsers.filter((onlineUser) => {
        return participants.includes(onlineUser.userId as any);
    });

    console.log("online participants: ", onlineParticipants);

    // send to all the participants of the conversation
    onlineParticipants.forEach((onlineParticipant) => {
        io.to(onlineParticipant.socketId).emit("active-rooms", {
            activeRooms: emptyRoom ? [] : [activeRoom],
        });
    });
};

// close the room and notify room participants
export const closeRoom = (
    roomid: string,
    creatorSocketId: string,
    userSocketId: string
) => {
    const io = getSocketServerInstance();

    const activeRoom = getActiveRoom(roomid);

    if (!activeRoom) return;

    // close the room and notify the room creator
    leaveActiveRoom(roomid, creatorSocketId);

    io.to(creatorSocketId).emit("active-rooms", {
        activeRooms: [],
    });
    io.to(userSocketId).emit("active-rooms", {
        activeRooms: [],
    });

    console.log("room closed", activeRoom);

    io.to(creatorSocketId).emit("call-rejected", {
        roomid,
    });
};
