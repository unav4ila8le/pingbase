import type { ColumnDef } from "@tanstack/react-table";

import type { SignalSummary } from "@/types/global.types";

export const signalColumns: Array<ColumnDef<SignalSummary>> = [
  {
    accessorKey: "date_posted",
    header: "Date",
    cell: ({ row }) => {
      const value = row.getValue("date_posted");
      const date = value ? new Date(String(value)) : null;
      return (
        <span className="text-muted-foreground text-xs">
          {date ? date.toLocaleDateString() : "--"}
        </span>
      );
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
        <span className="line-clamp-2">
          {signal.title ?? signal.content_excerpt}
        </span>
      );
    },
  },
  {
    accessorKey: "score",
    header: "Score",
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
