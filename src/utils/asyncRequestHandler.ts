import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { Request, Response, NextFunction } from "express";

// function to handle async/await errors in express routes and also validate the request body
const asyncRequestHandler = <TQuery>(
    schema: z.Schema<TQuery> | null,
    fn: (
        req: Request<any, any, TQuery> & {
            user: { _id: string; email: string };
        },
        res: Response,
        next: NextFunction,
        ...args: any
    ) => void
) => {
    return async function asyncUtilWrap(
        req: Request,
        res: Response,
        next: NextFunction,
        ...args: any
    ) {
        if (schema) {
            try {
                schema.parse(req.body);
            } catch (err: unknown) {
                let error = err instanceof z.ZodError ? fromZodError(err) : err;
                res.status(400);
                return next(error);
            }
        }
        const fnReturn = fn(req as any, res, next, ...args);
        return Promise.resolve(fnReturn)
            .then(async () => {})
            .catch(async (e) => {
                console.log("in catch", e);
                next(e);
            });
    };
};

export default asyncRequestHandler;
