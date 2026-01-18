import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.

    {
    rules: {
      // ⛔ any قرمز نشه، فقط هشدار بده
      // "@typescript-eslint/no-explicit-any": "warn",

      // // ⛔ unused vars قرمز نشه اگر با _ شروع بشه
      // "@typescript-eslint/no-unused-vars": [
      //   "warn",
      //   { argsIgnorePattern: "^_" },
      // ],

      // ⛔ import استفاده نشده قرمز نشه
      "no-unused-vars": "off",

      // ⛔ console.log فقط warning
      // "no-console": "warn",
    },
  },



  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
