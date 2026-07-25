import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: [
      "**/dist/**",
      "**/coverage/**",
      "**/node_modules/**",
      "**/.vite/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    files: [
      "tests/acceptance/phase-1/**/*-browser-acceptance.js",
    ],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    files: [
      "tests/acceptance/phase-1/**/*.mjs",
      "scripts/**/*.mjs",
      "deploy/**/*.mjs",
    ],
    languageOptions: {
      globals: {
        ...globals.node,
        Blob: "readonly",
        File: "readonly",
        FormData: "readonly",
        fetch: "readonly",
        URL: "readonly",
      },
    },
  },
];
