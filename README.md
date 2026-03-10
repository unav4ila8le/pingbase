# Pingbase

Pingbase is a lightweight monitoring app that helps founders and teams discover **high-intent conversations** about their product, brand, or topic.

The MVP focuses on Reddit ingestion, LLM-based relevance scoring, and a clean dashboard for reviewing actionable signals.

## What It Does

- Lets each user create and manage multiple **Targets**
- Scans Reddit on a schedule (or manually via protected cron endpoints)
- Scores candidates with a two-stage OpenAI pipeline (scorer + validator)
- Stores signals for audit (score >= 40)
- Shows only strict, high-confidence signals in the UI
- Enforces strict multi-user access control with Supabase RLS

## Core Concepts

- **Target**: what you want to monitor (product, startup, brand, OSS project, person, or topic)
- **Signal**: a Reddit post/comment candidate tied to a target
- **Strict show filter**: quality gate applied before signals appear in the dashboard

## How It Works

1. Scheduled task runs every 15 minutes (`ingestion:run`)
2. Fetches Reddit candidates from:
   - `r/{subreddit}/new` if target subreddits are set
   - search query built from target keywords/name otherwise
3. Keeps only content newer than `targets.last_scanned_at` (or initial 24h lookback)
4. Prefilters obvious low-quality content
5. Stage 1 LLM scoring assigns structured `score` + `reason` + quality metadata
6. Stage 2 LLM validator checks borderline/high-scoring items with a precision-first gate
7. Persists accepted signals with dedupe on `(target_id, platform, external_id)`
8. Dashboard shows only strict high-confidence signals

Retention cleanup runs daily and deletes signals older than 30 days.

## Tech Stack

- React 19 + TypeScript
- TanStack Start / Router
- Supabase (Postgres, Auth, RLS)
- AI SDK 6 + OpenAI
- Tailwind CSS + shadcn/ui (Base UI)
- Nitro tasks for scheduling

## Quick Start

### 1. Prerequisites

- Node.js 20+
- npm
- A Supabase project
- OpenAI API key

### 2. Install

```bash
npm install
```

### 3. Configure Environment

Create `.env.local`:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_OR_ANON_KEY=your_supabase_anon_key
SUPABASE_SECRET_OR_SERVICE_ROLE_KEY=your_supabase_service_role_key
CRON_SECRET=replace_with_a_long_random_secret
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-5-mini
OPENAI_VALIDATOR_MODEL=gpt-5
```

Notes:

- `SUPABASE_SECRET_OR_SERVICE_ROLE_KEY` is server-only (never expose client-side).
- Cron routes require `Authorization: Bearer <CRON_SECRET>`.

### 4. Set Up Database

Apply migrations in order from [`supabase/migrations`](./supabase/migrations):

1. `20260201023730_initial_schema.sql`
2. `20260217121714_add_subreddits_to_target.sql`
3. `20260218072028_add_last_scanned_at_to_targets.sql`
4. `20260219015340_signal_quality_v2.sql`

You can run these via Supabase SQL Editor or your preferred migration workflow.

### 5. Run the App

```bash
npm run dev
```

Open http://localhost:3000, sign up, and create your first target.

## Manual Cron Triggers

Useful for local testing or serverless platforms where native Nitro tasks are unavailable.

### Ingestion

```bash
curl -X POST http://localhost:3000/api/cron/ingest \
  -H "Authorization: Bearer $CRON_SECRET"
```

### Retention

```bash
curl -X POST http://localhost:3000/api/cron/retention \
  -H "Authorization: Bearer $CRON_SECRET"
```

Both routes return `401 Unauthorized` if the secret is missing/invalid.

## Scripts

- `npm run dev` - start local dev server on port 3000
- `npm run build` - production build
- `npm run preview` - preview production build
- `npm run test` - run test suite
- `npm run type` - TypeScript type-check
- `npm run lint` - ESLint (`--fix`)
- `npm run format` - Prettier

## Project Structure

```text
src/
  backend/         # ingestion, scoring, auth, targets, signals logic
  components/      # app components + ui primitives
  lib/             # shared utilities + Supabase clients
  routes/          # TanStack file-based routes
server/
  api/cron/        # protected cron HTTP endpoints
  tasks/           # Nitro scheduled tasks (ingestion, retention)
supabase/
  migrations/      # database schema and RLS migrations
docs/
  mvp.md           # MVP product spec
```

## Current MVP Scope

In scope:

- Multi-target monitoring
- Reddit ingestion
- LLM-based scoring/validation
- Target + signal dashboards
- 30-day retention

Out of scope (for now):

- Automated replies
- Notifications (email/Telegram)
- Multi-source ingestion beyond Reddit
- Team roles and billing

## Security

- RLS is enabled on user-owned tables
- Service role key is used only in server-side ingestion/retention jobs
- Cron endpoints are protected by `CRON_SECRET`

## Docs

- MVP spec: [`docs/mvp.md`](./docs/mvp.md)
- Signal quality notes: [`docs/signal-quality-testing.md`](./docs/signal-quality-testing.md)
