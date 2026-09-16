# job-tracker

Easy way to easily keep track of job applications on an interactive and intuitive UI.

A local job application tracker: paste a job posting link to auto-fill details, or enter them manually, then track every application in a sortable/searchable table with a full add/delete history log.

## Setup

```
npm run install:all
```

## Run (dev)

```
npm run dev
```

This starts the Express API on http://localhost:3001 and the Vite dev server on http://localhost:5173 (which proxies `/api` requests to the backend). Open http://localhost:5173.

Data is stored locally in `backend/data/job_applicator.db` (SQLite) and persists across restarts.
