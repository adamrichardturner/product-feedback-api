import { Request, Response } from "express";
import { AuthService } from "../services/authService";
import { CommentService, FeedbackService } from "../services/feedbackService";
import { FeedbackCategory, FeedbackStatus } from "../models";
import { clearAuthCookie, setAuthCookie } from "../utils/authCookies";

export const demoLogin = async (_req: Request, res: Response) => {
    try {
        const result = await AuthService.demoLogin();

        if (!result) {
            res.status(401).json({ error: "Invalid demo credentials" });
            return;
        }

        setAuthCookie(res, result.token);

        res.json({
            message: "Logged in successfully",
            user: result.user,
        });
    } catch (error) {
        console.error("Demo login error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const refreshAuth = async (req: Request, res: Response) => {
    const tokenCookie = req.cookies.token;
    const token = typeof tokenCookie === "string" ? tokenCookie : undefined;

    if (!token) {
        clearAuthCookie(res);
        res.status(401).json({ error: "No token, authorization denied" });
        return;
    }

    const refreshedToken = AuthService.refreshToken(token);

    if (!refreshedToken) {
        clearAuthCookie(res);
        res.status(401).json({ error: "Token is not valid" });
        return;
    }

    setAuthCookie(res, refreshedToken);
    res.json({ success: true });
};

export const logout = async (_req: Request, res: Response) => {
    clearAuthCookie(res);
    res.json({ message: "Logged out successfully" });
};

export const getCurrentUser = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: "User is not signed in" });
            return;
        }

        const profile = await AuthService.getCurrentProfile(req.user.id);

        if (!profile) {
            res.status(404).json({ error: "Profile not found" });
            return;
        }

        res.json([profile]);
    } catch (error) {
        console.error("Get user error:", error);
        res.status(500).json({ error: "Error fetching user data" });
    }
};

export const getAllFeedback = async (req: Request, res: Response) => {
    try {
        const limitParam = req.query.limit;
        const cursorParam = req.query.cursor;
        const sortParam = req.query.sort;
        const categoryParam = req.query.category;
        const statusParam = req.query.status;

        const isPaginatedRequest =
            typeof limitParam === "string" ||
            typeof cursorParam === "string" ||
            typeof sortParam === "string" ||
            typeof categoryParam === "string" ||
            typeof statusParam === "string";

        if (!isPaginatedRequest) {
            const feedback = await FeedbackService.getAllFeedback(req.user?.id);
            res.json(feedback);
            return;
        }

        let limit: number | undefined;

        if (typeof limitParam === "string") {
            const parsedLimit = Number.parseInt(limitParam, 10);

            if (Number.isNaN(parsedLimit) || parsedLimit < 1) {
                res.status(400).json({ error: "Invalid limit" });
                return;
            }

            limit = parsedLimit;
        }

        if (
            typeof sortParam === "string" &&
            !FeedbackService.isValidSort(sortParam)
        ) {
            res.status(400).json({ error: "Invalid sort" });
            return;
        }

        if (
            typeof categoryParam === "string" &&
            categoryParam !== "all" &&
            !FeedbackService.isValidCategory(categoryParam)
        ) {
            res.status(400).json({ error: "Invalid category" });
            return;
        }

        if (
            typeof statusParam === "string" &&
            !FeedbackService.isValidStatus(statusParam)
        ) {
            res.status(400).json({ error: "Invalid status" });
            return;
        }

        const sort =
            typeof sortParam === "string" &&
            FeedbackService.isValidSort(sortParam)
                ? sortParam
                : undefined;

        const category =
            typeof categoryParam === "string" &&
            (categoryParam === "all" ||
                FeedbackService.isValidCategory(categoryParam))
                ? categoryParam
                : undefined;

        const status =
            typeof statusParam === "string" &&
            FeedbackService.isValidStatus(statusParam)
                ? statusParam
                : undefined;

        const cursor =
            typeof cursorParam === "string" ? cursorParam : undefined;

        const feedback = await FeedbackService.getPaginatedFeedback(
            {
                limit,
                cursor,
                sort,
                category,
                status,
            },
            req.user?.id,
        );

        res.json(feedback);
    } catch (error) {
        if (error instanceof Error && error.message === "INVALID_CURSOR") {
            res.status(400).json({ error: "Invalid cursor" });
            return;
        }

        console.error("GET all feedback error:", error);
        res.status(500).json({ error: "Error fetching data" });
    }
};

