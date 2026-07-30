import {
    CreateCommentInput,
    CreateFeedbackInput,
    FeedbackCategory,
    FeedbackCursorPayload,
    FeedbackListQuery,
    FeedbackResponse,
    FeedbackSortOption,
    FeedbackStatus,
    NestedComment,
    PaginatedFeedbackResponse,
    UpdateFeedbackInput,
} from "../models";
import { CommentRepository } from "../repositories/commentRepository";
import { FeedbackRepository } from "../repositories/feedbackRepository";
import { VoteRepository } from "../repositories/voteRepository";

const ALLOWED_CATEGORIES = new Set<FeedbackCategory>([
    "ui",
    "ux",
    "enhancement",
    "bug",
    "feature",
]);

const ALLOWED_STATUSES = new Set<FeedbackStatus>([
    "suggestion",
    "planned",
    "progress",
    "live",
]);

const ALLOWED_SORTS = new Set<FeedbackSortOption>([
    "mostUpvotes",
    "leastUpvotes",
    "mostComments",
    "leastComments",
]);

const DEFAULT_PAGE_LIMIT = 8;
const MAX_PAGE_LIMIT = 50;

function toIsoString(value: Date | string): string {
    if (value instanceof Date) {
        return value.toISOString();
    }

    return new Date(value).toISOString();
}

