# Pingbase — MVP Specification

## Goal

Pingbase is a lightweight system that monitors online conversations (starting with Reddit) and surfaces **relevant, high-intent signals** related to a user-defined **Target**.

A Target can represent:

- a product or startup
- a brand
- an open-source project
- a person or organization
- a topic or domain

The MVP focuses on:

- multi-target support
- periodic signal collection
- relevance scoring via LLM
- a simple dashboard to review signals
- multi-user support with strict RLS

Automated posting or replies are explicitly out of scope.

---

## Core Concepts

### Target

A **Target** represents what the user wants to receive signals for.

The system should **not assume** that a Target is strictly a “brand”.

**DB naming (preferred):** `targets` and `signals`.
All logic and naming should remain flexible.

---

## Target Fields (MVP)

When creating a new Target, the user provides:

- **Name** (required)  
  Human-readable identifier.

- **Description** (required)  
  Short explanation of what the Target is and what problem it solves.  
  This is the **primary semantic input** for relevance scoring.

- **URL** (optional)  
  Canonical website or reference link.

- **Keywords / Phrases** (optional)  
  Terms strongly associated with the Target.  
  These guide discovery and LLM context but are **not strict filters**.

- **Exclusions** (optional)  
  Words or phrases that usually indicate irrelevant signals  
  (e.g. giveaways, job postings, spam).  
  These guide discovery and LLM context but are **not strict filters**.

---

## Dashboard Structure

### After Login

The user sees a general dashboard containing:

- A list/grid of **Target cards**
- Each card displays:
  - Target name
  - Short description
  - Count of signals found (total / new)

From here, the user can:

- Create a new Target
- Open an existing Target

---

## Target Page

Clicking a Target opens its dedicated page.

### Signals Table

Each row represents a **Signal** detected by the system.

Minimum columns:

- Platform (e.g. Reddit)
- Community (e.g. subreddit)
- Title or excerpt
- Relevance score (0–100)
- Reason (short explanation)
- Link to original content
- Status

Signals are read-only in MVP (no replies or automation).

### Target Settings

On the same page or a secondary tab, the user can:

- Edit Target fields (name, description, keywords, exclusions, subreddits)
- View source configuration (read-only for MVP)
- See last scan time

Telegram integration is **not part of MVP**, but the UI should allow for it later.

---

## Signal Acceptance Threshold

- Default minimum score to **show to users**: **70**
- Store signals for auditing starting at **40**
- For MVP, thresholds are global defaults (per-target settings later).

---

## Signal Data Model (MVP)

For each stored signal, persist:

- **target_id**  
  Foreign key to the Target that matched (signals are duplicated per Target).

- **platform**  
  (e.g. `reddit`)

- **type**  
  `post | comment`

- **url**  
  Canonical permalink to the original content.

- **external_id**  
  Platform-specific identifier (used for deduplication).

- **community**  
  e.g. subreddit name.

- **title**  
  Nullable. Present for posts, null for comments.

- **content_excerpt**  
  Required.  
  Short excerpt (~280–800 chars) from the post body or comment body.

- **date_posted**  
  Original creation timestamp.

- **score**  
  Integer from 0–100.

- **reason**  
  Short LLM-generated explanation of why this signal matched the Target.

- **status** (user-set)  
  `new | ignored | replied`  
  Default: `new`.

- **raw_payload**  
  JSON blob containing the original platform response.  
  Stored for auditing, debugging, and potential re-scoring.

UI rule: display **title if present**, otherwise display `content_excerpt`.  
UI rule: show scores **>= 70**; scores **40–69** are hidden but retained.

---

## Reddit Scope (MVP)

- Reddit is the only source in MVP.
- Use Reddit's public `.json` endpoints (no API key required). Reddit no longer issues API keys to the public; we use the `.json` URL suffix workaround (e.g. `reddit.com/search.json?q=...`, `reddit.com/r/{sub}/new.json`) with throttling (~5s between requests) to stay within unauthenticated rate limits.
- The initial scope should be **as open as possible** while remaining practical.
- Discovery can be based on:
  - r/all new feed (light scan)
  - keyword/search queries derived from the Target definition

The system should be designed so that additional sources can be added later.

---

## Signal Collection Flow (High-Level)

1. Periodic scan (~every 15 minutes)
2. Fetch via Reddit `.json` endpoints (search + subreddit/new)
3. **Time window:** Only process posts newer than `targets.last_scanned_at`. First run (null): use 24 hours before `targets.created_at` as cutoff. After each run, set `last_scanned_at` to now.
4. Deduplicate using platform + external_id + target_id
5. Evaluate relevance using an LLM (actionability-focused; score candidates in parallel, e.g. 5–10 concurrent)
6. Assign score and reason
7. Store accepted signals (score >= 40)
8. Display in the dashboard (score >= 70)

---

## Non-Goals (MVP)

- No automated replies or posting
- No notifications (Telegram/email later)
- No multi-source ingestion
- No teams or roles
- No billing
- No advanced analytics

---

## Storage & Retention

- Retain signals for **30 days** (prune older data).
- Raw payloads follow the same retention window.
- Retention cleanup runs via **Nitro scheduled task** (daily at midnight UTC).

---

## LLM Requirements

- Use AI SDK 6 (provider-agnostic) with OpenAI as the initial provider.
- Structured output (JSON) for `score` + `reason` at minimum.
- Use Target name, description, keywords, exclusions, and subreddits in the prompt.
- **Scoring criterion:** ACTIONABILITY — score high only when the post has a specific question/need the target addresses and a reply would feel helpful, not promotional. Deprioritize daily threads, meta posts, generic discussions.
- **Performance:** Score candidates in parallel (e.g. 5–10 concurrent calls) instead of sequentially.

---

## Scheduling Constraint

- The periodic scan should run via **app-level cron**, not database cron.
- We use Nitro scheduled tasks (`scheduledTasks`) for ingestion and retention jobs.
- The solution should be portable across hosts (Netlify/Cloudflare/Railway).
- **Serverless note:** Nitro scheduled tasks may not run natively on Netlify/Vercel; use platform cron (e.g. Netlify Scheduled Functions, Vercel Cron) to call a protected API route that runs the task.

---

## Design Principles

- Model-agnostic (LLM provider should be swappable)
- No vendor lock-in assumptions
- Clear separation between ingestion logic and UI
- Favor correctness and clarity over aggressive automation

---

## Expected Follow-ups

The coding agent is expected to ask about:

- Final naming consistency (Target vs internal naming)
- LLM prompt design and output schema
- How much historical data to retain

These are intentionally left open. (Reddit ingestion strategy: resolved — we use `.json` endpoints.)

---

## Draft Phases (Internal)

1. **Foundations**: data model, RLS, supabase types, repo conventions, AGENTS.md
2. **Targets**: CRUD, dashboard cards, routing for target detail
3. **Signals UI**: target page table + status updates + filtering
4. **Ingestion**: Reddit `.json` fetch + dedupe + LLM scoring + persistence
5. **Ops**: Nitro ingestion task, retention cleanup, error logging
