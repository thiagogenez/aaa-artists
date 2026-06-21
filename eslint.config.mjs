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
];

export default eslintConfig;
