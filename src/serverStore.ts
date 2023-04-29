import { ServerType } from "./socketServer.js";

const connectedUsers = new Map<string, { userId: string }>();

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
