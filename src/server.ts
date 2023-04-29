import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import friendInvitationRoutes from "./routes/friendInvitationRoutes.js";
import errorHandler from "./middlewares/errorMiddleware.js";
import { registerSocketServer } from "./socketServer.js";
dotenv.config();
connectDB();

const PORT = process.env.PORT || process.env.API_PORT;

const app = express();
app.use(express.json());
app.use(cors());

app.use("/auth", authRoutes);
app.use("/friend-invitation", friendInvitationRoutes);

const server = http.createServer(app);
registerSocketServer(server);

app.use(errorHandler);

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
