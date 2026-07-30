import bcrypt from "bcrypt";
import { pool } from "../config/database";

interface SeedUser {
    email: string;
    password: string;
    username: string;
    fullName: string;
    avatarSeed: string;
}

interface SeedFeedback {
    title: string;
    detail: string;
    category: "ui" | "ux" | "enhancement" | "bug" | "feature";
    status: "suggestion" | "planned" | "progress" | "live";
    order: number | null;
    upvotes: number;
    authorEmail: string;
}

interface SeedComment {
    feedbackTitle: string;
    authorEmail: string;
    content: string;
    parentContent?: string;
}

const DEMO_USERS: SeedUser[] = [
    {
        email: process.env.DEMO_EMAIL ?? "demo@demo.com",
        password: process.env.DEMO_PASSWORD ?? "demo",
        username: "demouser",
        fullName: "Demo User",
        avatarSeed: "DemoUser",
    },
    {
        email: "ella.thompson@example.co.uk",
        password: "password123",
        username: "ellathompson",
        fullName: "Ella Thompson",
        avatarSeed: "EllaThompson",
    },
    {
        email: "james.wright@example.co.uk",
        password: "password123",
        username: "jameswright",
        fullName: "James Wright",
        avatarSeed: "JamesWright",
    },
    {
        email: "sofia.patel@example.co.uk",
        password: "password123",
        username: "sofiapatel",
        fullName: "Sofia Patel",
        avatarSeed: "SofiaPatel",
    },
];

const SEED_FEEDBACK: SeedFeedback[] = [
    {
        title: "Add dark mode support",
        detail: "Allow users to switch between light and dark themes across the dashboard.",
        category: "feature",
        status: "suggestion",
        order: null,
        upvotes: 42,
        authorEmail: "ella.thompson@example.co.uk",
    },
    {
        title: "Improve mobile navigation",
        detail: "The mobile menu is hard to reach with one hand and needs clearer hierarchy.",
        category: "ux",
        status: "suggestion",
        order: null,
        upvotes: 28,
        authorEmail: "james.wright@example.co.uk",
    },
    {
        title: "Fix filter chip overflow",
        detail: "Category chips wrap awkwardly on smaller screens and clip the last option.",
        category: "ui",
        status: "planned",
        order: 1,
        upvotes: 19,
        authorEmail: "sofia.patel@example.co.uk",
    },
    {
        title: "Keyboard shortcut for upvote",
        detail: "Add a keyboard shortcut so power users can upvote without reaching for the mouse.",
        category: "enhancement",
        status: "planned",
        order: 2,
        upvotes: 15,
        authorEmail: process.env.DEMO_EMAIL ?? "demo@demo.com",
    },
    {
        title: "Comments fail to nest replies",
        detail: "Replying to a reply sometimes posts as a top-level comment instead.",
        category: "bug",
        status: "progress",
        order: 1,
        upvotes: 33,
        authorEmail: "james.wright@example.co.uk",
    },
    {
        title: "Roadmap drag animation polish",
        detail: "Smooth the drag preview and drop highlight on the roadmap board.",
        category: "ui",
        status: "progress",
        order: 2,
        upvotes: 12,
        authorEmail: "ella.thompson@example.co.uk",
    },
    {
        title: "Export feedback as CSV",
        detail: "Product managers want to export filtered feedback lists for stakeholder reviews.",
        category: "feature",
        status: "live",
        order: 1,
        upvotes: 51,
        authorEmail: "sofia.patel@example.co.uk",
    },
    {
        title: "Show comment count on cards",
        detail: "Surface comment totals on suggestion cards so busy threads stand out.",
        category: "enhancement",
        status: "live",
        order: 2,
        upvotes: 37,
        authorEmail: process.env.DEMO_EMAIL ?? "demo@demo.com",
    },
];

const SEED_COMMENTS: SeedComment[] = [
    {
        feedbackTitle: "Add dark mode support",
        authorEmail: "james.wright@example.co.uk",
        content:
            "This would make late-night planning sessions much easier on the eyes.",
    },
    {
        feedbackTitle: "Add dark mode support",
        authorEmail: "sofia.patel@example.co.uk",
        content: "Agreed — please respect system preference by default.",
        parentContent:
            "This would make late-night planning sessions much easier on the eyes.",
    },
    {
        feedbackTitle: "Improve mobile navigation",
        authorEmail: "ella.thompson@example.co.uk",
        content: "A bottom sheet for filters would feel more native on phones.",
    },
    {
        feedbackTitle: "Comments fail to nest replies",
        authorEmail: process.env.DEMO_EMAIL ?? "demo@demo.com",
        content:
            "I can reproduce this when replying from the roadmap detail view.",
    },
    {
        feedbackTitle: "Export feedback as CSV",
        authorEmail: "james.wright@example.co.uk",
        content:
            "Useful for quarterly reviews — including status and upvote columns please.",
    },
    {
        feedbackTitle: "Show comment count on cards",
        authorEmail: "sofia.patel@example.co.uk",
        content: "Looks great in production already. Thanks for shipping this.",
    },
];

function avatarUrl(seed: string): string {
    return `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(seed)}`;
}

