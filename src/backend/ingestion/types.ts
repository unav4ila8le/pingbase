import type { Target } from "@/types/global.types";

export type IngestionTarget = Pick<
  Target,
  | "id"
  | "name"
  | "description"
  | "keywords"
  | "exclusions"
  | "subreddits"
  | "created_at"
  | "last_scanned_at"
  | "user_id"
>;

export type FitGrade = "none" | "partial" | "strong";
export type PromoRisk = "low" | "medium" | "high";
export type ValidatorDecision = "approve" | "reject";

export type SignalCandidate = {
  platform: "reddit";
  type: "post" | "comment";
  url: string;
  externalId: string;
  community: string;
  title: string | null;
  contentExcerpt: string;
  datePosted: string;
  author: string | null;
  stickied: boolean;
  locked: boolean;
  distinguished: string | null;
  linkFlairText: string | null;
  postHint: string | null;
  isSelf: boolean;
  domain: string | null;
  rawTextLength: number;
  rawPayload: unknown;
};

export type ScoreSignalResult = {
  score: number;
  reason: string;
  specificAsk: boolean;
  fitGrade: FitGrade;
  promoRisk: PromoRisk;
  confidence: number;
  rejectionReason: string | null;
  evidenceQuote: string | null;
};

export type ValidateSignalResult = {
  decision: ValidatorDecision;
  confidence: number;
  reason: string;
  failureReason: string | null;
  brandMentionNatural: boolean;
};

export type ScoredSignalCandidate = SignalCandidate & {
  score: number;
  reason: string;
  stage1?: ScoreSignalResult;
  validator?: ValidateSignalResult | null;
};
