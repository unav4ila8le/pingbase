import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import type {
  FitGrade,
  IngestionTarget,
  PromoRisk,
  ScoreSignalResult,
  SignalCandidate,
  ValidatorDecision,
} from "@/backend/ingestion/types";
import { INGESTION_KNOBS } from "@/backend/config/knobs";
import { getPrefilterRejectReason } from "@/backend/ingestion/reddit/prefilter-reddit-candidates";
import { applyScoreGuards } from "@/backend/ingestion/score/apply-score-guards";
import { isStrictShowEligible } from "@/backend/signals/strict-signal-filter";

const VALIDATOR_REJECT_MAX_SCORE = 49;
const FIXTURE_PATH = path.resolve(
  process.cwd(),
  "docs/evals/signal-goldset.json",
);

type GoldsetStage1 = {
  score: number;
  specificAsk: boolean;
  fitGrade: FitGrade;
  promoRisk: PromoRisk;
  confidence: number;
};

type GoldsetValidator = {
  decision: ValidatorDecision;
  confidence: number;
};

type GoldsetCandidate = {
  externalId: string;
  title: string;
  contentExcerpt: string;
  author: string;
  stickied: boolean;
  postHint: string | null;
  rawTextLength: number;
};

type GoldsetCase = {
  id: string;
  expected: "show" | "hide";
  rationale: string;
  candidate: GoldsetCandidate;
  stage1: GoldsetStage1;
  validator: GoldsetValidator;
};

type GoldsetFixture = {
  version: string;
  target: {
    name: string;
    description: string;
    keywords: Array<string>;
    exclusions: Array<string>;
  };
  cases: Array<GoldsetCase>;
};

function loadFixture(): GoldsetFixture {
  const raw = fs.readFileSync(FIXTURE_PATH, "utf8");
  return JSON.parse(raw) as GoldsetFixture;
}

function toTarget(fixture: GoldsetFixture): IngestionTarget {
  return {
    id: "target-eval",
    name: fixture.target.name,
    description: fixture.target.description,
    keywords: fixture.target.keywords,
    exclusions: fixture.target.exclusions,
    subreddits: [],
    created_at: new Date("2026-01-01T00:00:00.000Z").toISOString(),
    last_scanned_at: null,
    user_id: "eval-user",
  };
}

function toCandidate(item: GoldsetCase["candidate"]): SignalCandidate {
  return {
    platform: "reddit",
    type: "post",
    url: `https://reddit.com/r/fire/comments/${item.externalId}/eval`,
    externalId: item.externalId,
    community: "fire",
    title: item.title,
    contentExcerpt: item.contentExcerpt,
    datePosted: new Date("2026-02-18T10:00:00.000Z").toISOString(),
    author: item.author,
    stickied: item.stickied,
    locked: false,
    distinguished: null,
    linkFlairText: null,
    postHint: item.postHint,
    isSelf: true,
    domain: "self.fire",
    rawTextLength: item.rawTextLength,
    rawPayload: {},
  };
}

function toStage1(item: GoldsetStage1): ScoreSignalResult {
  return {
    score: item.score,
    reason: "fixture",
    specificAsk: item.specificAsk,
    fitGrade: item.fitGrade,
    promoRisk: item.promoRisk,
    confidence: item.confidence,
    rejectionReason: null,
    evidenceQuote: null,
  };
}

function evaluateCase(
  target: IngestionTarget,
  scenario: GoldsetCase,
): { predicted: "show" | "hide"; prefilterReason: string | null } {
  const candidate = toCandidate(scenario.candidate);
  const prefilterReason = getPrefilterRejectReason(
    candidate,
    target.exclusions,
  );
  if (prefilterReason) {
    return { predicted: "hide", prefilterReason };
  }

  const guardedStage1 = applyScoreGuards(toStage1(scenario.stage1));
  let finalScore = guardedStage1.score;

  if (
    finalScore >= INGESTION_KNOBS.minScoreForValidation &&
    scenario.validator.decision === "reject"
  ) {
    finalScore = Math.min(finalScore, VALIDATOR_REJECT_MAX_SCORE);
  }

  const predictedShow = isStrictShowEligible({
    score: finalScore,
    specificAsk: guardedStage1.specificAsk,
    fitGrade: guardedStage1.fitGrade,
    promoRisk: guardedStage1.promoRisk,
    validatorDecision: scenario.validator.decision,
    validatorConfidence: scenario.validator.confidence,
  });

  return {
    predicted: predictedShow ? "show" : "hide",
    prefilterReason: null,
  };
}

describe("signal quality goldset", () => {
  it("meets precision target on deterministic policy evaluation", () => {
    const fixture = loadFixture();
    const target = toTarget(fixture);

    let truePositives = 0;
    let falsePositives = 0;
    let predictedShows = 0;
    let expectedShows = 0;

    for (const scenario of fixture.cases) {
      if (scenario.expected === "show") expectedShows += 1;
      const result = evaluateCase(target, scenario);

      if (result.predicted === "show") {
        predictedShows += 1;
        if (scenario.expected === "show") {
          truePositives += 1;
        } else {
          falsePositives += 1;
        }
      }
    }

    const precision = predictedShows === 0 ? 1 : truePositives / predictedShows;

    expect(expectedShows).toBeGreaterThan(0);
    expect(predictedShows).toBeGreaterThan(0);
    expect(falsePositives).toBe(0);
    expect(precision).toBeGreaterThanOrEqual(0.9);
  });

  it("matches expected show/hide labels for each goldset case", () => {
    const fixture = loadFixture();
    const target = toTarget(fixture);

    for (const scenario of fixture.cases) {
      const result = evaluateCase(target, scenario);
      expect(result.predicted, `case: ${scenario.id}`).toBe(scenario.expected);
    }
  });
});
