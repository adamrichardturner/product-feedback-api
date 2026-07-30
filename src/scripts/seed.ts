import bcrypt from "bcrypt";
import { pool } from "../config/database";

interface SeedUser {
    email: string;
    password: string;
    username: string;
    fullName: string;
    avatarUrl: string;
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

const DEMO_EMAIL = process.env.DEMO_EMAIL ?? "demo@demo.com";
const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? "demo";

const ADAM = "adam.turner@example.co.uk";
const BRANDAN = "brandan.butter@example.co.uk";
const CYRILL = "cyrill.capuras@example.co.uk";
const JAMES = "james.lowe@example.co.uk";
const JAN = DEMO_EMAIL;
const SARAH = "sarah.connor@example.co.uk";

const DEMO_USERS: SeedUser[] = [
    {
        email: ADAM,
        password: "password123",
        username: "adamturner",
        fullName: "Adam Turner",
        avatarUrl: "/profiles/adamturner.jpg",
    },
    {
        email: BRANDAN,
        password: "password123",
        username: "brandanbutter",
        fullName: "Brandan Butter",
        avatarUrl: "/profiles/brendanbutter.jpg",
    },
    {
        email: CYRILL,
        password: "password123",
        username: "cyrillcapuras",
        fullName: "Cyrill Capuras",
        avatarUrl: "/profiles/cyrillcapuras.jpg",
    },
    {
        email: JAMES,
        password: "password123",
        username: "jameslowe",
        fullName: "James Lowe",
        avatarUrl: "/profiles/jameslowe.jpg",
    },
    {
        email: JAN,
        password: DEMO_PASSWORD,
        username: "jansim",
        fullName: "Jan Sim",
        avatarUrl: "/profiles/jansim.jpg",
    },
    {
        email: SARAH,
        password: "password123",
        username: "sarahconnor",
        fullName: "Sarah Connor",
        avatarUrl: "/profiles/sarahconnor.jpg",
    },
];

const SEED_FEEDBACK: SeedFeedback[] = [
    {
        title: "Add dark mode support",
        detail: "Allow users to switch between light and dark themes across the dashboard and roadmap views.",
        category: "feature",
        status: "suggestion",
        order: null,
        upvotes: 6,
        authorEmail: ADAM,
    },
    {
        title: "Improve mobile navigation",
        detail: "The mobile menu is hard to reach with one hand and needs clearer hierarchy between filters and sorting.",
        category: "ux",
        status: "suggestion",
        order: null,
        upvotes: 5,
        authorEmail: BRANDAN,
    },
    {
        title: "Filter chips overflow on small screens",
        detail: "Category chips wrap awkwardly on phones and clip the last option when the viewport is narrow.",
        category: "ui",
        status: "suggestion",
        order: null,
        upvotes: 4,
        authorEmail: CYRILL,
    },
    {
        title: "Keyboard shortcut for upvote",
        detail: "Add a shortcut so power users can upvote feedback without reaching for the mouse.",
        category: "enhancement",
        status: "suggestion",
        order: null,
        upvotes: 3,
        authorEmail: JAMES,
    },
    {
        title: "Allow multi-select category filters",
        detail: "Users often want to combine Bug and UI filters instead of choosing only one at a time.",
        category: "feature",
        status: "suggestion",
        order: null,
        upvotes: 5,
        authorEmail: JAN,
    },
    {
        title: "Search feedback by keyword",
        detail: "A search box would help when the suggestion list grows past a few dozen items.",
        category: "feature",
        status: "suggestion",
        order: null,
        upvotes: 6,
        authorEmail: SARAH,
    },
    {
        title: "Show relative timestamps",
        detail: "Display '2 hours ago' instead of raw dates on suggestion cards and comments.",
        category: "ux",
        status: "suggestion",
        order: null,
        upvotes: 3,
        authorEmail: ADAM,
    },
    {
        title: "Add empty state illustration",
        detail: "When filters return no results, show a clearer empty state with a one-click reset action.",
        category: "ui",
        status: "suggestion",
        order: null,
        upvotes: 2,
        authorEmail: BRANDAN,
    },
    {
        title: "Quiet hours for notifications",
        detail: "Pause comment notification emails overnight so teams are not woken by late replies.",
        category: "enhancement",
        status: "suggestion",
        order: null,
        upvotes: 4,
        authorEmail: CYRILL,
    },
    {
        title: "Pin important suggestions",
        detail: "Let admins pin a few high-priority items to the top of the suggestions list.",
        category: "feature",
        status: "suggestion",
        order: null,
        upvotes: 5,
        authorEmail: JAMES,
    },
    {
        title: "Inline image attachments on feedback",
        detail: "Allow attaching screenshots when creating feedback so context is clearer for reviewers.",
        category: "feature",
        status: "suggestion",
        order: null,
        upvotes: 4,
        authorEmail: SARAH,
    },
    {
        title: "Sort by newest comments",
        detail: "Add a sort option that surfaces suggestions with the most recent discussion activity.",
        category: "enhancement",
        status: "suggestion",
        order: null,
        upvotes: 3,
        authorEmail: JAN,
    },
    {
        title: "Fix filter chip overflow",
        detail: "Category chips wrap awkwardly on smaller screens and clip the last option on the roadmap filters.",
        category: "ui",
        status: "planned",
        order: 1,
        upvotes: 5,
        authorEmail: CYRILL,
    },
    {
        title: "Bulk status updates",
        detail: "Allow product managers to move several suggestions into Planned in one action.",
        category: "feature",
        status: "planned",
        order: 2,
        upvotes: 4,
        authorEmail: JAN,
    },
    {
        title: "Mention teammates in comments",
        detail: "Support @mentions so the right person gets notified about a reply without leaving the thread.",
        category: "enhancement",
        status: "planned",
        order: 3,
        upvotes: 6,
        authorEmail: SARAH,
    },
    {
        title: "Add feedback tags",
        detail: "Optional tags would help group related requests beyond the main category filter.",
        category: "feature",
        status: "planned",
        order: 4,
        upvotes: 3,
        authorEmail: ADAM,
    },
    {
        title: "Email digest of weekly activity",
        detail: "Send a weekly summary of new suggestions, status changes, and top upvoted items.",
        category: "feature",
        status: "planned",
        order: 5,
        upvotes: 4,
        authorEmail: BRANDAN,
    },
    {
        title: "Comments fail to nest replies",
        detail: "Replying to a reply sometimes posts as a top-level comment instead of nesting under the parent.",
        category: "bug",
        status: "progress",
        order: 1,
        upvotes: 6,
        authorEmail: JAMES,
    },
    {
        title: "Roadmap drag animation polish",
        detail: "Smooth the drag preview and drop highlight on the roadmap board for clearer placement feedback.",
        category: "ui",
        status: "progress",
        order: 2,
        upvotes: 3,
        authorEmail: SARAH,
    },
    {
        title: "Persist roadmap column order",
        detail: "Column order resets after refresh even though the status update succeeds on the server.",
        category: "bug",
        status: "progress",
        order: 3,
        upvotes: 5,
        authorEmail: ADAM,
    },
    {
        title: "Toast confirmations after edits",
        detail: "Show a short confirmation when roadmap cards are moved or feedback is saved.",
        category: "ux",
        status: "progress",
        order: 4,
        upvotes: 2,
        authorEmail: BRANDAN,
    },
    {
        title: "Duplicate feedback detection",
        detail: "Warn when a new suggestion title is very similar to an existing item before submission.",
        category: "enhancement",
        status: "progress",
        order: 5,
        upvotes: 4,
        authorEmail: CYRILL,
    },
    {
        title: "Export feedback as CSV",
        detail: "Product managers want to export filtered feedback lists for stakeholder reviews.",
        category: "feature",
        status: "live",
        order: 1,
        upvotes: 6,
        authorEmail: JAN,
    },
    {
        title: "Show comment count on cards",
        detail: "Surface comment totals on suggestion cards so busy threads stand out at a glance.",
        category: "enhancement",
        status: "live",
        order: 2,
        upvotes: 5,
        authorEmail: SARAH,
    },
    {
        title: "Category colour coding",
        detail: "Give each category a consistent colour so scanning the board and suggestion list is faster.",
        category: "ui",
        status: "live",
        order: 3,
        upvotes: 4,
        authorEmail: CYRILL,
    },
    {
        title: "Shareable feedback links",
        detail: "Copy a direct link to any feedback item from the detail page for sharing in Slack.",
        category: "feature",
        status: "live",
        order: 4,
        upvotes: 6,
        authorEmail: ADAM,
    },
    {
        title: "Vote count animation",
        detail: "Animate the upvote counter when a vote is added or removed so the change feels immediate.",
        category: "ui",
        status: "live",
        order: 5,
        upvotes: 3,
        authorEmail: JAMES,
    },
];

const SEED_COMMENTS: SeedComment[] = [
    // Add dark mode support
    {
        feedbackTitle: "Add dark mode support",
        authorEmail: JAMES,
        content:
            "This would make late-night planning sessions much easier on the eyes.",
    },
    {
        feedbackTitle: "Add dark mode support",
        authorEmail: SARAH,
        content: "Agreed — please respect system preference by default.",
        parentContent:
            "This would make late-night planning sessions much easier on the eyes.",
    },
    {
        feedbackTitle: "Add dark mode support",
        authorEmail: BRANDAN,
        content:
            "Also worth syncing the preference across devices once a user is signed in.",
        parentContent: "Agreed — please respect system preference by default.",
    },
    {
        feedbackTitle: "Add dark mode support",
        authorEmail: JAN,
        content:
            "Happy to help prototype token pairs for light and dark if we take this on.",
    },
    {
        feedbackTitle: "Add dark mode support",
        authorEmail: CYRILL,
        content:
            "Make sure charts and roadmap badges still meet contrast requirements.",
        parentContent:
            "Happy to help prototype token pairs for light and dark if we take this on.",
    },

    // Improve mobile navigation
    {
        feedbackTitle: "Improve mobile navigation",
        authorEmail: ADAM,
        content:
            "A bottom sheet for filters would feel more native on phones than the current drawer.",
    },
    {
        feedbackTitle: "Improve mobile navigation",
        authorEmail: CYRILL,
        content:
            "Yes — and keep the upvote control within thumb reach on the suggestion cards.",
        parentContent:
            "A bottom sheet for filters would feel more native on phones than the current drawer.",
    },
    {
        feedbackTitle: "Improve mobile navigation",
        authorEmail: SARAH,
        content:
            "I keep accidentally opening sort when I mean to open categories on my phone.",
    },

    // Search feedback by keyword
    {
        feedbackTitle: "Search feedback by keyword",
        authorEmail: BRANDAN,
        content:
            "Search should cover titles and details — comments can come later if performance is a concern.",
    },
    {
        feedbackTitle: "Search feedback by keyword",
        authorEmail: JAMES,
        content:
            "Debounce the input and highlight matching terms in the results list.",
        parentContent:
            "Search should cover titles and details — comments can come later if performance is a concern.",
    },
    {
        feedbackTitle: "Search feedback by keyword",
        authorEmail: JAN,
        content:
            "Even a simple contains match would unblock us until we can add full-text search.",
        parentContent:
            "Debounce the input and highlight matching terms in the results list.",
    },
    {
        feedbackTitle: "Search feedback by keyword",
        authorEmail: ADAM,
        content:
            "Would love to filter by author as a second step after search.",
    },

    // Pin important suggestions
    {
        feedbackTitle: "Pin important suggestions",
        authorEmail: SARAH,
        content:
            "Pins should be limited so the list does not become another backlog.",
    },
    {
        feedbackTitle: "Pin important suggestions",
        authorEmail: CYRILL,
        content: "Three pins max feels right for our team size.",
        parentContent:
            "Pins should be limited so the list does not become another backlog.",
    },
    {
        feedbackTitle: "Pin important suggestions",
        authorEmail: JAMES,
        content: "Agreed — and show who pinned an item for accountability.",
        parentContent: "Three pins max feels right for our team size.",
    },

    // Mention teammates in comments
    {
        feedbackTitle: "Mention teammates in comments",
        authorEmail: ADAM,
        content:
            "Mentions would save so many Slack side-threads about the same feedback item.",
    },
    {
        feedbackTitle: "Mention teammates in comments",
        authorEmail: BRANDAN,
        content:
            "Please include an autocomplete dropdown with avatar and full name.",
        parentContent:
            "Mentions would save so many Slack side-threads about the same feedback item.",
    },
    {
        feedbackTitle: "Mention teammates in comments",
        authorEmail: JAN,
        content:
            "Email notifications for mentions should respect quiet hours once that ships.",
        parentContent:
            "Please include an autocomplete dropdown with avatar and full name.",
    },
    {
        feedbackTitle: "Mention teammates in comments",
        authorEmail: SARAH,
        content:
            "We should also notify when someone is mentioned in a nested reply.",
    },

    // Comments fail to nest replies
    {
        feedbackTitle: "Comments fail to nest replies",
        authorEmail: JAN,
        content:
            "I can reproduce this when replying from the roadmap detail view.",
    },
    {
        feedbackTitle: "Comments fail to nest replies",
        authorEmail: ADAM,
        content:
            "Same here — the parent_comment_id looks null in the network payload.",
        parentContent:
            "I can reproduce this when replying from the roadmap detail view.",
    },
    {
        feedbackTitle: "Comments fail to nest replies",
        authorEmail: CYRILL,
        content:
            "I have a fix in progress that keeps the parent id when opening the reply field.",
        parentContent:
            "Same here — the parent_comment_id looks null in the network payload.",
    },
    {
        feedbackTitle: "Comments fail to nest replies",
        authorEmail: SARAH,
        content:
            "Thanks for chasing this — nested threads are hard to follow without it.",
    },
    {
        feedbackTitle: "Comments fail to nest replies",
        authorEmail: BRANDAN,
        content:
            "Can we add a regression test that posts a reply-to-reply before merging?",
        parentContent:
            "Thanks for chasing this — nested threads are hard to follow without it.",
    },

    // Persist roadmap column order
    {
        feedbackTitle: "Persist roadmap column order",
        authorEmail: JAMES,
        content:
            "After a refresh my Planned column order jumps back even though statuses stayed correct.",
    },
    {
        feedbackTitle: "Persist roadmap column order",
        authorEmail: JAN,
        content:
            "Looks like we update status but never persist the order column on drop.",
        parentContent:
            "After a refresh my Planned column order jumps back even though statuses stayed correct.",
    },
    {
        feedbackTitle: "Persist roadmap column order",
        authorEmail: SARAH,
        content:
            "Happy to pair on the optimistic cache update once the API lands.",
        parentContent:
            "Looks like we update status but never persist the order column on drop.",
    },

    // Export feedback as CSV
    {
        feedbackTitle: "Export feedback as CSV",
        authorEmail: JAMES,
        content:
            "Useful for quarterly reviews — please include status, category, and upvote columns.",
    },
    {
        feedbackTitle: "Export feedback as CSV",
        authorEmail: BRANDAN,
        content: "Comment count would help too when prioritising discussion.",
        parentContent:
            "Useful for quarterly reviews — please include status, category, and upvote columns.",
    },
    {
        feedbackTitle: "Export feedback as CSV",
        authorEmail: ADAM,
        content:
            "Shipping this live already saved us a messy copy-paste into Sheets.",
    },

    // Show comment count on cards
    {
        feedbackTitle: "Show comment count on cards",
        authorEmail: CYRILL,
        content: "Looks great in production already. Thanks for shipping this.",
    },
    {
        feedbackTitle: "Show comment count on cards",
        authorEmail: JAN,
        content:
            "Glad it helped — next we could show an unread badge for new replies.",
        parentContent:
            "Looks great in production already. Thanks for shipping this.",
    },

    // Shareable feedback links
    {
        feedbackTitle: "Shareable feedback links",
        authorEmail: SARAH,
        content:
            "The copy link button is a small win that gets used every standup.",
    },
    {
        feedbackTitle: "Shareable feedback links",
        authorEmail: JAMES,
        content: "Can we add a toast when the link is copied to the clipboard?",
        parentContent:
            "The copy link button is a small win that gets used every standup.",
    },
    {
        feedbackTitle: "Shareable feedback links",
        authorEmail: BRANDAN,
        content: "Toast confirmations after edits should cover that case too.",
        parentContent:
            "Can we add a toast when the link is copied to the clipboard?",
    },

    // Bulk status updates
    {
        feedbackTitle: "Bulk status updates",
        authorEmail: ADAM,
        content:
            "Selecting a range of suggestions and moving them to Planned would save a lot of dragging.",
    },
    {
        feedbackTitle: "Bulk status updates",
        authorEmail: CYRILL,
        content:
            "Needs a clear confirmation so we do not mass-update the wrong batch.",
        parentContent:
            "Selecting a range of suggestions and moving them to Planned would save a lot of dragging.",
    },

    // Inline image attachments on feedback
    {
        feedbackTitle: "Inline image attachments on feedback",
        authorEmail: JAN,
        content:
            "Screenshots of overflow bugs would make triage much faster for the UI queue.",
    },
    {
        feedbackTitle: "Inline image attachments on feedback",
        authorEmail: JAMES,
        content: "Limit uploads to a couple of images so cards stay readable.",
        parentContent:
            "Screenshots of overflow bugs would make triage much faster for the UI queue.",
    },
    {
        feedbackTitle: "Inline image attachments on feedback",
        authorEmail: SARAH,
        content:
            "Compression before upload would keep payload sizes reasonable.",
        parentContent:
            "Limit uploads to a couple of images so cards stay readable.",
    },

    // Duplicate feedback detection
    {
        feedbackTitle: "Duplicate feedback detection",
        authorEmail: ADAM,
        content:
            "We keep getting near-duplicate dark mode requests — a soft warning would help.",
    },
    {
        feedbackTitle: "Duplicate feedback detection",
        authorEmail: BRANDAN,
        content:
            "Fuzzy title matching against open suggestions should be enough for v1.",
        parentContent:
            "We keep getting near-duplicate dark mode requests — a soft warning would help.",
    },
    {
        feedbackTitle: "Duplicate feedback detection",
        authorEmail: JAN,
        content:
            "Linking to the existing item from the warning would be even better.",
        parentContent:
            "Fuzzy title matching against open suggestions should be enough for v1.",
    },

    // Allow multi-select category filters
    {
        feedbackTitle: "Allow multi-select category filters",
        authorEmail: CYRILL,
        content:
            "I often want Bug and UI together when reviewing mobile layout issues.",
    },
    {
        feedbackTitle: "Allow multi-select category filters",
        authorEmail: SARAH,
        content: "Same — single-select forces me to keep flipping filters.",
        parentContent:
            "I often want Bug and UI together when reviewing mobile layout issues.",
    },

    // Quiet hours for notifications
    {
        feedbackTitle: "Quiet hours for notifications",
        authorEmail: JAMES,
        content:
            "Got pinged at 1am about a reply — quiet hours would be a kindness.",
    },
    {
        feedbackTitle: "Quiet hours for notifications",
        authorEmail: ADAM,
        content: "Default to 10pm–7am local time and let users customise it.",
        parentContent:
            "Got pinged at 1am about a reply — quiet hours would be a kindness.",
    },
    {
        feedbackTitle: "Quiet hours for notifications",
        authorEmail: JAN,
        content:
            "Mentions could still break through if we add an urgent toggle later.",
        parentContent:
            "Default to 10pm–7am local time and let users customise it.",
    },

    // Category colour coding
    {
        feedbackTitle: "Category colour coding",
        authorEmail: BRANDAN,
        content:
            "Colour coding makes the live board much easier to scan in standups.",
    },
    {
        feedbackTitle: "Category colour coding",
        authorEmail: CYRILL,
        content: "Please keep the palette accessible for colour-blind viewers.",
        parentContent:
            "Colour coding makes the live board much easier to scan in standups.",
    },

    // Roadmap drag animation polish
    {
        feedbackTitle: "Roadmap drag animation polish",
        authorEmail: JAN,
        content:
            "The drop highlight is a bit subtle — a stronger outline would help.",
    },
    {
        feedbackTitle: "Roadmap drag animation polish",
        authorEmail: ADAM,
        content: "Agreed, especially on the Progress column which is denser.",
        parentContent:
            "The drop highlight is a bit subtle — a stronger outline would help.",
    },

    // Vote count animation
    {
        feedbackTitle: "Vote count animation",
        authorEmail: SARAH,
        content:
            "Nice touch — the bump animation makes voting feel responsive.",
    },
    {
        feedbackTitle: "Vote count animation",
        authorEmail: JAMES,
        content: "Works well on mobile too after the last polish pass.",
        parentContent:
            "Nice touch — the bump animation makes voting feel responsive.",
    },
];

async function ensureUsers(): Promise<Record<string, string>> {
    const userIdsByEmail: Record<string, string> = {};

    for (const user of DEMO_USERS) {
        const existing = await pool.query<{ id: string }>(
            "SELECT id FROM users WHERE email = $1",
            [user.email],
        );

        if (existing.rows[0]) {
            const userId = existing.rows[0].id;
            userIdsByEmail[user.email] = userId;

            await pool.query(
                `UPDATE profiles
                 SET avatar_url = $1,
                     username = $2,
                     full_name = $3,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = $4`,
                [user.avatarUrl, user.username, user.fullName, userId],
            );
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
            [userId, user.username, user.fullName, user.avatarUrl],
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