export const getSingleFeedback = async (req: Request, res: Response) => {
    try {
        const feedbackId = req.query.feedback_id;

        if (typeof feedbackId !== "string" || feedbackId.length === 0) {
            res.status(400).json({ error: "Feedback ID is required" });
            return;
        }

        const feedback = await FeedbackService.getSingleFeedback(
            feedbackId,
            req.user?.id,
        );

        if (!feedback) {
            res.status(404).json({ error: "Feedback not found" });
            return;
        }

        res.json(feedback);
    } catch (error) {
        console.error("GET single feedback error:", error);
        res.status(500).json({ error: "Error fetching data" });
    }
};

export const createFeedback = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            res.status(401).json({
                error: "You need to be logged in to post feedback",
            });
            return;
        }

        const { title, category, detail } = req.body as {
            title?: string;
            category?: string;
            detail?: string;
        };

        if (!title || title.length < 3) {
            res.status(400).json({ error: "Invalid Title" });
            return;
        }

        if (!detail || detail.length < 3) {
            res.status(400).json({ error: "Invalid Detail" });
            return;
        }

        if (!category || !FeedbackService.isValidCategory(category)) {
            res.status(400).json({ error: "Invalid Category" });
            return;
        }

        const data = await FeedbackService.createFeedback({
            userId: req.user.id,
            title,
            category: category as FeedbackCategory,
            detail,
        });

        res.status(201).json({ data: `Feedback Created: ${data.id}` });
    } catch (error) {
        console.error("POST feedback error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const updateFeedback = async (req: Request, res: Response) => {
    try {
        const { id, title, detail, category, status, order } = req.body as {
            id?: string;
            title?: string;
            detail?: string;
            category?: string;
            status?: string;
            order?: number | null;
        };

        if (!id || !title || !detail || !category || !status) {
            res.status(400).json({
                error: "All fields (id, title, detail, category, status, order) are required",
            });
            return;
        }

        if (!FeedbackService.isValidCategory(category)) {
            res.status(400).json({ error: "Invalid Category" });
            return;
        }

        if (!FeedbackService.isValidStatus(status)) {
            res.status(400).json({ error: "Invalid Status" });
            return;
        }

        const data = await FeedbackService.updateFeedback({
            id,
            title,
            detail,
            category: category as FeedbackCategory,
            status: status as FeedbackStatus,
            order: order ?? null,
        });

        if (!data) {
            res.status(404).json({ error: "Feedback not found" });
            return;
        }

        res.json({ data: [data] });
    } catch (error) {
        console.error("Error updating data", error);
        res.status(500).json({ error: "Error updating data" });
    }
};

export const deleteFeedback = async (req: Request, res: Response) => {
    try {
        const { id } = req.body as { id?: string };

        if (!id) {
            res.status(400).json({ error: "ID is required" });
            return;
        }

        const data = await FeedbackService.deleteFeedback(id);

        if (!data) {
            res.status(404).json({ error: "Feedback not found" });
            return;
        }

        res.json({ data: [data] });
    } catch (error) {
        console.error("Error deleting data", error);
        res.status(500).json({ error: "Error deleting data" });
    }
};

export const toggleUpvote = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            res.status(401).json({
                error: "You need to be logged in to post feedback",
            });
            return;
        }

        const { feedbackId } = req.body as { feedbackId?: string };

        if (!feedbackId) {
            res.status(400).json({ error: "Feedback ID is required" });
            return;
        }

        const result = await FeedbackService.toggleVote(
            feedbackId,
            req.user.id,
        );

        if (!result) {
            res.status(404).json({ error: "Feedback not found" });
            return;
        }

        res.json({
            message: "Vote toggled successfully",
            details: result,
        });
    } catch (error) {
        console.error("Toggle error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const getComments = async (req: Request, res: Response) => {
    try {
        const feedbackId = req.query.feedback_id;

        if (typeof feedbackId !== "string" || feedbackId.length === 0) {
            res.status(400).json({ error: "Feedback ID is required" });
            return;
        }

        const comments = await CommentService.getComments(feedbackId);
        res.json(comments);
    } catch (error) {
        console.error("Error fetching comments:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const createComment = async (req: Request, res: Response) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: "User not authenticated" });
            return;
        }

        const { feedback_id, content, parent_comment_id } = req.body as {
            feedback_id?: string;
            content?: string;
            parent_comment_id?: string | null;
        };

        if (!feedback_id || !content) {
            res.status(400).json({
                error: "Feedback ID and content are required",
            });
            return;
        }

        const data = await CommentService.createComment({
            feedbackId: feedback_id,
            userId: req.user.id,
            content,
            parentCommentId: parent_comment_id ?? null,
        });

        res.status(201).json(data);
    } catch (error) {
        console.error("Error posting comment:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
