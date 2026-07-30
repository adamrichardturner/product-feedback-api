import { pool } from "../config/database";
import {
    CommentRecord,
    CommentWithProfile,
    CreateCommentInput,
} from "../models";

export class CommentRepository {
    static async findByFeedbackId(
        feedbackId: string,
    ): Promise<CommentWithProfile[]> {
        const result = await pool.query<CommentWithProfile>(
            `SELECT
                c.id,
                c.feedback_id,
                c.user_id,
                c.parent_comment_id,
                c.content,
                c.inserted_at,
                p.username,
                p.full_name,
                p.avatar_url
             FROM comments c
             LEFT JOIN profiles p ON p.id = c.user_id
             WHERE c.feedback_id = $1
             ORDER BY c.inserted_at ASC`,
            [feedbackId],
        );

        return result.rows;
    }

    static async create(input: CreateCommentInput): Promise<CommentRecord> {
        const result = await pool.query<CommentRecord>(
            `INSERT INTO comments (feedback_id, user_id, content, parent_comment_id)
             VALUES ($1, $2, $3, $4)
             RETURNING id, feedback_id, user_id, parent_comment_id, content, inserted_at`,
            [
                input.feedbackId,
                input.userId,
                input.content,
                input.parentCommentId,
            ],
        );

        return result.rows[0];
    }
}
