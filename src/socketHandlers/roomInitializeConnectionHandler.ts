import { ConnUserSocketIdType, SocketType } from "../socketServer.js";

export const roomInitializeConnectionHandler = (
    socket: SocketType,
    data: ConnUserSocketIdType
) => {
    // here connUserSocketId is the socket id of the user who sent the request to prepare conn
    const { connUserSocketId } = data;

    const initData = {
        connUserSocketId: socket.id,
    };

    // send our socket id to the user who sent the request to prepare conn
    socket.to(connUserSocketId).emit("conn-init", initData);
};