function encodeCursor(payload: FeedbackCursorPayload): string {
    return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodeCursor(cursor: string): FeedbackCursorPayload | null {
    try {
        const parsed = JSON.parse(
            Buffer.from(cursor, "base64url").toString("utf8"),
        ) as Partial<FeedbackCursorPayload>;

        if (
            typeof parsed.id !== "string" ||
            typeof parsed.upvotes !== "number" ||
            typeof parsed.comments !== "number" ||
            typeof parsed.sort !== "string" ||
            !ALLOWED_SORTS.has(parsed.sort)
        ) {
            return null;
        }

        return {
            id: parsed.id,
            upvotes: parsed.upvotes,
            comments: parsed.comments,
            sort: parsed.sort,
        };
    } catch {
        return null;
    }
}

export class FeedbackService {
    static isValidCategory(value: string): value is FeedbackCategory {
        return ALLOWED_CATEGORIES.has(value as FeedbackCategory);
    }

    static isValidStatus(value: string): value is FeedbackStatus {
        return ALLOWED_STATUSES.has(value as FeedbackStatus);
    }

    static isValidSort(value: string): value is FeedbackSortOption {
        return ALLOWED_SORTS.has(value as FeedbackSortOption);
    }

    static async getAllFeedback(userId?: string): Promise<FeedbackResponse[]> {
        const [feedbackItems, commentCounts] = await Promise.all([
            FeedbackRepository.findAllWithVotes(),
            FeedbackRepository.getCommentCounts(),
        ]);

        return feedbackItems.map((item) => ({
            id: item.id,
            user_id: item.user_id,
            inserted_at: toIsoString(item.inserted_at),
            updated_at: toIsoString(item.updated_at),
            title: item.title,
            category: item.category,
            comments: commentCounts[item.id] ?? 0,
            status: item.status,
            upvotes: item.upvotes,
            votes: item.votes,
            detail: item.detail,
            upvotedByUser: userId
                ? item.votes.some((vote) => vote.user_id === userId)
                : false,
            order: item.order,
        }));
    }

    static async getPaginatedFeedback(
        query: FeedbackListQuery,
        userId?: string,
    ): Promise<PaginatedFeedbackResponse> {
        const sort = query.sort ?? "mostUpvotes";
        const limit = Math.min(
            Math.max(query.limit ?? DEFAULT_PAGE_LIMIT, 1),
            MAX_PAGE_LIMIT,
        );
        const category = query.category ?? "all";
        const decodedCursor = query.cursor ? decodeCursor(query.cursor) : null;

        if (query.cursor && !decodedCursor) {
            throw new Error("INVALID_CURSOR");
        }

        if (decodedCursor && decodedCursor.sort !== sort) {
            throw new Error("INVALID_CURSOR");
        }

        const [feedbackItems, total, statusCounts] = await Promise.all([
            FeedbackRepository.findPaginatedWithVotes({
                limit,
                sort,
                category,
                status: query.status,
                cursor: decodedCursor,
            }),
            FeedbackRepository.countFiltered({
                category,
                status: query.status,
            }),
            FeedbackRepository.getStatusCounts(),
        ]);

        const hasMore = feedbackItems.length > limit;
        const pageItems = hasMore
            ? feedbackItems.slice(0, limit)
            : feedbackItems;
        const lastItem = pageItems[pageItems.length - 1];

        const nextCursor =
            hasMore && lastItem
                ? encodeCursor({
                      id: lastItem.id,
                      upvotes: lastItem.upvotes,
                      comments: lastItem.comment_count,
                      sort,
                  })
                : null;

        return {
            data: pageItems.map((item) => ({
                id: item.id,
                user_id: item.user_id,
                inserted_at: toIsoString(item.inserted_at),
                updated_at: toIsoString(item.updated_at),
                title: item.title,
                category: item.category,
                comments: item.comment_count,
                status: item.status,
                upvotes: item.upvotes,
                votes: item.votes,
                detail: item.detail,
                upvotedByUser: userId
                    ? item.votes.some((vote) => vote.user_id === userId)
                    : false,
                order: item.order,
            })),
            nextCursor,
            hasMore,
            total,
            statusCounts,
        };
    }

    static async getSingleFeedback(
        feedbackId: string,
        userId?: string,
    ): Promise<FeedbackResponse | null> {
        const item = await FeedbackRepository.findByIdWithVotes(feedbackId);

        if (!item) {
            return null;
        }

        const commentCounts = await FeedbackRepository.getCommentCounts();

        return {
            id: item.id,
            user_id: item.user_id,
            inserted_at: toIsoString(item.inserted_at),
            updated_at: toIsoString(item.updated_at),
            title: item.title,
            category: item.category,
            comments: commentCounts[item.id] ?? 0,
            status: item.status,
            upvotes: item.upvotes,
            votes: item.votes,
            detail: item.detail,
            upvotedByUser: userId
                ? item.votes.some((vote) => vote.user_id === userId)
                : false,
            order: item.order,
            current_user_id: userId,
        };
    }

    static async createFeedback(input: CreateFeedbackInput) {
        return FeedbackRepository.create(input);
    }

    static async updateFeedback(input: UpdateFeedbackInput) {
        return FeedbackRepository.update(input);
    }

    static async deleteFeedback(feedbackId: string) {
        return FeedbackRepository.delete(feedbackId);
    }

    static async toggleVote(feedbackId: string, userId: string) {
        const existing = await FeedbackRepository.findByIdWithVotes(feedbackId);

        if (!existing) {
            return null;
        }

        return VoteRepository.toggle(feedbackId, userId);
    }
}

export class CommentService {
    static async getComments(feedbackId: string): Promise<NestedComment[]> {
        const rows = await CommentRepository.findByFeedbackId(feedbackId);

        const comments: NestedComment[] = rows.map((row) => ({
            id: row.id,
            feedback_id: row.feedback_id,
            user_id: row.user_id,
            parent_comment_id: row.parent_comment_id,
            content: row.content,
            inserted_at: toIsoString(row.inserted_at),
            profiles: {
                username: row.username,
                full_name: row.full_name,
                avatar_url: row.avatar_url,
            },
            replies: [],
        }));

        const commentMap: Record<string, NestedComment> = {};

        for (const comment of comments) {
            commentMap[comment.id] = comment;
        }

        for (const comment of comments) {
            if (!comment.parent_comment_id) {
                continue;
            }

            const parent = commentMap[comment.parent_comment_id];

            if (!parent) {
                continue;
            }

            parent.replies.push(comment);
        }

        return comments.filter((comment) => !comment.parent_comment_id);
    }

    static async createComment(input: CreateCommentInput) {
        return CommentRepository.create(input);
    }
}
