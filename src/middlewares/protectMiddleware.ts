import jwt from "jsonwebtoken";
import asyncRequestHandler from "../utils/asyncRequestHandler.js";

const config = process.env;

export type JwtDecoded = { _id: string; email: string };

const protect = asyncRequestHandler(null, async (req, res, next) => {
    let token: string;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        try {
            token = req.headers.authorization.split(" ")[1];

            const decoded = jwt.verify(token, config.JWT_SECRET!);

            req.user = decoded as JwtDecoded;
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
