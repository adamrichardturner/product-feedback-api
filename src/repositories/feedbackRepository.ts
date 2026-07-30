import { pool } from "../config/database";
import {
    CreateFeedbackInput,
    FeedbackCategory,
    FeedbackCursorPayload,
    FeedbackRecord,
    FeedbackSortOption,
    FeedbackStatus,
    FeedbackStatusCounts,
    FeedbackWithVotes,
    FeedbackWithVotesAndComments,
    UpdateFeedbackInput,
} from "../models";

interface FindPaginatedInput {
    limit: number;
    sort: FeedbackSortOption;
    category?: FeedbackCategory | "all";
    status?: FeedbackStatus;
    cursor?: FeedbackCursorPayload | null;
}

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

    static async findPaginatedWithVotes(
        input: FindPaginatedInput,
    ): Promise<FeedbackWithVotesAndComments[]> {
        const params: Array<string | number> = [];
        const whereClauses: string[] = [];

        if (input.category && input.category !== "all") {
            params.push(input.category);
            whereClauses.push(`f.category = $${params.length}`);
        }

        if (input.status) {
            params.push(input.status);
            whereClauses.push(`f.status = $${params.length}`);
        }

        if (input.cursor) {
            const cursorClause = this.buildCursorClause(
                input.sort,
                input.cursor,
                params,
            );
            whereClauses.push(cursorClause);
        }

        const whereSql =
            whereClauses.length > 0
                ? `WHERE ${whereClauses.join(" AND ")}`
                : "";

        const orderSql = this.buildOrderClause(input.sort);
        params.push(input.limit + 1);
        const limitParam = `$${params.length}`;

        const result = await pool.query<
            FeedbackRecord & { comment_count: string }
        >(
            `SELECT
                f.id,
                f.user_id,
                f.title,
                f.detail,
                f.category,
                f.status,
                f."order",
                f.upvotes,
                f.inserted_at,
                f.updated_at,
                COALESCE(c.comment_count, 0)::text AS comment_count
             FROM feedback f
             LEFT JOIN (
                SELECT feedback_id, COUNT(*)::int AS comment_count
                FROM comments
                GROUP BY feedback_id
             ) c ON c.feedback_id = f.id
             ${whereSql}
             ${orderSql}
             LIMIT ${limitParam}`,
            params,
        );

        const feedbackIds = result.rows.map((row) => row.id);
        const votesByFeedback = await this.getVotesByFeedbackIds(feedbackIds);

        return result.rows.map((row) => ({
            id: row.id,
            user_id: row.user_id,
            title: row.title,
            detail: row.detail,
            category: row.category,
            status: row.status,
            order: row.order,
            upvotes: row.upvotes,
            inserted_at: row.inserted_at,
            updated_at: row.updated_at,
            comment_count: Number.parseInt(row.comment_count, 10),
            votes: votesByFeedback[row.id] ?? [],
        }));
    }

    static async countFiltered(input: {
        category?: FeedbackCategory | "all";
        status?: FeedbackStatus;
    }): Promise<number> {
        const params: string[] = [];
        const whereClauses: string[] = [];

        if (input.category && input.category !== "all") {
            params.push(input.category);
            whereClauses.push(`category = $${params.length}`);
        }

        if (input.status) {
            params.push(input.status);
            whereClauses.push(`status = $${params.length}`);
        }

        const whereSql =
            whereClauses.length > 0
                ? `WHERE ${whereClauses.join(" AND ")}`
                : "";

        const result = await pool.query<{ count: string }>(
            `SELECT COUNT(*)::text AS count FROM feedback ${whereSql}`,
            params,
        );

        return Number.parseInt(result.rows[0]?.count ?? "0", 10);
    }

    static async getStatusCounts(): Promise<FeedbackStatusCounts> {
        const result = await pool.query<{
            status: FeedbackStatus;
            count: string;
        }>(
            `SELECT status, COUNT(*)::text AS count
             FROM feedback
             GROUP BY status`,
        );

        const counts: FeedbackStatusCounts = {
            suggestion: 0,
            planned: 0,
            progress: 0,
            live: 0,
        };

        for (const row of result.rows) {
            counts[row.status] = Number.parseInt(row.count, 10);
        }

        return counts;
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

    private static async getVotesByFeedbackIds(
        feedbackIds: string[],
    ): Promise<Record<string, Array<{ user_id: string }>>> {
        const votesByFeedback: Record<string, Array<{ user_id: string }>> = {};

        if (feedbackIds.length === 0) {
            return votesByFeedback;
        }

        const votesResult = await pool.query<{
            feedback_id: string;
            user_id: string;
        }>(
            "SELECT feedback_id, user_id FROM votes WHERE feedback_id = ANY($1)",
            [feedbackIds],
        );

        for (const vote of votesResult.rows) {
            const existing = votesByFeedback[vote.feedback_id] ?? [];
            existing.push({ user_id: vote.user_id });
            votesByFeedback[vote.feedback_id] = existing;
        }

        return votesByFeedback;
    }

    private static buildOrderClause(sort: FeedbackSortOption): string {
        switch (sort) {
            case "mostUpvotes": {
                return "ORDER BY f.upvotes DESC, f.id DESC";
            }
            case "leastUpvotes": {
                return "ORDER BY f.upvotes ASC, f.id ASC";
            }
            case "mostComments": {
                return "ORDER BY comment_count DESC, f.id DESC";
            }
            case "leastComments": {
                return "ORDER BY comment_count ASC, f.id ASC";
            }
            default: {
                return "ORDER BY f.upvotes DESC, f.id DESC";
            }
        }
    }

    private static buildCursorClause(
        sort: FeedbackSortOption,
        cursor: FeedbackCursorPayload,
        params: Array<string | number>,
    ): string {
        switch (sort) {
            case "mostUpvotes": {
                params.push(cursor.upvotes, cursor.id);
                const upvotesParam = `$${params.length - 1}`;
                const idParam = `$${params.length}`;
                return `(f.upvotes < ${upvotesParam} OR (f.upvotes = ${upvotesParam} AND f.id < ${idParam}))`;
            }
            case "leastUpvotes": {
                params.push(cursor.upvotes, cursor.id);
                const upvotesParam = `$${params.length - 1}`;
                const idParam = `$${params.length}`;
                return `(f.upvotes > ${upvotesParam} OR (f.upvotes = ${upvotesParam} AND f.id > ${idParam}))`;
            }
            case "mostComments": {
                params.push(cursor.comments, cursor.id);
                const commentsParam = `$${params.length - 1}`;
                const idParam = `$${params.length}`;
                return `(COALESCE(c.comment_count, 0) < ${commentsParam} OR (COALESCE(c.comment_count, 0) = ${commentsParam} AND f.id < ${idParam}))`;
            }
            case "leastComments": {
                params.push(cursor.comments, cursor.id);
                const commentsParam = `$${params.length - 1}`;
                const idParam = `$${params.length}`;
                return `(COALESCE(c.comment_count, 0) > ${commentsParam} OR (COALESCE(c.comment_count, 0) = ${commentsParam} AND f.id > ${idParam}))`;
            }
            default: {
                params.push(cursor.upvotes, cursor.id);
                const upvotesParam = `$${params.length - 1}`;
                const idParam = `$${params.length}`;
                return `(f.upvotes < ${upvotesParam} OR (f.upvotes = ${upvotesParam} AND f.id < ${idParam}))`;
            }
        }
    }
}
