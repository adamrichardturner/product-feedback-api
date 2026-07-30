import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthUser } from "../models";

export const auth = (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.cookies.token as string | undefined;

        if (!token) {
            res.status(401).json({
                error: "You need to be logged in to perform this action",
            });
            return;
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET as string,
        ) as AuthUser;

        req.user = decoded;
        next();
    } catch {
        res.status(401).json({ error: "Token is not valid" });
    }
};

export const optionalAuth = (
    req: Request,
    _res: Response,
    next: NextFunction,
) => {
    const token = req.cookies.token as string | undefined;

    if (!token) {
        next();
        return;
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET as string,
        ) as AuthUser;
        req.user = decoded;
    } catch {
        // Ignore invalid tokens for optional auth routes.
    }

    next();
};
