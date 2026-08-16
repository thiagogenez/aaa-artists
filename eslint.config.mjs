import next from "eslint-config-next";

// eslint-config-next 16 ships a native flat config (an array), so spread it directly.
const eslintConfig = [
  ...next,
  {
    ignores: [".next/**", "out/**", "node_modules/**", "next-env.d.ts"],
  },
  {
    rules: {
      // Apostrophes in plain copy are fine and render correctly.
      "react/no-unescaped-entities": "off",
      // Theme provider intentionally syncs localStorage -> state on mount.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  {
    // arch-contract analyses TypeScript only. The Worker is JavaScript, so ESLint
    // enforces the same boundary for the runtime that receives public requests.
    files: ["worker/**/*.js"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["../app/**", "../components/**", "../lib/**", "../data/**", "@/**"],
              message:
                "The Worker may only import from config/. App code is part of the static export and is unavailable in the Workers runtime.",
            },
            {
              group: ["react", "react-dom", "next", "next/**"],
              message: "React and Next.js are unavailable in the Cloudflare Workers runtime.",
            },
          ],
        },
      ],
    },
  },
  {
    // arch-contract also cannot see .mjs. Tooling may reuse config/, worker/ and
    // other scripts, but it must not couple deployment code to the static app.
    files: ["scripts/*.mjs"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "../app/**",
                "../components/**",
                "../lib/**",
                "../data/**",
                "@/app/**",
                "@/components/**",
                "@/lib/**",
                "@/data/**",
              ],
              message:
                "Tooling may import config/, worker/ and scripts/, but not code shipped with the static app.",
            },
          ],
        },
      ],
    },
  },
  {
    // Nested source adapters and helpers may import siblings under scripts/, so their
    // paths need one more parent segment before they can cross into shipped app code.
    files: ["scripts/*/**/*.mjs"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "../../app/**",
                "../../../app/**",
                "../../components/**",
                "../../../components/**",
                "../../lib/**",
                "../../../lib/**",
                "../../data/**",
                "../../../data/**",
                "@/app/**",
                "@/components/**",
                "@/lib/**",
                "@/data/**",
              ],
              message:
                "Tooling may import config/, worker/ and scripts/, but not code shipped with the static app.",
            },
          ],
        },
      ],
    },
  },
  {
    // Nothing shipped to a browser may import deployment or generation tooling.
    files: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}", "lib/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/scripts/**", "../scripts/**", "../../scripts/**", "../../../scripts/**"],
              message:
                "Build and deploy scripts must not reach the browser bundle. Move shared code into config/ or lib/.",
            },
            {
              group: ["@/data/artists.data.json", "*/artists.data.json"],
              message:
                "Read generated artist data through data/artists.ts, which owns its types and lookup helpers.",
            },
          ],
        },
      ],
    },
  },
];

export default eslintConfig;
