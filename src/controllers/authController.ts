import { z } from "zod";
import asyncRequestHandler from "../utils/asyncRequestHandler.js";
import User from "../models/userModal.js";
import jwt from "jsonwebtoken";
import admin from "../config/firebase-config.js";

// @DESC login user if user exists, create a new user if user doesn't exist
// @ROUTE POST /auth/login
// @ACCESS Public
export const login = asyncRequestHandler(null, async (req, res) => {
    // get the token from the header
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        let token = req.headers.authorization.split(" ")[1];
        const verifiedUser = await admin.auth().verifyIdToken(token);

        if (!verifiedUser) {
            res.status(401);
            throw new Error("unauthorized");
        }

        const email = verifiedUser.email as string;

        console.log("email", email);

        // check if user exists with the email
        let user = await User.findOne({ email: email.toLowerCase() });
        let statusCode = 200;

        // if user doesn't exist, create a new user
        if (!user) {
            user = await User.create({
                email: email.toLowerCase(),
            });

            if (!user) {
                res.status(400);
                throw new Error("Failed to create user");
            }

            console.log("user created", user);
            statusCode = 201; // created
        }

        // create JWT token and send it to the client
        token = jwt.sign({ _id: user._id, email }, process.env.JWT_SECRET!, {
            expiresIn: "30d",
        });
        console.log("user", user);
        console.log("username", user.username);

        res.status(statusCode).json({
            token,
            email,
            _id: user?._id,
            username: user.username,
            newUser: statusCode === 201,
        });
    } else {
        console.log("no token");
        res.status(401);
        throw new Error("Not authorized, no token");
    }
});

// @DESC set username for the user
// @ROUTE POST /auth/setUsername
// @ACCESS Private
export const setUsername = asyncRequestHandler(
    z.object({
        // username should not contain spaces
        username: z
            .string()
            .min(3)
            .max(20)
            .regex(/^[a-zA-Z0-9]+$/, "Username should not contain spaces"),
    }),
    async (req, res) => {
        const { user } = req;
        const { username } = req.body;

        // check if username is already taken
        const userExists = await User.exists({ username });

        if (userExists) {
            res.status(400);
            throw new Error("Username already taken");
        }

        // update the username
        const updatedUser = await User.findByIdAndUpdate(
            user._id,
            { username },
            { new: true }
        );

        if (!updatedUser) {
            res.status(400);
            throw new Error("Failed to update username");
        }

        res.json({ username: updatedUser.username });
    }
);
