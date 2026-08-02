import { Router } from "express";
import { auth, optionalAuth } from "../middleware/auth";
import {
    createComment,
    createFeedback,
    deleteFeedback,
    demoLogin,
    getAllFeedback,
    getComments,
    getCurrentUser,
    getSingleFeedback,
    logout,
    refreshAuth,
    toggleUpvote,
    updateFeedback,
} from "../controllers/feedbackController";

const router = Router();

router.post("/auth/demo", demoLogin);
router.post("/auth/refresh", refreshAuth);
router.post("/auth/signout", logout);
router.get("/user", auth, getCurrentUser);

router.get("/feedback", optionalAuth, getAllFeedback);
router.post("/feedback", auth, createFeedback);
router.put("/feedback", auth, updateFeedback);
router.delete("/feedback", auth, deleteFeedback);

router.get("/feedback/single", optionalAuth, getSingleFeedback);
router.post("/feedback/upvote", auth, toggleUpvote);

router.get("/feedback/comments", optionalAuth, getComments);
router.post("/feedback/comments", auth, createComment);

export default router;
