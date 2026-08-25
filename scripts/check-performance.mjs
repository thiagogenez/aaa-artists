import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { gzipSync } from "node:zlib";

const projectRoot = path.resolve(import.meta.dirname, "..");
const outputRoot = path.resolve(projectRoot, process.env.PERFORMANCE_OUTPUT_DIR ?? "out");
const budget = JSON.parse(
  fs.readFileSync(path.join(projectRoot, "performance-budget.json"), "utf8")
);
const report = process.argv.includes("--report");

function gzipBytes(filePath) {
  return gzipSync(fs.readFileSync(filePath), { level: 9 }).length;
}

function routeDocument(route) {
  return path.join(outputRoot, route === "/" ? "index.html" : `${route.slice(1)}.html`);
}

function measureRoute(route) {
  const documentPath = routeDocument(route);
  if (!fs.existsSync(documentPath)) {
    throw new Error(`Missing static document for ${route}: run the performance script after build`);
  }

  const html = fs.readFileSync(documentPath, "utf8");
  const assets = [
    ...new Set(
      [...html.matchAll(/(?:src|href)="(\/_next\/static\/[^"]+\.(?:js|css))"/g)].map(
        (match) => match[1]
      )
    ),
  ];
  const javascript = assets
    .filter((asset) => asset.endsWith(".js"))
    .reduce((total, asset) => total + gzipBytes(path.join(outputRoot, asset)), 0);
  const styles = assets
    .filter((asset) => asset.endsWith(".css"))
    .reduce((total, asset) => total + gzipBytes(path.join(outputRoot, asset)), 0);
  const document = gzipBytes(documentPath);

  return { route, document, javascript, styles, total: document + javascript + styles };
}

const measurements = Object.entries(budget.routes).map(([route, limits]) => ({
  ...measureRoute(route),
  limits,
}));

if (report) {
  console.table(
    measurements.map(({ route, document, javascript, styles, total }) => ({
      route,
      "document gzip": document,
      "scripts gzip": javascript,
      "styles gzip": styles,
      "total gzip": total,
    }))
  );
}

const failures = measurements.flatMap(({ route, javascript, total, limits }) => {
  const routeFailures = [];
  if (javascript > limits.maxJavaScriptGzipBytes) {
    routeFailures.push(
      `${route} JavaScript is ${javascript} bytes gzip (budget ${limits.maxJavaScriptGzipBytes})`
    );
  }
  if (total > limits.maxTotalGzipBytes) {
    routeFailures.push(
      `${route} total is ${total} bytes gzip (budget ${limits.maxTotalGzipBytes})`
    );
  }
  return routeFailures;
});

if (failures.length > 0) {
  for (const failure of failures) console.error(`✗ ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`✓ ${measurements.length} route performance budget passed.`);
}
