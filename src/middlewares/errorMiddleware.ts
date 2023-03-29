// error handler middleware
import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

const errorHandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    let statusCode = res.statusCode ? res.statusCode : 500;
    if (res.statusCode === 200) {
        statusCode = 500;
    }

    let message = err.message;
    if (err instanceof z.ZodError) {
        message = fromZodError(err).message;
    }

    // console.log("error in middleware: ", err.message, " ", err.stack);
    // console.log(err);
    // log error to data
    console.log(err.stack);
    res.status(statusCode);
    res.json({
        message,
        stack: process.env.NODE_ENV === "production" ? null : err.stack,
    });
};

export default errorHandler;
