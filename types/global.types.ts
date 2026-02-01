import type { Tables, TablesInsert, TablesUpdate } from "./database.types";

export type Profile = Tables<"profiles">;

export type Target = Tables<"targets">;
export type TargetInsert = TablesInsert<"targets">;
export type TargetUpdate = TablesUpdate<"targets">;

export type Signal = Tables<"signals">;
export type SignalInsert = TablesInsert<"signals">;
export type SignalUpdate = TablesUpdate<"signals">;

export type SignalSummary = Pick<
  Signal,
  | "id"
  | "platform"
  | "type"
  | "community"
  | "title"
  | "content_excerpt"
  | "score"
  | "reason"
  | "url"
  | "status"
  | "date_posted"
>;
