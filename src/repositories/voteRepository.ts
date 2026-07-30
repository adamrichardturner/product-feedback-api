import { pool } from "../config/database";

export class VoteRepository {
    static async toggle(
        feedbackId: string,
        userId: string,
    ): Promise<{ toggled: "added" | "removed"; upvotes: number }> {
        const client = await pool.connect();

        try {
            await client.query("BEGIN");

            const existing = await client.query<{ id: string }>(
                `SELECT id FROM votes
                 WHERE feedback_id = $1 AND user_id = $2`,
                [feedbackId, userId],
            );

            let toggled: "added" | "removed";

            if (existing.rows.length > 0) {
                await client.query(
                    "DELETE FROM votes WHERE feedback_id = $1 AND user_id = $2",
                    [feedbackId, userId],
                );
                await client.query(
                    `UPDATE feedback
                     SET upvotes = GREATEST(upvotes - 1, 0)
                     WHERE id = $1`,
                    [feedbackId],
                );
                toggled = "removed";
            } else {
                await client.query(
                    `INSERT INTO votes (feedback_id, user_id)
                     VALUES ($1, $2)`,
                    [feedbackId, userId],
                );
                await client.query(
                    `UPDATE feedback
                     SET upvotes = upvotes + 1
                     WHERE id = $1`,
                    [feedbackId],
                );
                toggled = "added";
            }

            const upvotesResult = await client.query<{ upvotes: number }>(
                "SELECT upvotes FROM feedback WHERE id = $1",
                [feedbackId],
            );

            await client.query("COMMIT");

            return {
                toggled,
                upvotes: upvotesResult.rows[0]?.upvotes ?? 0,
            };
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }
}
