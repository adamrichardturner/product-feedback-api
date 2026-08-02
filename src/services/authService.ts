import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { AuthUser } from "../models";
import { UserRepository } from "../repositories/userRepository";

const TOKEN_EXPIRES_IN = "24h";

function getJwtSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET is not configured");
    }
    return secret;
}

function isAuthTokenPayload(value: unknown): value is AuthUser {
    if (typeof value !== "object" || value === null) {
        return false;
    }

    if (!("id" in value) || !("email" in value)) {
        return false;
    }

    return typeof value.id === "string" && typeof value.email === "string";
}

function signAuthToken(payload: AuthUser): string {
    return jwt.sign(payload, getJwtSecret(), {
        expiresIn: TOKEN_EXPIRES_IN,
    });
}

export class AuthService {
    static async demoLogin(): Promise<{
        token: string;
        user: {
            id: string;
            email: string;
            aud: string;
        };
    } | null> {
        const email = process.env.DEMO_EMAIL;
        const password = process.env.DEMO_PASSWORD;

        if (!email || !password) {
            throw new Error("Demo credentials not configured");
        }

        const user = await UserRepository.findByEmail(email);

        if (!user) {
            return null;
        }

        const isValidPassword = await bcrypt.compare(
            password,
            user.password_hash,
        );

        if (!isValidPassword) {
            return null;
        }

        const token = signAuthToken({ id: user.id, email: user.email });

        return {
            token,
            user: {
                id: user.id,
                email: user.email,
                aud: "authenticated",
            },
        };
    }

    static refreshToken(token: string): string | null {
        try {
            const decoded = jwt.verify(token, getJwtSecret());

            if (!isAuthTokenPayload(decoded)) {
                return null;
            }

            return signAuthToken({
                id: decoded.id,
                email: decoded.email,
            });
        } catch {
            return null;
        }
    }

    static async getCurrentProfile(userId: string) {
        return UserRepository.getProfile(userId);
    }
}
