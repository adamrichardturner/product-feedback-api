export type FeedbackCategory = "ui" | "ux" | "enhancement" | "bug" | "feature";

export type FeedbackStatus = "suggestion" | "planned" | "progress" | "live";

export interface UserRecord {
    id: string;
    email: string;
    password_hash: string;
    created_at: Date;
}

export interface ProfileRecord {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string | null;
    website: string | null;
    updated_at: Date;
}

export interface FeedbackRecord {
    id: string;
    user_id: string;
    title: string;
    detail: string;
    category: FeedbackCategory;
    status: FeedbackStatus;
    order: number | null;
    upvotes: number;
    inserted_at: Date;
    updated_at: Date;
}

export interface VoteRecord {
    id: string;
    user_id: string;
    feedback_id: string;
    created_at: Date;
}

export interface CommentRecord {
    id: string;
    feedback_id: string;
    user_id: string;
    parent_comment_id: string | null;
    content: string;
    inserted_at: Date;
}

export interface CommentWithProfile extends CommentRecord {
    username: string;
    full_name: string;
    avatar_url: string | null;
}

export interface FeedbackWithVotes extends FeedbackRecord {
    votes: Array<{ user_id: string }>;
}

export interface FeedbackResponse {
    id: string;
    user_id: string;
    inserted_at: string;
    updated_at: string;
    title: string;
    category: FeedbackCategory;
    comments: number;
    status: FeedbackStatus;
    upvotes: number;
    votes?: Array<{ user_id: string }>;
    detail: string;
    upvotedByUser: boolean;
    order: number | null;
    current_user_id?: string;
}

export type FeedbackSortOption =
    "mostUpvotes" | "leastUpvotes" | "mostComments" | "leastComments";

export interface FeedbackListQuery {
    limit?: number;
    cursor?: string;
    sort?: FeedbackSortOption;
    category?: FeedbackCategory | "all";
    status?: FeedbackStatus;
}

export interface FeedbackCursorPayload {
    id: string;
    upvotes: number;
    comments: number;
    sort: FeedbackSortOption;
}

export interface FeedbackStatusCounts {
    suggestion: number;
    planned: number;
    progress: number;
    live: number;
}

export interface PaginatedFeedbackResponse {
    data: FeedbackResponse[];
    nextCursor: string | null;
    hasMore: boolean;
    total: number;
    statusCounts: FeedbackStatusCounts;
}

export interface FeedbackWithVotesAndComments extends FeedbackWithVotes {
    comment_count: number;
}

export interface NestedComment {
    id: string;
    feedback_id: string;
    user_id: string;
    parent_comment_id: string | null;
    content: string;
    inserted_at: string;
    profiles: {
        username: string;
        full_name: string;
        avatar_url: string | null;
    } | null;
    replies: NestedComment[];
}

export interface CreateFeedbackInput {
    userId: string;
    title: string;
    category: FeedbackCategory;
    detail: string;
}

export interface UpdateFeedbackInput {
    id: string;
    title: string;
    detail: string;
    category: FeedbackCategory;
    status: FeedbackStatus;
    order: number | null;
}

export interface CreateCommentInput {
    feedbackId: string;
    userId: string;
    content: string;
    parentCommentId: string | null;
}

export interface AuthUser {
    id: string;
    email: string;
}
