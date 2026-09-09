# Quill — An MCP-Native Blogging Platform

Quill is a blogging platform built around the Model Context Protocol (MCP). Instead of managing your blog only through a web dashboard, you can connect your personal Quill MCP server URL to an AI coding agent (Claude Code, Cursor, MCP Inspector, etc.) and manage your blog through natural language — drafting posts, publishing them, and checking analytics — while a companion web dashboard reads and writes the exact same data.

## Core idea

- Sign up for a Quill account and log into the web dashboard like any normal blogging tool.
- Generate a personal API key from the dashboard.
- Add your personal MCP server URL (`http://<host>/mcp/<your-api-key>`) to an AI agent.
- Tell the agent things like *"Create a draft post about X"*, *"Publish my latest post"*, or *"How many posts have I published?"* — the agent calls Quill's MCP tools directly.
- Everything the agent does shows up instantly in the web dashboard, and vice versa, because both interfaces operate on the same SQLite database.

## Architecture

            ┌──────────────────┐
            │   Web Dashboard  │  (React + Vite)
            └────────┬─────────┘
                     │ REST (JWT auth)
                     ▼
            ┌──────────────────┐
            │   Quill Backend  │  (Express + TypeScript)
            │  ┌────────────┐  │
            │  │ REST API   │  │  /auth, /posts, /auth/api-keys
            │  ├────────────┤  │
            │  │ MCP Server │  │  POST /mcp/:apiKey (Streamable HTTP)
            │  └────────────┘  │
            └────────┬─────────┘
                     ▼
              ┌──────────────┐
              │    SQLite    │
              └──────────────┘
                     ▲
                     │ MCP (Streamable HTTP)
           ┌─────────┴──────────┐
           │ AI Agent (Claude   │
           │ Code, Cursor, MCP  │
           │ Inspector, etc.)   │
           └────────────────────┘


Both the REST API and the MCP server live inside the same Express process and read/write the same SQLite database, so a post created via an AI agent appears instantly in the dashboard, and a post edited in the dashboard is immediately visible to the agent.

## Tech stack

**Backend:** Node.js, TypeScript, Express, `node:sqlite`, JWT (`jsonwebtoken`), `@modelcontextprotocol/sdk` (Streamable HTTP transport), Zod, `cors`, `dotenv`

**Frontend:** Vite, React, TypeScript, React Router, Axios

## Project structure

quill/
├── backend/
│   ├── src/
│   │   ├── server.ts                 # Express app entrypoint (REST + MCP mounted together)
│   │   ├── db/
│   │   │   ├── database.ts           # SQLite connection
│   │   │   └── migrate.ts            # Migration runner
│   │   ├── middleware/
│   │   │   └── auth.ts               # JWT + API key authentication
│   │   ├── routes/
│   │   │   ├── auth.ts               # Signup / login
│   │   │   ├── apiKeys.ts            # Generate / list / revoke API keys
│   │   │   ├── posts.ts              # Posts CRUD, publish, analytics
│   │   │   └── mcp.ts                # POST /mcp/:apiKey — Streamable HTTP MCP endpoint
│   │   └── mcp/
│   │       └── server.ts             # MCP tool definitions (create_post, list_posts, publish_post, get_analytics)
│   └── migrations/
│       └── (migration files)
└── frontend/
    └── src/
        ├── api/                      # Axios client + typed API calls
        ├── context/                  # AuthContext (JWT session state)
        ├── components/               # Layout (top bar/nav)
        └── pages/                    # Login, Signup, Dashboard, Posts, PostEdit, Analytics, ApiKeys


## Setup

### Backend

```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:
PORT=3000
JWT_SECRET=your-secret-here
DATABASE_PATH=./data/quill.db


Run migrations automatically and start the dev server:
```bash
npm run dev
```
The server starts on `http://localhost:3000`, applying any pending SQL migrations from `migrations/` on boot.

### Frontend

```bash
cd frontend
npm install
npm run dev
```
The app starts on `http://localhost:5173`.

## REST API

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/auth/signup` | — | Create an account, returns JWT |
| POST | `/auth/login` | — | Log in, returns JWT |
| POST | `/auth/api-keys` | JWT | Generate a new API key (shown once) |
| GET | `/auth/api-keys` | JWT | List your API keys (metadata only) |
| DELETE | `/auth/api-keys/:id` | JWT | Revoke an API key |
| POST | `/posts` | JWT or API key | Create a post |
| GET | `/posts` | JWT or API key | List your posts |
| GET | `/posts/:id` | JWT or API key | Get a single post |
| PUT | `/posts/:id` | JWT or API key | Update a post |
| DELETE | `/posts/:id` | JWT or API key | Delete a post |
| POST | `/posts/:id/publish` | JWT or API key | Publish a post |
| GET | `/posts/analytics/summary` | JWT or API key | Total / draft / published counts |

## MCP server

The MCP server is exposed as a **Streamable HTTP** endpoint, mounted at:

POST /mcp/:apiKey

Each user's API key in the URL scopes every tool call to that user's data — this is each user's personal MCP server URL. No headers or extra auth flow needed for compatible clients; the key in the URL is validated on every request against the `api_keys` table.

**Available tools:**
- `create_post(title, content, status?)` — creates a post (defaults to draft)
- `list_posts(status?)` — lists the authenticated user's posts, optionally filtered by status
- `publish_post(post_id?)` — publishes a post by ID, or the most recent post if omitted
- `get_analytics()` — returns total/draft/published post counts

### Connecting an agent

1. Log into the Quill dashboard and go to **API Keys**.
2. Click **Generate New API Key** and copy it (shown only once).
3. In your MCP-compatible client (Claude Code, Cursor, MCP Inspector), add a new server with:
   - **Transport:** Streamable HTTP
   - **URL:** `http://localhost:3000/mcp/<your-api-key>`
4. The agent can now call `create_post`, `list_posts`, `publish_post`, and `get_analytics` on your behalf.

## Demo script

1. Log into the dashboard, note current post count on the Dashboard/Analytics page.
2. Connect an AI agent using your personal MCP URL as above.
3. Ask the agent: *"Create a blog post titled 'Why MCP Matters' explaining Model Context Protocol briefly, and save it as a draft."*
4. Refresh the dashboard — the new draft appears immediately.
5. Ask the agent: *"Publish my latest post."*
6. Refresh the dashboard — the post now shows as published.
7. Ask the agent: *"How many posts have I published in total?"* — confirm the answer matches the Analytics page.

This demonstrates the dashboard and the MCP server operating on the same live data, from two completely different interfaces.

## Known limitations / future work

- Not yet containerized or deployed; currently runs on localhost only.
- No post revision history — edits overwrite the post in place.
- Analytics are limited to post counts by status (no traffic/view metrics).

## License

ISC
