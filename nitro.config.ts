import { defineNitroConfig } from "nitro/config";

export default defineNitroConfig({
  experimental: {
    tasks: true,
  },
  scanDirs: ["./server"],
  scheduledTasks: {
    "*/15 * * * *": ["ingestion:run"],
    "0 0 * * *": ["retention:cleanup"],
  },
});
