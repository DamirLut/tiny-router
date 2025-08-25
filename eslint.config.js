import js from "@eslint/js";
import * as importPlugin from "eslint-plugin-import";
import prettier from "eslint-plugin-prettier/recommended";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import ts from "typescript-eslint";

import pkg from "./package.json" with { type: "json" };

export default ts.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/vite.config.*",
      "test/**",
      "**/*.test.ts",
      "**/*.test.tsx",
      "build.ts",
      "happydom.ts",
      "testing-library.ts",
      "matchers.d.ts",
    ],
  },
  js.configs.recommended,
  ...ts.configs.recommendedTypeChecked,
  prettier,
  {
    plugins: {
      "simple-import-sort": simpleImportSort,
      import: importPlugin,
      "@typescript-eslint": ts.plugin,
    },
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.app.json", "./tsconfig.lib.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Keep noise low
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/no-redundant-type-constituents": "off",
      // Added complexity/readability constraints (warn-only)
      complexity: ["warn", 12],
      "max-lines-per-function": [
        "warn",
        { max: 150, skipBlankLines: true, skipComments: true },
      ],
      "@typescript-eslint/max-params": ["warn", { max: 4 }],
      "simple-import-sort/imports": [
        "warn",
        {
          groups: [
            ["^react", "^@?\\w"],
            [`^(${pkg.name})(/.*|$)`],
            ["^\\u0000"],
            ["^\\.\\.(?!/?$)", "^\\.\\./?$"],
            ["^\\./(?=.*/)(?!/?$)", "^\\.(?!/?$)", "^\\./?$"],
            ["^.+\\.s?css$"],
          ],
        },
      ],
    },
  },
  {
    files: ["**/*.js"],
    extends: [ts.configs.disableTypeChecked],
  },
  {
    files: ["happydom.ts", "testing-library.ts", "matchers.d.ts"],
    languageOptions: { parserOptions: { project: null } },
  },
);
