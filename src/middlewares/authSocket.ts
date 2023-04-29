import jwt from "jsonwebtoken";
import { SocketType } from "../socketServer.js";
import { JwtDecoded } from "./protectMiddleware.js";
const config = process.env;

const verifyTokenSocket = (socket: SocketType, next: (err?: Error) => void) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        return next(new Error("Authentication error"));
    }
    try {
        const decoded = jwt.verify(token, config.JWT_SECRET!);
        socket.data.user = decoded as JwtDecoded;
        next();
    } catch (err) {
        return next(new Error("Authentication error"));
    }
};

export default verifyTokenSocket;
