/**
 * Centralized runtime tuning knobs.
 * Keep all frequently adjusted limits/thresholds here for easier test tuning.
 */
export const INGESTION_KNOBS = {
  initialLookbackHours: 24,
  llmConcurrency: 10,
  minScoreToStore: 40,
  minScoreForValidation: 65,
} as const;

export const REDDIT_KNOBS = {
  perSubredditLimit: 50,
  defaultRequestLimit: 100,
  requestThrottleMs: 4000,
  contentExcerptMax: 800,
} as const;

export const SIGNALS_KNOBS = {
  minScoreToShowInUi: 85,
  validatorMinConfidenceToShow: 90,
  targetSignalsPageSize: 20,
} as const;

export const RETENTION_KNOBS = {
  signalRetentionDays: 30,
} as const;
