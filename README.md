# job-tracker

Easy way to easily keep track of job applications on an interactive and intuitive UI.

A local job application tracker: paste a job posting link to auto-fill details, or enter them manually, then track every application in a sortable/searchable table with a full add/delete history log.

## Setup

```
npm run install:all
```

The backend needs a Postgres database. Set `DATABASE_URL` in `backend/.env` (a free instance from [Neon](https://neon.tech), [Supabase](https://supabase.com), or `vercel postgres` all work):

```
# backend/.env
DATABASE_URL=postgres://user:password@host/dbname
```

Tables and columns are created automatically on first run.

## Run (dev)

```
npm run dev
```

This starts the Express API on http://localhost:3001 and the Vite dev server on http://localhost:5173 (which proxies `/api` requests to the backend). Open http://localhost:5173.

## Deploy (Vercel)

The repo's root `vercel.json` builds the Vite frontend as a static site and the Express backend (`backend/api/index.js`) as a serverless function, both under one Vercel project/domain — import the repo as-is, no root directory override needed.

Before deploying, add `DATABASE_URL` as an environment variable in the Vercel project settings (pointing at the same kind of hosted Postgres instance used for local dev — a `sslmode=require` connection string works out of the box).
