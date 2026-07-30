import { pool } from "../config/database";
import {
    CreateFeedbackInput,
    FeedbackRecord,
    FeedbackWithVotes,
    UpdateFeedbackInput,
} from "../models";

export class FeedbackRepository {
    static async findAllWithVotes(): Promise<FeedbackWithVotes[]> {
        const result = await pool.query<FeedbackRecord>(
            `SELECT id, user_id, title, detail, category, status, "order", upvotes, inserted_at, updated_at
             FROM feedback
             ORDER BY inserted_at DESC`,
        );

        const votesResult = await pool.query<{
            feedback_id: string;
            user_id: string;
        }>("SELECT feedback_id, user_id FROM votes");

        const votesByFeedback: Record<string, Array<{ user_id: string }>> = {};

        for (const vote of votesResult.rows) {
            const existing = votesByFeedback[vote.feedback_id] ?? [];
            existing.push({ user_id: vote.user_id });
            votesByFeedback[vote.feedback_id] = existing;
        }

        return result.rows.map((row) => ({
            ...row,
            votes: votesByFeedback[row.id] ?? [],
        }));
    }

    static async findByIdWithVotes(
        feedbackId: string,
    ): Promise<FeedbackWithVotes | null> {
        const result = await pool.query<FeedbackRecord>(
            `SELECT id, user_id, title, detail, category, status, "order", upvotes, inserted_at, updated_at
             FROM feedback
             WHERE id = $1`,
            [feedbackId],
        );

        const feedback = result.rows[0];

        if (!feedback) {
            return null;
        }

        const votesResult = await pool.query<{ user_id: string }>(
            "SELECT user_id FROM votes WHERE feedback_id = $1",
            [feedbackId],
        );

        return {
            ...feedback,
            votes: votesResult.rows,
        };
    }

    static async getCommentCounts(): Promise<Record<string, number>> {
        const result = await pool.query<{
            feedback_id: string;
            count: string;
        }>(
            `SELECT feedback_id, COUNT(*)::text AS count
             FROM comments
             GROUP BY feedback_id`,
        );

        const counts: Record<string, number> = {};

        for (const row of result.rows) {
            counts[row.feedback_id] = Number.parseInt(row.count, 10);
        }

        return counts;
    }

    static async create(input: CreateFeedbackInput): Promise<FeedbackRecord> {
        const result = await pool.query<FeedbackRecord>(
            `INSERT INTO feedback (user_id, title, category, detail)
             VALUES ($1, $2, $3, $4)
             RETURNING id, user_id, title, detail, category, status, "order", upvotes, inserted_at, updated_at`,
            [input.userId, input.title, input.category, input.detail],
        );

        return result.rows[0];
    }

    static async update(
        input: UpdateFeedbackInput,
    ): Promise<FeedbackRecord | null> {
        const result = await pool.query<FeedbackRecord>(
            `UPDATE feedback
             SET title = $1,
                 detail = $2,
                 category = $3,
                 status = $4,
                 "order" = $5
             WHERE id = $6
             RETURNING id, user_id, title, detail, category, status, "order", upvotes, inserted_at, updated_at`,
            [
                input.title,
                input.detail,
                input.category,
                input.status,
                input.order,
                input.id,
            ],
        );

        return result.rows[0] ?? null;
    }

    static async delete(feedbackId: string): Promise<FeedbackRecord | null> {
        const client = await pool.connect();

        try {
            await client.query("BEGIN");

            await client.query("DELETE FROM votes WHERE feedback_id = $1", [
                feedbackId,
            ]);

            const result = await client.query<FeedbackRecord>(
                `DELETE FROM feedback
                 WHERE id = $1
                 RETURNING id, user_id, title, detail, category, status, "order", upvotes, inserted_at, updated_at`,
                [feedbackId],
            );

            await client.query("COMMIT");

            return result.rows[0] ?? null;
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }
}
