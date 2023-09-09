// registering socket.io
import { Server, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import authSocket from "./middlewares/authSocket.js";
import { newConnectionHandler } from "./socketHandlers/newConnectionHandler.js";
import { disconnectHandler } from "./socketHandlers/disconnectHandler.js";
import { JwtDecoded } from "./middlewares/protectMiddleware.js";
import {
    ActiveRoom,
    getOnlineUsers,
    setSocketServerInstance,
} from "./serverStore.js";
import { directChatHistoryHandler } from "./socketHandlers/chat/directChatHistoryHandler.js";
import { roomCreateHandler } from "./socketHandlers/room/roomCreateHandler.js";
import { roomJoinHandler } from "./socketHandlers/room/roomJoinHandler.js";
import { roomLeavehandler } from "./socketHandlers/room/roomLeaveHandler.js";
import { roomInitializeConnectionHandler } from "./socketHandlers/room/roomInitializeConnectionHandler.js";
import { roomSignalingDataHandler } from "./socketHandlers/room/roomSignalingDatahandler.js";
import { directMessageHandler } from "./socketHandlers/chat/directMessageHandler.js";
import {
    TypingStatusProps,
    updateTypingUsers,
} from "./socketHandlers/updates/chat.js";

export type ConnUserSocketIdType = {
    connUserSocketId: string;
};

interface ServerToClientEvents {
    "friends-invitations": (a: { pendingInvitations: any }) => void;
    "friends-list": (a: { friends: any }) => void;
    "online-users": (a: { onlineUsers: any }) => void;
    "direct-chat-history": (a: any) => void;
    "direct-message": (a: { conversationId: string; message: any }) => void;
    "typing-status": (a: {
        conversationId: string;
        typingUsers: string[];
    }) => void;

    // --------------------------------------------------------------------------
    "room-create": (a: { roomDetails: ActiveRoom }) => void;
    "active-rooms": (a: { activeRooms: ActiveRoom[] }) => void;
    "conn-prepare": (a: ConnUserSocketIdType) => void;
    "conn-init": (a: ConnUserSocketIdType) => void;
    "conn-signal": (a: any) => void;
    "room-participant-left": (a: ConnUserSocketIdType) => void;
}

interface ClientToServerEvents {
    "direct-message": (data: any) => void;
    "direct-chat-history": (a: {
        friend_id: string;
        fromMessageId?: string;
    }) => void;
    "typing-status": (data: TypingStatusProps) => void;

    // --------------------------------------------------------------------------
    "room-create": () => void;
    "join-room": (a: { roomid: string }) => void;
    "leave-room": (a: { roomid: string }) => void;
    "conn-init": (a: ConnUserSocketIdType) => void;
    "conn-signal": (a: any) => void;
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

        // ----------------------------------------------------------------------------
        // chat related evetns

        socket.on("direct-message", (data) => {
            directMessageHandler(socket, data);
        });

        socket.on("direct-chat-history", (data) => {
            directChatHistoryHandler(
                socket,
                data.friend_id,
                data.fromMessageId
            );
        });

        socket.on("typing-status", (data) => {
            // console.log("typing-status", data);
            updateTypingUsers(socket, data);
        });

        // ----------------------------------------------------------------------------
        // room related events

        socket.on("room-create", () => {
            roomCreateHandler(socket);
        });

        socket.on("join-room", (data) => {
            console.log("join room");
            roomJoinHandler(socket, data);
        });

        socket.on("leave-room", (data) => {
            console.log("leave room");
            roomLeavehandler(socket, data);
        });

        socket.on("conn-init", (data) => {
            roomInitializeConnectionHandler(socket, data);
        });

        socket.on("conn-signal", (data) => {
            roomSignalingDataHandler(socket, data);
        });

        // ----------------------------------------------------------------------------

        socket.on("disconnect", () => {
            console.log("disconnected");
            disconnectHandler(socket);
        });
    });

    // setInterval(() => {
    //     emitOnlineUsers();
    // }, 1000 * 8);
};
