import { describe, expect, it } from "vitest";

import type {
  IngestionTarget,
  SignalCandidate,
} from "@/backend/ingestion/types";
import {
  getPrefilterRejectReason,
  prefilterRedditCandidates,
} from "@/backend/ingestion/reddit/prefilter-reddit-candidates";

function makeTarget(overrides: Partial<IngestionTarget> = {}): IngestionTarget {
  return {
    id: "target-1",
    name: "Foliofox",
    description: "Portfolio analytics and planning",
    keywords: ["portfolio tracker", "net worth"],
    exclusions: [],
    subreddits: ["fire"],
    created_at: new Date("2026-01-01T00:00:00.000Z").toISOString(),
    last_scanned_at: null,
    user_id: "user-1",
    ...overrides,
  };
}

function makeCandidate(
  overrides: Partial<SignalCandidate> = {},
): SignalCandidate {
  return {
    platform: "reddit",
    type: "post",
    url: "https://reddit.com/r/fire/comments/abc123/test",
    externalId: "t3_abc123",
    community: "fire",
    title: "How should I plan my portfolio?",
    contentExcerpt: "I need help planning retirement allocations in my 401k.",
    datePosted: new Date("2026-02-18T10:00:00.000Z").toISOString(),
    author: "some-user",
    stickied: false,
    locked: false,
    distinguished: null,
    linkFlairText: null,
    postHint: null,
    isSelf: true,
    domain: "self.fire",
    rawTextLength: 58,
    rawPayload: {},
    ...overrides,
  };
}

describe("getPrefilterRejectReason", () => {
  it("rejects AutoModerator posts", () => {
    const reason = getPrefilterRejectReason(
      makeCandidate({ author: "AutoModerator" }),
      [],
    );
    expect(reason).toBe("automoderator");
  });

  it("rejects stickied posts", () => {
    const reason = getPrefilterRejectReason(makeCandidate({ stickied: true }), []);
    expect(reason).toBe("stickied");
  });

  it("rejects likely megathreads by title pattern", () => {
    const reason = getPrefilterRejectReason(
      makeCandidate({ title: "Daily Discussion Thread - Monday" }),
      [],
    );
    expect(reason).toBe("megathread");
  });

  it("rejects low-context image/link posts", () => {
    const reason = getPrefilterRejectReason(
      makeCandidate({
        postHint: "image",
        rawTextLength: 12,
        contentExcerpt: "Here is my chart",
      }),
      [],
    );
    expect(reason).toBe("low_context_link_post");
  });

  it("rejects candidates matching exclusion terms", () => {
    const reason = getPrefilterRejectReason(
      makeCandidate({
        title: "Looking for beta testers for my app",
      }),
      ["beta tester"],
    );
    expect(reason).toBe("excluded_term");
  });
});

describe("prefilterRedditCandidates", () => {
  it("keeps only candidates that pass all rules", () => {
    const target = makeTarget({ exclusions: ["giveaway"] });
    const candidates = [
      makeCandidate(),
      makeCandidate({ author: "AutoModerator", externalId: "t3_mod" }),
      makeCandidate({
        title: "Weekly Discussion Thread",
        externalId: "t3_thread",
      }),
      makeCandidate({
        title: "Giveaway for portfolio templates",
        externalId: "t3_exclusion",
      }),
    ];

    const result = prefilterRedditCandidates(target, candidates);

    expect(result.accepted).toHaveLength(1);
    expect(result.rejected).toHaveLength(3);
    expect(result.accepted[0]?.externalId).toBe("t3_abc123");
  });
});
