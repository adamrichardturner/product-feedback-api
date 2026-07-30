# Product Feedback API

Express and TypeScript API for the Product Feedback application, backed by PostgreSQL in Docker.

The matching frontend repository is [product-feedback](https://github.com/adamrichardturner/product-feedback).

## Features

- Express 5 with TypeScript
- PostgreSQL 16 via Docker Compose
- Service and repository layering for feedback, comments, votes, and auth
- JWT demo login stored in an httpOnly cookie
- Idempotent seed data for local development
- Separate development and production Compose files

## Table of Contents

- [Requirements](#requirements)
- [Installation](#installation)
- [Environment variables](#environment-variables)
- [Database](#database)
- [Scripts](#scripts)
- [API endpoints](#api-endpoints)
- [Local development](#local-development)

## Requirements

- Node.js 20+
- Docker and Docker Compose
- npm

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/adamrichardturner/product-feedback-api.git
   cd product-feedback-api
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create environment files (see [Environment variables](#environment-variables)). A development example is provided below.

## Environment variables

### `.env.development.local`

```env
DB_HOST=localhost
DB_PORT=5435
DB_USER=feedback_admin
DB_PASSWORD=feedback_dev_password
DB_NAME=product_feedback
JWT_SECRET=replace_with_a_long_random_secret
PORT=3002
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000
FRONTEND_URL=http://localhost:3000
DEMO_EMAIL=demo@demo.com
DEMO_PASSWORD=demo
```

### `.env.production.local`

Use the same keys with production values. Set `NODE_ENV=production`, `PORT=3005`, `DB_PORT=5435`, and point `ALLOWED_ORIGINS` / `FRONTEND_URL` at the live frontend origin.

| Variable | Purpose |
| --- | --- |
| `DB_*` | PostgreSQL connection settings |
| `JWT_SECRET` | Signs and verifies the auth cookie |
| `PORT` | API listen port (default `3002` locally, `3005` in production) |
| `DEMO_EMAIL` / `DEMO_PASSWORD` | Demo login credentials used by seed and auth |
| `ALLOWED_ORIGINS` | CORS origin for the frontend |

In Docker Compose, `DB_HOST` is overridden to `db` and `DB_PORT` to `5432` inside the network.

## Database

Schema lives in `database.sql` and is applied automatically when the Postgres volume is first created.

Tables:

- `users` — authentication accounts
- `profiles` — display name, username, and avatar URL
- `feedback` — suggestions and roadmap items
- `votes` — per-user upvotes
- `comments` — threaded comments and replies

To reset the development database volume:

```bash
npm run docker:down
docker volume rm product-feedback-api_db-data-dev
npm run docker:dev
```

## Scripts

| Script | Description |
| --- | --- |
| `npm run docker:dev` | Build and start API + Postgres for development |
| `npm run docker:prod` | Build and start the production Compose stack |
| `npm run docker:down` | Stop the development Compose stack |
| `npm run docker:down:prod` | Stop the production Compose stack |
| `npm run dev` | Run the API locally with nodemon (requires Postgres) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled production server |
| `npm run seed` | Run the seed script against the development database |
| `npm run format` | Format TypeScript with Prettier |

## API endpoints

All routes are mounted under `/api`.

### Auth and user

- `POST /api/auth/demo` — demo login; sets httpOnly `token` cookie
- `POST /api/auth/signout` — clears the auth cookie
- `GET /api/user` — current user profile (auth required)

### Feedback

- `GET /api/feedback` — list feedback with upvote and comment metadata
- `POST /api/feedback` — create feedback (auth required)
- `PUT /api/feedback` — update feedback fields including roadmap status/order (auth required)
- `DELETE /api/feedback` — delete feedback and related votes (auth required)
- `GET /api/feedback/single?feedback_id=` — single feedback item
- `POST /api/feedback/upvote` — toggle upvote (auth required)

### Comments

- `GET /api/feedback/comments?feedback_id=` — nested comment tree
- `POST /api/feedback/comments` — create comment or reply (auth required)

Also available: `GET /health`

## Local development

Recommended flow with Docker for the backend:

```bash
npm run docker:dev
```

The API listens on `http://localhost:3002`. Postgres is published on host port `5435`.

Then start the frontend from the product-feedback repository with `npm run dev`.

Seed data runs automatically when the API container starts. Demo login credentials default to `demo@demo.com` / `demo`.
