import { z } from "zod";
import asyncRequestHandler from "../utils/asyncRequestHandler.js";
import User from "../models/userModal.js";
import jwt from "jsonwebtoken";
import admin from "../config/firebase-config.js";

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

        console.log("verified user", verifiedUser);

        const email = verifiedUser.email as string;
        const uid = verifiedUser.uid as string;

        // check if user exists with the email
        let user = await User.exists({ email: email.toLowerCase() });
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

        res.status(statusCode).json({ token, email, _id: user._id });
    } else {
        console.log("no token");
        res.status(401);
        throw new Error("Not authorized, no token");
    }
});
