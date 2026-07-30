import { AuthUser } from "../models";

declare module "express-serve-static-core" {
    interface Request {
        user?: AuthUser;
    }
}

export {};
