import {
    CreateCommentInput,
    CreateFeedbackInput,
    FeedbackCategory,
    FeedbackResponse,
    FeedbackStatus,
    NestedComment,
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

function toIsoString(value: Date | string): string {
    if (value instanceof Date) {
        return value.toISOString();
    }

    return new Date(value).toISOString();
}

export class FeedbackService {
    static isValidCategory(value: string): value is FeedbackCategory {
        return ALLOWED_CATEGORIES.has(value as FeedbackCategory);
    }

    static isValidStatus(value: string): value is FeedbackStatus {
        return ALLOWED_STATUSES.has(value as FeedbackStatus);
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
