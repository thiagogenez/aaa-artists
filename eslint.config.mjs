import next from "eslint-config-next";

// eslint-config-next 16 ships a native flat config (an array), so spread it directly.
const eslintConfig = [
  ...next,
  {
    ignores: [".next/**", "out/**", "node_modules/**", "next-env.d.ts", "scripts/**"],
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
    // Architecture boundary for the Worker.
    //
    // arch-contract.yaml declares this same boundary, but that tool analyses TypeScript
    // only — worker/index.js is invisible to it (verified 2026-08-11 with a deliberate
    // probe import that it did not flag). ESLint does read this file, so the rule that
    // actually enforces the boundary lives here. Keep the two in sync: if you widen one,
    // widen the other and say why in the pull request.
    //
    // The Worker runs in the Cloudflare Workers runtime and is deployed separately from
    // the static export. It may share validation constants from config/ and nothing else.
    files: ["worker/**/*.js"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["../app/*", "../components/*", "../lib/*", "../data/*", "@/*"],
              message:
                "The Worker may only import from config/. app/, components/, lib/ and data/ are part of the static export and do not exist in the Workers runtime.",
            },
            {
              group: ["react", "react-dom", "next", "next/*"],
              message: "React and Next.js are not available in the Cloudflare Workers runtime.",
            },
          ],
        },
      ],
    },
  },
  {
    // The mirror of the rule above: nothing shipped to a browser may pull in the
    // deployment or generation tooling, which uses node:fs, node:child_process and
    // Cloudflare credentials.
    files: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}", "lib/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/scripts/*", "../scripts/*", "../../scripts/*", "../../../scripts/*"],
              message:
                "Build and deploy scripts must not reach the browser bundle. Move the shared part into config/ or lib/.",
            },
            {
              group: ["@/data/artists.data.json", "*/artists.data.json"],
              message:
                "Read generated artist data through data/artists.ts, which owns the types and the lookup helpers.",
            },
          ],
        },
      ],
    },
  },
];

export default eslintConfig;
