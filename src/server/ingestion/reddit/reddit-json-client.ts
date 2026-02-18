import type { SignalCandidate } from "@/server/ingestion/types";

const REDDIT_BASE = "https://www.reddit.com";
const USER_AGENT =
  "Mozilla/5.0 (compatible; Pingbase/1.0; +https://github.com/pingbase)";
const DEFAULT_THROTTLE_MS = 5000;
const CONTENT_EXCERPT_MAX = 500;

let lastRequestTime = 0;

function throttle(ms: number): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  const wait = Math.max(0, ms - elapsed);
  lastRequestTime = now + wait;
  return wait > 0
    ? new Promise((resolve) => setTimeout(resolve, wait))
    : Promise.resolve();
}

type RedditThing = {
  kind: string;
  data: {
    id: string;
    name?: string;
    subreddit?: string;
    title?: string;
    selftext?: string;
    body?: string;
    created_utc: number;
    permalink?: string;
    [key: string]: unknown;
  };
};

type RedditListing = {
  data?: {
    children?: Array<RedditThing>;
    after?: string;
  };
};

async function fetchRedditJson(url: string): Promise<RedditListing> {
  await throttle(DEFAULT_THROTTLE_MS);

  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Reddit fetch failed: ${response.status} ${response.statusText}`,
    );
  }

  return response.json() as Promise<RedditListing>;
}

function truncate(text: string, maxLength: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return trimmed.slice(0, maxLength - 3) + "...";
}

function toSignalCandidate(thing: RedditThing): SignalCandidate | null {
  const { kind, data } = thing;
  const type = kind === "t3" ? "post" : kind === "t1" ? "comment" : null;
  if (!type || !data) return null;

  const subreddit = data.subreddit ?? "unknown";
  const externalId = data.name ?? data.id ?? thing.data.id;
  if (!externalId) return null;

  const permalink = data.permalink ?? `/${subreddit}/comments/${data.id}`;
  const url = permalink.startsWith("http")
    ? permalink
    : `${REDDIT_BASE}${permalink.startsWith("/") ? "" : "/"}${permalink}`;

  const title = type === "post" ? (data.title ?? null) : null;
  const body = type === "post" ? (data.selftext ?? "") : (data.body ?? "");
  const contentSource = body || (title ?? "");
  const contentExcerpt =
    truncate(contentSource, CONTENT_EXCERPT_MAX) || "(no content)";

  const datePosted = data.created_utc
    ? new Date(data.created_utc * 1000).toISOString()
    : new Date().toISOString();

  return {
    platform: "reddit",
    type,
    url,
    externalId,
    community: subreddit,
    title,
    contentExcerpt,
    datePosted,
    rawPayload: thing,
  };
}

function parseListingToCandidates(
  listing: RedditListing,
): Array<SignalCandidate> {
  const children = listing.data?.children ?? [];
  const candidates: Array<SignalCandidate> = [];
  for (const child of children) {
    const candidate = toSignalCandidate(child);
    if (candidate) candidates.push(candidate);
  }
  return candidates;
}

export async function fetchRedditSearch(
  query: string,
  options?: { limit?: number; sort?: string },
): Promise<Array<SignalCandidate>> {
  const limit = options?.limit ?? 100;
  const sort = options?.sort ?? "new";
  const encoded = encodeURIComponent(query.trim());
  if (!encoded) return [];
  const url = `${REDDIT_BASE}/search.json?q=${encoded}&sort=${sort}&limit=${limit}`;
  const listing = await fetchRedditJson(url);
  return parseListingToCandidates(listing);
}

export async function fetchRedditSubredditNew(
  subreddit: string,
  options?: { limit?: number },
): Promise<Array<SignalCandidate>> {
  const limit = options?.limit ?? 100;
  const clean = subreddit.replace(/^r\//, "").trim();
  if (!clean) return [];
  const url = `${REDDIT_BASE}/r/${clean}/new.json?limit=${limit}`;
  const listing = await fetchRedditJson(url);
  return parseListingToCandidates(listing);
}
