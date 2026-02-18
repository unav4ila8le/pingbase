import {
  fetchRedditSearch,
  fetchRedditSubredditNew,
} from "./reddit-json-client";
import { REDDIT_KNOBS } from "@/backend/config/knobs";
import type {
  IngestionTarget,
  SignalCandidate,
} from "@/backend/ingestion/types";

export async function fetchRedditCandidates(
  target: IngestionTarget,
): Promise<Array<SignalCandidate>> {
  const subreddits = target.subreddits?.filter(Boolean) ?? [];

  if (subreddits.length > 0) {
    const allCandidates: Array<SignalCandidate> = [];
    for (const sub of subreddits) {
      const candidates = await fetchRedditSubredditNew(sub, {
        limit: REDDIT_KNOBS.perSubredditLimit,
      });
      allCandidates.push(...candidates);
    }
    return dedupeByExternalId(allCandidates);
  }

  const query = buildSearchQuery(target);
  if (!query) return [];

  return fetchRedditSearch(query, {
    sort: "new",
    limit: REDDIT_KNOBS.defaultRequestLimit,
  });
}

function dedupeByExternalId(
  candidates: Array<SignalCandidate>,
): Array<SignalCandidate> {
  const seen = new Set<string>();
  return candidates.filter((c) => {
    if (seen.has(c.externalId)) return false;
    seen.add(c.externalId);
    return true;
  });
}

function buildSearchQuery(target: IngestionTarget): string {
  const parts: Array<string> = [];

  if (target.keywords?.length) {
    parts.push(...target.keywords.filter(Boolean));
  }

  if (parts.length === 0) {
    parts.push(target.name);
  }

  return parts.join(" ").trim();
}
