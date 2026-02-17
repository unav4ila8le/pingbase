# AGENTS Guidelines for This Repository

## Project Context

- Pingbase is a TanStack Start app for monitoring online conversations (MVP: Reddit).
- Stack: React 19, TypeScript, TanStack Start/Router, Supabase, shadcn/ui with Base UI, Tailwind CSS.
- Deployment: host-agnostic (Netlify/Cloudflare/Railway/Vercel compatible).
- Canonical data model: `targets` and `signals` (signals duplicate per target).
- MVP retention: 30 days for signals and raw payloads.
- LLM: AI SDK 6 with OpenAI as the initial provider (model-agnostic by design).

## Development Principles

- Favor server-first patterns (route loaders, `beforeLoad`, `createServerFn`).
- Keep server logic in `src/server/`; keep shared utilities in `src/lib/`.
- Keep Supabase usage explicit and typed; avoid hidden global clients.
- Avoid `use client`/`use server` directives (TanStack Start does not require them).
- Optimize for clarity and correctness over abstraction.

## Architecture

- Routes live in `src/routes/` with file-based routing (route groups like `_protected`).
- Shared UI in `src/components/`; shadcn/ui lives in `src/components/ui` (do not modify).
- Supabase clients:
  - Browser: `src/lib/supabase/client.ts`
  - Server: `src/lib/supabase/server.ts`
- Server-side actions/loaders should call `createServerFn` and use the server client.
- Auth gating uses `beforeLoad` in protected routes.
- Shared protected layout lives in `src/routes/_protected.tsx` and should render `Outlet`.

## Data Model Notes

- `targets` table: user-owned, flexible naming (Target is canonical).
- `signals` table: includes `target_id`, `platform`, `external_id`, `score`, `reason`, and `raw_payload`.
- Deduplication key: `(platform, external_id, target_id)`.
- UI shows scores >= 70; store scores >= 40 for audit.

## Supabase & RLS

- Multi-user with strict RLS; every user-owned table includes `user_id`.
- Prefer policy checks like `(SELECT auth.uid()) = user_id` to avoid initplan warnings.
- Service-role keys are for server-only jobs; never in client code.

## LLM & Ingestion

- Structured JSON output is required for `score` + `reason`.
- Use Target name, description, keywords, exclusions, and subreddits for discovery + prompt context.
- Ingestion is modular; only Reddit for MVP but designed for new sources later.
- Structured output uses `generateText` with `Output.object()` (AI SDK 6 best practice).

## Scheduling & Retention

- Periodic scans run via app-level cron (not DB cron).
- Retention cleanup should be a scheduled job alongside ingestion.

## TypeScript & Code Style

- Use interfaces for component props and public APIs.
- Use types for unions, helpers, and Supabase-generated types.
- Prefer named exports (routes may use default if required by framework).
- Avoid TypeScript enums; use const maps/unions instead.
- Keep booleans explicit (`includeSignals: true`) instead of positional flags.

## Import Order

```typescript
// 1. External Dependencies
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

// 2. UI Components
import { Button } from "@/components/ui/button";

// 3. Custom Components
import { TargetCard } from "@/components/targets/target-card";

// 4. Internal Modules
import { fetchTargets } from "@/server/targets/fetch-targets";

// 5. Local Files and Types
import type { Target } from "@/types/global.types";
```

## File Naming

- Use kebab-case for files and directories.
- Suffix test files with `.test.ts` or `.test.tsx`.
