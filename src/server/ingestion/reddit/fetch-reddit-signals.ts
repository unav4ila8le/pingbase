import { fetchRedditSearch } from "./reddit-json-client";
import type {
  IngestionTarget,
  SignalCandidate,
} from "@/server/ingestion/types";

export async function fetchRedditCandidates(
  target: IngestionTarget,
): Promise<Array<SignalCandidate>> {
  const query = buildSearchQuery(target);
  if (!query) return [];

  const candidates = await fetchRedditSearch(query, {
    sort: "new",
    limit: 100,
  });

  return candidates;
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
