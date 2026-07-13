import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));

for (const script of ["gen-artists.mjs", "gen-cities.mjs"]) {
  const result = spawnSync(process.execPath, [path.join(scriptsDir, script)], { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
