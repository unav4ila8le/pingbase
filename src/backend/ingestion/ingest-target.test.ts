import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  IngestionTarget,
  ScoreSignalResult,
  SignalCandidate,
  ValidateSignalResult,
} from "@/backend/ingestion/types";
import { ingestTarget } from "@/backend/ingestion/ingest-target";

const {
  fetchRedditCandidatesMock,
  prefilterRedditCandidatesMock,
  scoreSignalCandidateMock,
  validateSignalCandidateMock,
  persistSignalsMock,
  updateTargetLastScannedAtMock,
} = vi.hoisted(() => ({
  fetchRedditCandidatesMock: vi.fn(),
  prefilterRedditCandidatesMock: vi.fn(),
  scoreSignalCandidateMock: vi.fn(),
  validateSignalCandidateMock: vi.fn(),
  persistSignalsMock: vi.fn(),
  updateTargetLastScannedAtMock: vi.fn(),
}));

vi.mock("@/backend/ingestion/reddit/fetch-reddit-signals", () => ({
  fetchRedditCandidates: fetchRedditCandidatesMock,
}));

vi.mock("@/backend/ingestion/reddit/prefilter-reddit-candidates", () => ({
  prefilterRedditCandidates: prefilterRedditCandidatesMock,
}));

vi.mock("@/backend/ingestion/score/score-signal", () => ({
  scoreSignalCandidate: scoreSignalCandidateMock,
}));

vi.mock("@/backend/ingestion/score/validate-signal", () => ({
  validateSignalCandidate: validateSignalCandidateMock,
}));

vi.mock("@/backend/ingestion/persist/persist-signals", () => ({
  persistSignals: persistSignalsMock,
}));

vi.mock("@/backend/targets/update-target-last-scanned-at", () => ({
  updateTargetLastScannedAt: updateTargetLastScannedAtMock,
}));

function makeTarget(): IngestionTarget {
  return {
    id: "target-1",
    name: "Foliofox",
    description: "Portfolio planner",
    keywords: ["portfolio", "net worth"],
    exclusions: [],
    subreddits: ["fire"],
    created_at: new Date("2026-01-01T00:00:00.000Z").toISOString(),
    last_scanned_at: null,
    user_id: "user-1",
  };
}

function makeCandidate(): SignalCandidate {
  return {
    platform: "reddit",
    type: "post",
    url: "https://reddit.com/r/fire/comments/abc123/test",
    externalId: "t3_abc123",
    community: "fire",
    title: "Should I rebalance?",
    contentExcerpt:
      "I need help deciding if this portfolio should be rebalanced.",
    datePosted: new Date().toISOString(),
    author: "user-a",
    stickied: false,
    locked: false,
    distinguished: null,
    linkFlairText: null,
    postHint: null,
    isSelf: true,
    domain: "self.fire",
    rawTextLength: 64,
    rawPayload: {},
  };
}

function makeStage1(
  overrides: Partial<ScoreSignalResult> = {},
): ScoreSignalResult {
  return {
    score: 90,
    reason: "Specific ask and strong fit.",
    specificAsk: true,
    fitGrade: "strong",
    promoRisk: "low",
    confidence: 85,
    rejectionReason: null,
    evidenceQuote: "Should I rebalance?",
    ...overrides,
  };
}

function makeValidator(
  overrides: Partial<ValidateSignalResult> = {},
): ValidateSignalResult {
  return {
    decision: "approve",
    confidence: 92,
    reason: "Clear value-first reply possible.",
    failureReason: null,
    brandMentionNatural: true,
    ...overrides,
  };
}

describe("ingestTarget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("scores, validates, persists, and updates target scan timestamp", async () => {
    const target = makeTarget();
    const candidate = makeCandidate();

    fetchRedditCandidatesMock.mockResolvedValue([candidate]);
    prefilterRedditCandidatesMock.mockReturnValue({
      accepted: [candidate],
      rejected: [],
    });
    scoreSignalCandidateMock.mockResolvedValue(makeStage1());
    validateSignalCandidateMock.mockResolvedValue(makeValidator());
    persistSignalsMock.mockResolvedValue({ inserted: 1 });
    updateTargetLastScannedAtMock.mockResolvedValue(undefined);

    const result = await ingestTarget(target);

    expect(result).toMatchObject({
      inserted: 1,
      fetchedCount: 1,
      freshCount: 1,
      prefilterAcceptedCount: 1,
      prefilterRejectedCount: 0,
      scoredCount: 1,
      validatedCount: 1,
      validatorRejectedCount: 0,
      showEligibleCount: 1,
      prefilterRejectReasons: {},
    });
    expect(fetchRedditCandidatesMock).toHaveBeenCalledWith(target);
    expect(prefilterRedditCandidatesMock).toHaveBeenCalledTimes(1);
    expect(scoreSignalCandidateMock).toHaveBeenCalledTimes(1);
    expect(validateSignalCandidateMock).toHaveBeenCalledTimes(1);
    expect(persistSignalsMock).toHaveBeenCalledTimes(1);
    expect(updateTargetLastScannedAtMock).toHaveBeenCalledWith(target.id);
  });

  it("caps score below storage threshold when validator rejects", async () => {
    const target = makeTarget();
    const candidate = makeCandidate();

    fetchRedditCandidatesMock.mockResolvedValue([candidate]);
    prefilterRedditCandidatesMock.mockReturnValue({
      accepted: [candidate],
      rejected: [],
    });
    scoreSignalCandidateMock.mockResolvedValue(makeStage1({ score: 86 }));
    validateSignalCandidateMock.mockResolvedValue(
      makeValidator({
        decision: "reject",
        reason: "Looks promotional for this context.",
        failureReason: "promo_risk_high",
      }),
    );
    persistSignalsMock.mockResolvedValue({ inserted: 0 });
    updateTargetLastScannedAtMock.mockResolvedValue(undefined);

    const result = await ingestTarget(target);

    const persistedSignals = persistSignalsMock.mock.calls[0]?.[1] as Array<{
      score: number;
      reason: string;
    }>;
    expect(persistedSignals[0]?.score).toBe(49);
    expect(persistedSignals[0]?.reason).toContain("Validator:");
    expect(result.validatorRejectedCount).toBe(1);
    expect(result.showEligibleCount).toBe(0);
  });
});
