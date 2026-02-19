import type {
  IngestionTarget,
  SignalCandidate,
} from "@/backend/ingestion/types";

export type PrefilterRejectReason =
  | "automoderator"
  | "stickied"
  | "megathread"
  | "low_context_link_post"
  | "no_meaningful_text"
  | "excluded_term";

export type PrefilterRejectedCandidate = {
  candidate: SignalCandidate;
  reason: PrefilterRejectReason;
};

export type PrefilterRedditCandidatesResult = {
  accepted: Array<SignalCandidate>;
  rejected: Array<PrefilterRejectedCandidate>;
};

const MEGATHREAD_PATTERN =
  /\b(daily|weekly|monthly|megathread|discussion thread|general discussion|what are you buying|weekend discussion)\b/i;

const LOW_CONTEXT_POST_HINTS = new Set([
  "image",
  "link",
  "hosted:video",
  "rich:video",
]);

const MIN_TEXT_LENGTH = 25;
const MIN_LINK_CONTEXT_LENGTH = 80;

function normalizeTerms(
  terms: Array<string> | null | undefined,
): Array<string> {
  return (terms ?? []).map((term) => term.trim().toLowerCase()).filter(Boolean);
}

function hasExcludedTerm(
  candidate: SignalCandidate,
  exclusions: Array<string>,
): boolean {
  if (exclusions.length === 0) return false;
  const text =
    `${candidate.title ?? ""}\n${candidate.contentExcerpt}`.toLowerCase();
  return exclusions.some((term) => text.includes(term));
}

export function getPrefilterRejectReason(
  candidate: SignalCandidate,
  exclusions: Array<string>,
): PrefilterRejectReason | null {
  if (candidate.author?.toLowerCase() === "automoderator") {
    return "automoderator";
  }

  if (candidate.stickied) {
    return "stickied";
  }

  if (candidate.title && MEGATHREAD_PATTERN.test(candidate.title)) {
    return "megathread";
  }

  if (
    candidate.type === "post" &&
    candidate.postHint &&
    LOW_CONTEXT_POST_HINTS.has(candidate.postHint.toLowerCase()) &&
    candidate.rawTextLength < MIN_LINK_CONTEXT_LENGTH
  ) {
    return "low_context_link_post";
  }

  if (
    candidate.rawTextLength < MIN_TEXT_LENGTH &&
    !candidate.contentExcerpt.includes("?")
  ) {
    return "no_meaningful_text";
  }

  if (hasExcludedTerm(candidate, exclusions)) {
    return "excluded_term";
  }

  return null;
}

export function prefilterRedditCandidates(
  target: IngestionTarget,
  candidates: Array<SignalCandidate>,
): PrefilterRedditCandidatesResult {
  const exclusions = normalizeTerms(target.exclusions);
  const accepted: Array<SignalCandidate> = [];
  const rejected: Array<PrefilterRejectedCandidate> = [];

  for (const candidate of candidates) {
    const reason = getPrefilterRejectReason(candidate, exclusions);
    if (reason) {
      rejected.push({ candidate, reason });
      continue;
    }
    accepted.push(candidate);
  }

  return { accepted, rejected };
}
