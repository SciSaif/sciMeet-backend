import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import friendInvitationRoutes from "./routes/friendInvitationRoutes.js";
import groupRoutes from "./routes/groupRoutes.js";
import botRoutes from "./routes/botRoutes.js";
import errorHandler from "./middlewares/errorMiddleware.js";
import { registerSocketServer } from "./socketServer.js";
dotenv.config();
connectDB();

const PORT = process.env.PORT || process.env.API_PORT;

const app = express();
app.use(express.json());
app.use(cors());

app.get("/health", (req, res) => {
    res.send("Server is running!");
});

app.use("/auth", authRoutes);
app.use("/friend-invitation", friendInvitationRoutes);
app.use("/groups", groupRoutes);
app.use("/bots", botRoutes);

const server = http.createServer(app);
registerSocketServer(server);

app.use(errorHandler);

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}!`);
});
