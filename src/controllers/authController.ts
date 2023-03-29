import { z } from "zod";
import asyncRequestHandler from "../utils/asyncRequestHandler.js";
import User from "../models/userModal.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const registerSchema = z.object({
    userName: z.string().min(3).max(12),
    password: z.string().min(6).max(12),
    email: z.string().email(),
});

type RegisterSchema = z.infer<typeof registerSchema>;

export const postRegister = asyncRequestHandler(
    registerSchema,
    async (req, res) => {
        const { userName, email, password } = req.body as RegisterSchema;

        // check if user exists with the email
        const userExists = await User.exists({ email: email.toLowerCase() });
        console.log(userExists);
        if (userExists) {
            res.status(409);
            throw new Error("User already exists");
        }

        // encrypt password
        const encryptedPassword = await bcrypt.hash(password, 10);

        // create user document and save in database
        const user = await User.create({
            userName,
            email: email.toLowerCase(),
            password: encryptedPassword,
        });

        if (!user) {
            res.status(500);
            throw new Error("Something went wrong");
        }

        // create JWT token and send it to the client
        const token = jwt.sign(
            { userId: user._id, email },
            process.env.JWT_SECRET!,
            {
                expiresIn: "1d",
            }
        );

        res.status(201).json({ userDetails: { email, userName, token } });
    }
);

export const postLogin = asyncRequestHandler(
    z.object({
        password: z.string(),
        email: z.string().email(),
    }),
    async (req, res) => {
        const { email, password } = req.body;

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            res.status(404);
            throw new Error("User not found");
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            res.status(401);
            throw new Error("Invalid credentials");
        }

        // create JWT token and send it to the client
        const token = jwt.sign(
            { userId: user._id, email },
            process.env.JWT_SECRET!,
            {
                expiresIn: "1d",
            }
        );

        res.status(200).json({
            userDetails: { email, username: user.userName, token },
        });
    }
);
