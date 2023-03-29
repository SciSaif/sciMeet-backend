import jwt from "jsonwebtoken";
import asyncRequestHandler from "../utils/asyncRequestHandler.js";
import { z } from "zod";

const config = process.env;

const protect = asyncRequestHandler(null, async (req, res, next) => {
    let token: string;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        try {
            token = req.headers.authorization.split(" ")[1];

            const decoded = jwt.verify(token, config.JWT_SECRET!);

            console.log(decoded);

            req.user = decoded;
        } catch (error) {
            console.error(error);
            res.status(401);
            throw new Error("Not authorized, token failed");
        }
    } else {
        res.status(401);
        throw new Error("Not authorized, no token");
    }

    return next();
});

export default protect;
