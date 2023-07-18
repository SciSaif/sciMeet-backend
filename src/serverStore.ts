import { ServerType } from "./socketServer.js";
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
export const addNewActiveRoom = (userId: string, socketId: string) => {
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
    };

    activeRooms = [...activeRooms, newActiveRoom];

    return newActiveRoom;
};

export const getActiveRooms = () => {
    return [...activeRooms];
};

export const getActiveRoom = (roomId: string) => {
    return activeRooms.find((room) => room.roomid === roomId);
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

    copyOfActiveRoom.participants = copyOfActiveRoom.participants.filter(
        (participant) => participant.socketId !== participantSocketId
    );

    activeRooms = activeRooms.filter((room) => room.roomid !== roomId);

    if (copyOfActiveRoom.participants.length > 0) {
        activeRooms = [...activeRooms, copyOfActiveRoom];
    }
};
