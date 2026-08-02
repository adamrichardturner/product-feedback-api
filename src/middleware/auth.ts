import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthUser } from "../models";

function getJwtSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET is not configured");
    }
    return secret;
}

function isAuthUser(value: unknown): value is AuthUser {
    if (typeof value !== "object" || value === null) {
        return false;
    }

    if (!("id" in value) || !("email" in value)) {
        return false;
    }

    return typeof value.id === "string" && typeof value.email === "string";
}

export const auth = (req: Request, res: Response, next: NextFunction) => {
    const tokenCookie = req.cookies.token;
    const token = typeof tokenCookie === "string" ? tokenCookie : undefined;

    if (!token) {
        res.status(401).json({
            error: "You need to be logged in to perform this action",
        });
        return;
    }

    try {
        const decoded = jwt.verify(token, getJwtSecret());

        if (!isAuthUser(decoded)) {
            res.status(401).json({ error: "Token is not valid" });
            return;
        }

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
    const tokenCookie = req.cookies.token;
    const token = typeof tokenCookie === "string" ? tokenCookie : undefined;

    if (!token) {
        next();
        return;
    }

    try {
        const decoded = jwt.verify(token, getJwtSecret());

        if (isAuthUser(decoded)) {
            req.user = decoded;
        }
    } catch {
        // Ignore invalid tokens for optional auth routes.
    }

    next();
};
