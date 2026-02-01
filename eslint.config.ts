import { tanstackConfig } from "@tanstack/eslint-config";

export default [
  {
    ignores: ["node_modules/**", ".output/**", "types/database.types.ts"],
  },
  ...tanstackConfig,
  {
    rules: {
      "@typescript-eslint/no-unnecessary-condition": "off",
    },
  },
];
