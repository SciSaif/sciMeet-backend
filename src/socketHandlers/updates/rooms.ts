import conversationModal from "../../models/conversationModal.js";
import {
    getActiveRoom,
    getActiveRooms,
    getOnlineUsers,
    getSocketServerInstance,
} from "../../serverStore.js";

export const updateRooms = (toSpecifiedSocketId: string | null = null) => {
    const io = getSocketServerInstance();

    const activeRooms = getActiveRooms();

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

    if (!activeRoom) return;

    if (toSpecifiedSocketId) {
        io.to(toSpecifiedSocketId).emit("active-rooms", {
            activeRooms: [activeRoom],
        });
    } else {
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
                activeRooms: [activeRoom],
            });
        });
    }
};
