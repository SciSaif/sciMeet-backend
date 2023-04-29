// registering socket.io
import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import authSocket from "./middlewares/authSocket.js";
import { newConnectionHandler } from "./socketHandlers/newConnectionHandler.js";
import { disconnectHandler } from "./socketHandlers/disconnectHandler.js";
import { JwtDecoded } from "./middlewares/protectMiddleware.js";
import { getOnlineUsers, setSocketServerInstance } from "./serverStore.js";

interface ServerToClientEvents {
    noArg: () => void;
    basicEmit: (a: number, b: string, c: Buffer) => void;
    withAck: (d: string, callback: (e: number) => void) => void;
    "friends-invitations": (a: { pendingInvitations: any }) => void;
    "friends-list": (a: { friends: any }) => void;
    "online-users": (a: { onlineUsers: any }) => void;
}

interface ClientToServerEvents {
    hello: () => void;
}

interface InterServerEvents {
    ping: () => void;
}

interface SocketData {
    user: JwtDecoded;
}

export type SocketType = Socket<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
>;

export type ServerType = Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
>;

export const registerSocketServer = (server: HttpServer) => {
    const io = new Server<
        ClientToServerEvents,
        ServerToClientEvents,
        InterServerEvents,
        SocketData
    >(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            // allowedHeaders: ["my-custom-header"],
            credentials: true,
        },
    });

    setSocketServerInstance(io);

    // socket middleware to authenticate user
    io.use((socket, next) => {
        authSocket(socket, next);
    });

    const emitOnlineUsers = () => {
        const onlineUsers = getOnlineUsers();
        io.emit("online-users", { onlineUsers });
    };

    io.on("connection", (socket) => {
        console.log("connected");
        console.log(socket.id);

        newConnectionHandler(socket, io);
        emitOnlineUsers();

        socket.on("disconnect", () => {
            console.log("disconnected");
            disconnectHandler(socket);
        });
    });

    setInterval(() => {
        emitOnlineUsers();
    }, 1000 * 8);
};
