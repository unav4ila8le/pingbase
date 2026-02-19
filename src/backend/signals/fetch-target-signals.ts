import { createServerFn } from "@tanstack/react-start";
import type { SignalSummary } from "@/types/global.types";
import { SIGNALS_KNOBS } from "@/backend/config/knobs";
import { applyStrictSignalFilters } from "@/backend/signals/strict-signal-filter";
import { createClient } from "@/lib/supabase/server";

type FetchSignalsInput = {
  targetId: string;
  page?: number;
  pageSize?: number;
};

type FetchTargetSignalsPage = {
  signals: Array<SignalSummary>;
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = SIGNALS_KNOBS.targetSignalsPageSize;

const parseOptionalNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
};

const parseSignalsInput = (data: unknown): FetchSignalsInput => {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid signals payload.");
  }

  const payload = data as Record<string, unknown>;
  const targetId = typeof payload.targetId === "string" ? payload.targetId : "";
  const page = parseOptionalNumber(payload.page);
  const pageSize = parseOptionalNumber(payload.pageSize);

  if (!targetId) {
    throw new Error("Target id is required.");
  }

  return {
    targetId,
    page,
    pageSize,
  };
};

export const fetchTargetSignals = createServerFn({ method: "GET" })
  .inputValidator(parseSignalsInput)
  .handler(async ({ data }): Promise<FetchTargetSignalsPage> => {
    const page =
      typeof data.page === "number"
        ? Math.max(1, Math.floor(data.page))
        : DEFAULT_PAGE;
    const pageSize =
      typeof data.pageSize === "number"
        ? Math.max(1, Math.floor(data.pageSize))
        : DEFAULT_PAGE_SIZE;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const supabase = createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      return {
        signals: [],
        total: 0,
        page,
        pageSize,
        pageCount: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      };
    }

    const baseQuery = supabase
      .from("signals")
      .select(
        "id, platform, type, community, title, content_excerpt, score, reason, url, status, date_posted",
        { count: "exact" },
      )
      .eq("target_id", data.targetId)
      .eq("user_id", userData.user.id);

    const {
      data: signals,
      error,
      count,
    } = await applyStrictSignalFilters(baseQuery)
      .order("date_posted", { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(error.message);
    }

    const total = count ?? 0;
    const pageCount = Math.max(1, Math.ceil(total / pageSize));

    return {
      signals: (signals ?? []) as Array<SignalSummary>,
      total,
      page,
      pageSize,
      pageCount,
      hasNextPage: total > 0 && page < pageCount,
      hasPreviousPage: total > 0 && page > 1,
    };
  });
