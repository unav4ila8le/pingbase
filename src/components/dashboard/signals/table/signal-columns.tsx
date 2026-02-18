import type { ColumnDef } from "@tanstack/react-table";

import type { SignalSummary } from "@/types/global.types";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const signalColumns: Array<ColumnDef<SignalSummary>> = [
  {
    accessorKey: "date_posted",
    header: "Date",
    cell: ({ row }) => {
      const value = row.getValue("date_posted");
      const date = value ? new Date(String(value)) : null;
      return <span>{date ? date.toLocaleDateString() : "--"}</span>;
    },
  },
  {
    accessorKey: "platform",
    header: "Platform",
    cell: ({ row }) => (
      <span className="capitalize">{row.getValue("platform")}</span>
    ),
  },
  {
    id: "title",
    header: "Title / Excerpt",
    cell: ({ row }) => {
      const signal = row.original;
      return (
        <div className="flex w-40 sm:w-80 lg:w-96">
          <Tooltip>
            <TooltipTrigger
              render={
                <div className="line-clamp-2 whitespace-normal">
                  {signal.title ?? signal.content_excerpt}
                </div>
              }
            ></TooltipTrigger>
            <TooltipContent>
              {signal.title ?? signal.content_excerpt}
            </TooltipContent>
          </Tooltip>
        </div>
      );
    },
  },
  {
    accessorKey: "score",
    header: "Score",
    cell: ({ row }) => <span>{row.original.score}%</span>,
  },
  {
    id: "link",
    header: "Link",
    cell: ({ row }) => (
      <a
        className="text-primary underline underline-offset-4"
        href={row.original.url}
        target="_blank"
        rel="noreferrer"
      >
        Open
      </a>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <span className="capitalize">{row.getValue("status")}</span>
    ),
  },
];
