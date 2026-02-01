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

- Edit Target fields (name, description, keywords, exclusions)
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
  Short excerpt (~280–500 chars) from the post body or comment body.

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
- Use the official Reddit API.
- The initial scope should be **as open as possible** while remaining practical.
- Discovery can be based on:
  - broad subreddit coverage
  - keyword/search queries derived from the Target definition

The system should be designed so that additional sources can be added later.

---

## Signal Collection Flow (High-Level)

1. Periodic scan (~every 15 minutes)
2. Fetch new posts/comments from Reddit
3. Deduplicate using platform + external_id + target_id
4. Evaluate relevance using an LLM
5. Assign score and reason
6. Store accepted signals
7. Display in the dashboard

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

---

## LLM Requirements

- Structured output (JSON) for `score` + `reason` at minimum.
- Use Target name, description, keywords, and exclusions in the prompt.

---

## Scheduling Constraint

- The periodic scan should run via **app-level cron**, not database cron.
- The solution should be portable across hosts (Netlify/Cloudflare/Railway).

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
- Reddit ingestion strategy details
- LLM prompt design and output schema
- How much historical data to retain

These are intentionally left open.

---

## Draft Phases (Internal)

1. **Foundations**: data model, RLS, supabase types, repo conventions, AGENTS.md
2. **Targets**: CRUD, dashboard cards, routing for target detail
3. **Signals UI**: target page table + status updates + filtering
4. **Ingestion**: Reddit fetch + dedupe + LLM scoring + persistence
5. **Ops**: app-level cron, retention cleanup, error logging
