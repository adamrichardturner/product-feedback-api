import { pool } from "../config/database";
import { ProfileRecord, UserRecord } from "../models";

export class UserRepository {
    static async findByEmail(email: string): Promise<UserRecord | null> {
        const result = await pool.query<UserRecord>(
            "SELECT id, email, password_hash, created_at FROM users WHERE email = $1",
            [email],
        );

        return result.rows[0] ?? null;
    }

    static async findById(id: string): Promise<UserRecord | null> {
        const result = await pool.query<UserRecord>(
            "SELECT id, email, password_hash, created_at FROM users WHERE id = $1",
            [id],
        );

        return result.rows[0] ?? null;
    }

    static async create(
        email: string,
        passwordHash: string,
    ): Promise<UserRecord> {
        const result = await pool.query<UserRecord>(
            `INSERT INTO users (email, password_hash)
             VALUES ($1, $2)
             RETURNING id, email, password_hash, created_at`,
            [email, passwordHash],
        );

        return result.rows[0];
    }

    static async getProfile(userId: string): Promise<ProfileRecord | null> {
        const result = await pool.query<ProfileRecord>(
            `SELECT id, username, full_name, avatar_url, website, updated_at
             FROM profiles
             WHERE id = $1`,
            [userId],
        );

        return result.rows[0] ?? null;
    }

    static async createProfile(
        userId: string,
        username: string,
        fullName: string,
        avatarUrl: string | null,
        website: string | null = null,
    ): Promise<ProfileRecord> {
        const result = await pool.query<ProfileRecord>(
            `INSERT INTO profiles (id, username, full_name, avatar_url, website)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, username, full_name, avatar_url, website, updated_at`,
            [userId, username, fullName, avatarUrl, website],
        );

        return result.rows[0];
    }
}
