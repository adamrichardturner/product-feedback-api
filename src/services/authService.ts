import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { UserRepository } from "../repositories/userRepository";

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

        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET as string,
            { expiresIn: "24h" },
        );

        return {
            token,
            user: {
                id: user.id,
                email: user.email,
                aud: "authenticated",
            },
        };
    }

    static async getCurrentProfile(userId: string) {
        return UserRepository.getProfile(userId);
    }
}
