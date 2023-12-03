import { TypingStatusProps } from "./socketHandlers/updates/chat.js";
import { ServerType, SocketType } from "./socketServer.js";
import { v4 as uuid } from "uuid";

const connectedUsers = new Map<string, { userId: string }>();

export interface ActiveRoom {
    roomCreator: {
        userId: string;
        socketId: string;
    };
    participants: {
        userId: string;
        socketId: string;
    }[];
    roomid: string;
    conversation_id: string;
    conversation_participants: string[];
    isGroup: boolean;
    ignoredBy?: string[];
}

let activeRooms = <ActiveRoom[]>[];

let io: ServerType;

export const setSocketServerInstance = (ioInstance: ServerType) => {
    io = ioInstance;
};

export const getSocketServerInstance = () => {
    return io;
};

export const addNewConnectedUser = (socketId: string, userId: string) => {
    connectedUsers.set(socketId, { userId });
    console.log("new connected users: ", connectedUsers);
};

export const removeConnectedUser = (socketId: string) => {
    if (!connectedUsers.has(socketId)) return;
    connectedUsers.delete(socketId);
    console.log("new connected users: ", connectedUsers);
};

export const getActiveConnections = (userId: string) => {
    let activeConnections = <string[]>[];
    connectedUsers.forEach(function (value, key) {
        if (value.userId === userId) {
            activeConnections.push(key);
        }
    });

    return activeConnections;
};

export const getOnlineUsers = () => {
    const onlineUsers = <{ socketId: string; userId: string }[]>[];
    connectedUsers.forEach(function (value, key) {
        onlineUsers.push({ socketId: key, userId: value.userId });
    });

    return onlineUsers;
};

// rooms
export const addNewActiveRoom = (
    userId: string,
    socketId: string,
    {
        conversation_id,
        conversation_participants,
        isGroup,
    }: {
        conversation_id: string;
        conversation_participants: string[];
        isGroup: boolean;
    }
) => {
    const newActiveRoom = {
        roomCreator: {
            userId,
            socketId,
        },
        participants: [
            {
                userId,
                socketId,
            },
        ],
        roomid: uuid(),
        conversation_id,
        conversation_participants,
        isGroup,
    };

    activeRooms = [...activeRooms, newActiveRoom];

    return newActiveRoom;
};

export const getActiveRooms = () => {
    return [...activeRooms];
};

export const getActiveRoom = (roomId: string) => {
    const activeRoom = activeRooms.find((room) => room.roomid === roomId);

    if (!activeRoom) return null;
    return { ...activeRoom };
};

// get active room whose conversation_participants array contains the userId
export const getActiveRoomByUserId = (userId: string) => {
    const activeRoom = activeRooms.find((room) =>
        room.conversation_participants.includes(userId)
    );

    if (!activeRoom) return null;
    return { ...activeRoom };
};

// function to ignore a group call from user
export const ignoreCall = (roomId: string, userId: string) => {
    const room = getActiveRoom(roomId);
    if (!room) return;

    const updatedRoom = {
        ...room,
        ignoredBy: [...(room.ignoredBy || []), userId],
    };

    activeRooms = activeRooms.filter((room) => room.roomid !== roomId);
    activeRooms = [...activeRooms, updatedRoom];
};

export const joinActiveRoom = (
    roomId: string,
    newParticipant: { userId: string; socketId: string }
) => {
    const room = activeRooms.find((room) => room.roomid === roomId);
    console.log("room: ", room);
    if (!room) return;

    activeRooms = activeRooms.filter((room) => room.roomid !== roomId);

    const updatedRoom = {
        ...room,
        participants: [...room.participants, newParticipant],
    };

    activeRooms = [...activeRooms, updatedRoom];
    console.log("new active rooms: ", activeRooms);
};

export const leaveActiveRoom = (
    roomId: string,
    participantSocketId: string
) => {
    const activeRoom = activeRooms.find((room) => room.roomid === roomId);

    if (!activeRoom) return;

    const copyOfActiveRoom = { ...activeRoom };
    const isGroup = copyOfActiveRoom.isGroup;

    copyOfActiveRoom.participants = copyOfActiveRoom.participants.filter(
        (participant) => participant.socketId !== participantSocketId
    );

    activeRooms = activeRooms.filter((room) => room.roomid !== roomId);

    if (copyOfActiveRoom.participants.length > 0 && isGroup) {
        console.log(
            "room still has participants, so updating the room instead of deleting it"
        );
        activeRooms = [...activeRooms, copyOfActiveRoom];
    }

    console.log("new active rooms: ", activeRooms);
};

// typing status
// each conversation has a list of userIds of users who are typing

const typingUsers = new Map<string, string[]>();

export const getTypingUsers = (conversation_id: string) => {
    return typingUsers.get(conversation_id) || [];
};

export const setTypingUsers = (conversation_id: string, userIds: string[]) => {
    typingUsers.set(conversation_id, userIds);
};
