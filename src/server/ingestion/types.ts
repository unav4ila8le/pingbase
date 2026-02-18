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

export type SignalCandidate = {
  platform: "reddit";
  type: "post" | "comment";
  url: string;
  externalId: string;
  community: string;
  title: string | null;
  contentExcerpt: string;
  datePosted: string;
  rawPayload: unknown;
};

export type ScoredSignalCandidate = SignalCandidate & {
  score: number;
  reason: string;
};
