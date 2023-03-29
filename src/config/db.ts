import mongoose from "mongoose";
import { ensureError } from "../utils/other.js";

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI!);

        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error: unknown) {
        console.log("Database connection failed");
        const e = ensureError(error);
        console.error(`Error: ${e.message}`);
        process.exit(1);
    }
};

export default connectDB;
