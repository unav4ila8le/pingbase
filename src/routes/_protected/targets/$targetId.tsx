import {
  Link as RouterLink,
  createFileRoute,
  redirect,
} from "@tanstack/react-router";

import { signalColumns } from "@/components/dashboard/signals/table/signal-columns";
import { DataTable } from "@/components/ui/custom/data-table";
import { buttonVariants } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { fetchTarget } from "@/backend/targets/fetch-target";
import { fetchTargetSignals } from "@/backend/signals/fetch-target-signals";

import { cn } from "@/lib/utils";

type TargetSignalsSearch = {
  page?: number;
};

type PaginationEntry = number | "ellipsis";

const DEFAULT_PAGE = 1;

const parsePositiveInteger = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.floor(value);
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      return Math.floor(parsed);
    }
  }

  return undefined;
};

const buildPaginationEntries = (
  page: number,
  pageCount: number,
): Array<PaginationEntry> => {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }

  const entries: Array<PaginationEntry> = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(pageCount - 1, page + 1);

  if (start > 2) {
    entries.push("ellipsis");
  }

  for (let current = start; current <= end; current += 1) {
    entries.push(current);
  }

  if (end < pageCount - 1) {
    entries.push("ellipsis");
  }

  entries.push(pageCount);
  return entries;
};

export const Route = createFileRoute("/_protected/targets/$targetId")({
  validateSearch: (search): TargetSignalsSearch => {
    const page = parsePositiveInteger(search.page);
    return typeof page === "number" ? { page } : {};
  },
  loaderDeps: ({ search }) => ({
    page: search.page ?? DEFAULT_PAGE,
  }),
  loader: async ({ params, deps }) => {
    const target = await fetchTarget({ data: { id: params.targetId } });

    if (!target) {
      throw redirect({ to: "/dashboard" });
    }

    const signalsPage = await fetchTargetSignals({
      data: { targetId: params.targetId, page: deps.page },
    });

    if (signalsPage.total > 0 && deps.page > signalsPage.pageCount) {
      throw redirect({
        to: ".",
        search: (previous) => ({
          ...previous,
          page: signalsPage.pageCount === 1 ? undefined : signalsPage.pageCount,
        }),
        replace: true,
      });
    }

    return { target, signalsPage };
  },
  component: TargetDetail,
});

function TargetDetail() {
  const navigate = Route.useNavigate();
  const { target, signalsPage } = Route.useLoaderData();
  const entries = buildPaginationEntries(
    signalsPage.page,
    signalsPage.pageCount,
  );

  const start =
    signalsPage.total === 0
      ? 0
      : (signalsPage.page - 1) * signalsPage.pageSize + 1;
  const end =
    signalsPage.total === 0
      ? 0
      : Math.min(signalsPage.total, start + signalsPage.pageSize - 1);

  const handlePageChange = (page: number) => {
    if (page === signalsPage.page) {
      return;
    }

    void navigate({
      to: ".",
      search: (previous) => ({
        ...previous,
        page: page === 1 ? undefined : page,
      }),
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-4">
        <RouterLink
          to="/dashboard"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "cursor-default",
          )}
        >
          Back
        </RouterLink>
        <div>
          <h1 className="text-2xl font-semibold">{target.name}</h1>
          <p className="text-muted-foreground text-sm">{target.description}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="text-sm font-medium">Signals</div>
        <DataTable columns={signalColumns} data={signalsPage.signals} />

        {signalsPage.pageCount > 1 ? (
          <Pagination className="justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  aria-disabled={!signalsPage.hasPreviousPage}
                  tabIndex={!signalsPage.hasPreviousPage ? -1 : undefined}
                  className={
                    !signalsPage.hasPreviousPage
                      ? "pointer-events-none opacity-50"
                      : undefined
                  }
                  onClick={(event) => {
                    event.preventDefault();
                    if (!signalsPage.hasPreviousPage) return;
                    handlePageChange(signalsPage.page - 1);
                  }}
                />
              </PaginationItem>
              {entries.map((entry, index) => (
                <PaginationItem key={`${entry}-${index}`}>
                  {entry === "ellipsis" ? (
                    <PaginationEllipsis />
                  ) : (
                    <PaginationLink
                      href="#"
                      isActive={entry === signalsPage.page}
                      onClick={(event) => {
                        event.preventDefault();
                        handlePageChange(entry);
                      }}
                    >
                      {entry}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  aria-disabled={!signalsPage.hasNextPage}
                  tabIndex={!signalsPage.hasNextPage ? -1 : undefined}
                  className={
                    !signalsPage.hasNextPage
                      ? "pointer-events-none opacity-50"
                      : undefined
                  }
                  onClick={(event) => {
                    event.preventDefault();
                    if (!signalsPage.hasNextPage) return;
                    handlePageChange(signalsPage.page + 1);
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        ) : null}

        <p className="text-muted-foreground text-end text-sm">
          {signalsPage.total === 0
            ? "0 signals"
            : `Showing ${start}-${end} of ${signalsPage.total} signals`}
        </p>
      </div>
    </div>
  );
}
