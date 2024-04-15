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
import {
    ignoreCallHandler,
    rejectCallHandler,
    roomLeavehandler,
} from "./socketHandlers/room/roomLeaveHandler.js";
import { roomInitializeConnectionHandler } from "./socketHandlers/room/roomInitializeConnectionHandler.js";
import { roomSignalingDataHandler } from "./socketHandlers/room/roomSignalingDatahandler.js";
import {
    MessageType,
    directMessageHandler,
} from "./socketHandlers/chat/directMessageHandler.js";
import {
    TypingStatusProps,
    updateLastSeen,
    updateTypingUsers,
} from "./socketHandlers/updates/chat.js";

export type ConnUserSocketIdType = {
    connUserSocketId: string;
    isGroup?: boolean;
};

interface ServerToClientEvents {
    "friends-invitations": (a: { pendingInvitations: any }) => void;
    "friends-list": (a: { friends: any }) => void;
    "online-users": (a: { onlineUsers: any }) => void;
    "direct-chat-history": (a: any) => void;
    "direct-message": (a: { conversation_id: string; message: any }) => void;
    "typing-status": (a: {
        conversation_id: string;
        typingUsers: string[];
    }) => void;
    "seen-messages": (a: { conversation_id: string; userId: string }) => void;
    conversations: (a: any) => void;
    "groups-list": (a: any) => void;
    "new-group": (a: any) => void;
    "group-deleted": (a: any) => void;
    "group-updated": (a: any) => void;
    // --------------------------------------------------------------------------
    "bots-list": (a: any) => void;
    "new-bot": (a: any) => void;
    "bot-deleted": (a: any) => void;
    "bot-updated": (a: any) => void;

    // --------------------------------------------------------------------------
    "room-create": (a: { roomDetails: ActiveRoom }) => void;
    "active-rooms": (a: { activeRooms: ActiveRoom[] }) => void;
    "call-rejected": (a: { roomid: string }) => void;
    "conn-prepare": (a: ConnUserSocketIdType) => void;
    "conn-init": (a: ConnUserSocketIdType) => void;
    "conn-signal": (a: any) => void;
    "room-participant-left": (a: ConnUserSocketIdType) => void;
}

interface ClientToServerEvents {
    "direct-message": (data: MessageType) => void;
    "direct-chat-history": (a: {
        conversation_id: string;
        fromMessageId?: string;
    }) => void;
    "typing-status": (data: TypingStatusProps) => void;
    "seen-messages": (data: { conversation_id: string }) => void;

    // --------------------------------------------------------------------------

    // --------------------------------------------------------------------------
    "room-create": (a: {
        conversation_id: string;
        conversation_participants: string[];
        isGroup: boolean;
    }) => void;
    "join-room": (a: { roomid: string }) => void;
    "leave-room": (a: { roomid: string }) => void;
    "reject-call": (a: { roomid: string }) => void;
    "ignore-call": (a: { roomid: string }) => void;
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
        // allow max 10mb file
        maxHttpBufferSize: 1e7,
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
        // group related events

        // ----------------------------------------------------------------------------
        // chat related events

        socket.on("direct-message", (data) => {
            console.log(data);
            directMessageHandler(socket, data);
        });

        socket.on("direct-chat-history", (data) => {
            directChatHistoryHandler(
                socket,
                data.conversation_id,
                data.fromMessageId
            );
        });

        socket.on("typing-status", (data) => {
            // console.log("typing-status", data);
            updateTypingUsers(socket, data);
        });

        socket.on("seen-messages", (data) => {
            // console.log("seen-messages", data);
            updateLastSeen(socket, data.conversation_id);
        });

        // ----------------------------------------------------------------------------
        // room related events

        socket.on("room-create", (data) => {
            roomCreateHandler(socket, data);
        });

        socket.on("join-room", (data) => {
            // console.log("join room");
            roomJoinHandler(socket, data);
        });

        socket.on("leave-room", (data) => {
            console.log("leave room");
            roomLeavehandler(socket, data);
        });

        socket.on("reject-call", (data) => {
            console.log("reject call");
            rejectCallHandler(socket, data);
        });

        socket.on("ignore-call", (data) => {
            console.log("ignore call");
            ignoreCallHandler(socket, data);
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

    setInterval(() => {
        emitOnlineUsers();
    }, 1000 * 8);
};