async function ensureUsers(): Promise<Record<string, string>> {
    const userIdsByEmail: Record<string, string> = {};

    for (const user of DEMO_USERS) {
        const existing = await pool.query<{ id: string }>(
            "SELECT id FROM users WHERE email = $1",
            [user.email],
        );

        if (existing.rows[0]) {
            userIdsByEmail[user.email] = existing.rows[0].id;
            continue;
        }

        const passwordHash = await bcrypt.hash(user.password, 10);
        const created = await pool.query<{ id: string }>(
            `INSERT INTO users (email, password_hash)
             VALUES ($1, $2)
             RETURNING id`,
            [user.email, passwordHash],
        );

        const userId = created.rows[0].id;
        userIdsByEmail[user.email] = userId;

        await pool.query(
            `INSERT INTO profiles (id, username, full_name, avatar_url)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (id) DO NOTHING`,
            [userId, user.username, user.fullName, avatarUrl(user.avatarSeed)],
        );

        console.log(`Created user ${user.email}`);
    }

    return userIdsByEmail;
}

async function ensureFeedback(
    userIdsByEmail: Record<string, string>,
): Promise<Record<string, string>> {
    const existingCount = await pool.query<{ count: string }>(
        "SELECT COUNT(*)::text AS count FROM feedback",
    );

    if (Number.parseInt(existingCount.rows[0].count, 10) > 0) {
        console.log("Feedback already seeded, skipping feedback insert.");
        const existing = await pool.query<{ id: string; title: string }>(
            "SELECT id, title FROM feedback",
        );
        const map: Record<string, string> = {};
        for (const row of existing.rows) {
            map[row.title] = row.id;
        }
        return map;
    }

    const feedbackIdsByTitle: Record<string, string> = {};

    for (const item of SEED_FEEDBACK) {
        const userId = userIdsByEmail[item.authorEmail];

        if (!userId) {
            continue;
        }

        const result = await pool.query<{ id: string }>(
            `INSERT INTO feedback (user_id, title, detail, category, status, "order", upvotes)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id`,
            [
                userId,
                item.title,
                item.detail,
                item.category,
                item.status,
                item.order,
                item.upvotes,
            ],
        );

        feedbackIdsByTitle[item.title] = result.rows[0].id;
    }

    console.log(
        `Seeded ${Object.keys(feedbackIdsByTitle).length} feedback items`,
    );
    return feedbackIdsByTitle;
}

async function ensureVotes(
    userIdsByEmail: Record<string, string>,
    feedbackIdsByTitle: Record<string, string>,
) {
    const existingCount = await pool.query<{ count: string }>(
        "SELECT COUNT(*)::text AS count FROM votes",
    );

    if (Number.parseInt(existingCount.rows[0].count, 10) > 0) {
        console.log("Votes already seeded, skipping.");
        return;
    }

    const voterEmails = Object.keys(userIdsByEmail);
    let voteCount = 0;

    for (const [title, feedbackId] of Object.entries(feedbackIdsByTitle)) {
        const feedbackMeta = SEED_FEEDBACK.find((item) => item.title === title);
        const targetVotes = Math.min(
            feedbackMeta?.upvotes ?? 0,
            voterEmails.length,
        );

        for (let index = 0; index < targetVotes; index += 1) {
            const email = voterEmails[index];
            const userId = userIdsByEmail[email];

            await pool.query(
                `INSERT INTO votes (user_id, feedback_id)
                 VALUES ($1, $2)
                 ON CONFLICT (user_id, feedback_id) DO NOTHING`,
                [userId, feedbackId],
            );
            voteCount += 1;
        }

        const actualVotes = await pool.query<{ count: string }>(
            "SELECT COUNT(*)::text AS count FROM votes WHERE feedback_id = $1",
            [feedbackId],
        );

        await pool.query("UPDATE feedback SET upvotes = $1 WHERE id = $2", [
            Number.parseInt(actualVotes.rows[0].count, 10),
            feedbackId,
        ]);
    }

    console.log(`Seeded ${voteCount} votes`);
}

async function ensureComments(
    userIdsByEmail: Record<string, string>,
    feedbackIdsByTitle: Record<string, string>,
) {
    const existingCount = await pool.query<{ count: string }>(
        "SELECT COUNT(*)::text AS count FROM comments",
    );

    if (Number.parseInt(existingCount.rows[0].count, 10) > 0) {
        console.log("Comments already seeded, skipping.");
        return;
    }

    const commentIdsByContent: Record<string, string> = {};

    for (const comment of SEED_COMMENTS) {
        const feedbackId = feedbackIdsByTitle[comment.feedbackTitle];
        const userId = userIdsByEmail[comment.authorEmail];

        if (!feedbackId || !userId) {
            continue;
        }

        const parentId = comment.parentContent
            ? (commentIdsByContent[comment.parentContent] ?? null)
            : null;

        const result = await pool.query<{ id: string }>(
            `INSERT INTO comments (feedback_id, user_id, content, parent_comment_id)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
            [feedbackId, userId, comment.content, parentId],
        );

        commentIdsByContent[comment.content] = result.rows[0].id;
    }

    console.log(`Seeded ${Object.keys(commentIdsByContent).length} comments`);
}

async function seed() {
    try {
        console.log("Starting product feedback seed...");
        const userIdsByEmail = await ensureUsers();
        const feedbackIdsByTitle = await ensureFeedback(userIdsByEmail);
        await ensureVotes(userIdsByEmail, feedbackIdsByTitle);
        await ensureComments(userIdsByEmail, feedbackIdsByTitle);
        console.log("Seed completed successfully.");
    } catch (error) {
        console.error("Seed failed:", error);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

void seed();
