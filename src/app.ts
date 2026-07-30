import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import apiRoutes from "./routes/apiRoutes";

dotenv.config({
    path:
        process.env.NODE_ENV === "production"
            ? ".env.production.local"
            : ".env.development.local",
});

export const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(
    cors({
        origin:
            process.env.NODE_ENV === "production"
                ? "https://feedback.adamrichardturner.dev"
                : (process.env.ALLOWED_ORIGINS ?? "http://localhost:3000"),
        credentials: true,
    }),
);

app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});

app.use("/api", apiRoutes);

const port = Number.parseInt(process.env.PORT ?? "3002", 10);

export const server = app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
