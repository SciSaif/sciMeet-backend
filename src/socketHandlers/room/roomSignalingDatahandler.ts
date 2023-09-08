import { SocketType } from "../../socketServer.js";

export const roomSignalingDataHandler = (socket: SocketType, data: any) => {
    const { connUserSocketId, signal } = data;

    const signalingData = { signal, connUserSocketId: socket.id };
    socket.to(connUserSocketId).emit("conn-signal", signalingData);
};
