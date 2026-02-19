import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  IngestionTarget,
  ScoredSignalCandidate,
} from "@/backend/ingestion/types";
import { persistSignals } from "@/backend/ingestion/persist/persist-signals";

const { selectMock, upsertMock, fromMock, createServiceClientMock } =
  vi.hoisted(() => {
    const localSelectMock = vi.fn();
    const localUpsertMock = vi.fn(
      (_rows: Array<Record<string, unknown>>, _options: unknown) => ({
        select: localSelectMock,
      }),
    );
    const localFromMock = vi.fn(() => ({ upsert: localUpsertMock }));
    const localCreateServiceClientMock = vi.fn(() => ({
      from: localFromMock,
    }));

    return {
      selectMock: localSelectMock,
      upsertMock: localUpsertMock,
      fromMock: localFromMock,
      createServiceClientMock: localCreateServiceClientMock,
    };
  });

vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: createServiceClientMock,
}));

function makeTarget(): IngestionTarget {
  return {
    id: "target-1",
    name: "Foliofox",
    description: "Portfolio intelligence",
    keywords: ["portfolio"],
    exclusions: [],
    subreddits: ["fire"],
    created_at: new Date("2026-01-01T00:00:00.000Z").toISOString(),
    last_scanned_at: null,
    user_id: "user-1",
  };
}

function makeSignal(
  overrides: Partial<ScoredSignalCandidate> = {},
): ScoredSignalCandidate {
  return {
    platform: "reddit",
    type: "post",
    url: "https://reddit.com/r/fire/comments/abc123/test",
    externalId: "t3_abc123",
    community: "fire",
    title: "Portfolio question",
    contentExcerpt: "How should I rebalance my portfolio?",
    datePosted: new Date("2026-02-18T10:00:00.000Z").toISOString(),
    author: "user-a",
    stickied: false,
    locked: false,
    distinguished: null,
    linkFlairText: null,
    postHint: null,
    isSelf: true,
    domain: "self.fire",
    rawTextLength: 36,
    rawPayload: {},
    score: 82,
    reason: "Strong actionable fit.",
    stage1: {
      score: 82,
      reason: "Strong actionable fit.",
      specificAsk: true,
      fitGrade: "strong",
      promoRisk: "low",
      confidence: 88,
      rejectionReason: null,
      evidenceQuote: "How should I rebalance my portfolio?",
    },
    validator: {
      decision: "approve",
      confidence: 84,
      reason: "Good value-first response possible.",
      failureReason: null,
      brandMentionNatural: true,
    },
    ...overrides,
  };
}

describe("persistSignals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectMock.mockResolvedValue({ data: [{ id: "signal-1" }], error: null });
  });

  it("stores structured scoring and validator fields for score >= min threshold", async () => {
    const target = makeTarget();
    const signal = makeSignal();

    const result = await persistSignals(target, [signal]);

    expect(result).toEqual({ inserted: 1 });
    expect(fromMock).toHaveBeenCalledWith("signals");

    const firstUpsertCall = upsertMock.mock.calls[0];
    expect(firstUpsertCall).toBeDefined();
    const upsertRows = firstUpsertCall?.[0] ?? [];
    expect(upsertRows).toHaveLength(1);
    expect(upsertRows[0]).toMatchObject({
      target_id: target.id,
      user_id: target.user_id,
      score: 82,
      reason: "Strong actionable fit.",
      specific_ask: true,
      fit_grade: "strong",
      promo_risk: "low",
      scorer_confidence: 88,
      rejection_reason: null,
      evidence_quote: "How should I rebalance my portfolio?",
      stage1_score: 82,
      validator_decision: "approve",
      validator_confidence: 84,
      validator_reason: "Good value-first response possible.",
      score_version: "v2",
    });
  });

  it("skips persistence for signals below score threshold", async () => {
    const target = makeTarget();
    const signal = makeSignal({ score: 39 });

    const result = await persistSignals(target, [signal]);

    expect(result).toEqual({ inserted: 0 });
    expect(createServiceClientMock).not.toHaveBeenCalled();
    expect(upsertMock).not.toHaveBeenCalled();
  });
});
