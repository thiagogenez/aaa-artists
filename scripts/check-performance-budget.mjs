#!/usr/bin/env node
/**
 * Performance budget for the static export.
 *
 * The site is a booking front door for promoters, often opened on a phone on
 * mobile data. Its weight is therefore a product constraint, not a preference —
 * but "keep it light" is unenforceable, and a number nobody checks decays. This
 * checks it on every pull request.
 *
 * What is measured, and why it is measured this way:
 *
 * - **Gzipped bytes**, because that is what crosses the wire. Raw file size
 *   overstates JavaScript by roughly 3x and would produce a budget that is
 *   either meaningless or permanently red.
 * - **Per route, not per bundle.** A visitor loads one page, not the whole
 *   `_next/static` directory. Each route's real cost is the document plus the
 *   scripts and stylesheets that document actually references.
 * - **Images separately**, because they are the largest thing on the site by far
 *   and are governed by different decisions (which artists, which flyers) than
 *   the code is.
 *
 *   node scripts/check-performance-budget.mjs           check against the budget
 *   node scripts/check-performance-budget.mjs --report  print the numbers only
 *
 * Raising a budget is a decision, not a formality: say why in the pull request.
 */
import { gzipSync } from "node:zlib";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const OUT_DIR = "out";
const BUDGET_FILE = "performance-budget.json";
const reportOnly = process.argv.includes("--report");

function gzippedBytes(path) {
  return gzipSync(readFileSync(path), { level: 9 }).byteLength;
}

function kb(bytes) {
  return bytes / 1024;
}

/** Assets the document itself pulls in. Anything Next.js prefetches for *other*
 *  routes is deliberately not counted: it is not on this page's critical path. */
function referencedAssets(html) {
  const assets = new Set();
  const pattern = /(?:src|href)="(\/_next\/static\/[^"]+\.(?:js|css))"/g;
  for (const match of html.matchAll(pattern)) assets.add(match[1]);
  return [...assets];
}

function measureRoute(routePath) {
  const htmlPath = join(OUT_DIR, routePath);
  if (!existsSync(htmlPath)) return null;
  const html = readFileSync(htmlPath, "utf8");

  let scriptBytes = 0;
  let styleBytes = 0;
  let missing = 0;
  for (const asset of referencedAssets(html)) {
    const assetPath = join(OUT_DIR, asset);
    if (!existsSync(assetPath)) {
      missing += 1;
      continue;
    }
    const bytes = gzippedBytes(assetPath);
    if (extname(asset) === ".css") styleBytes += bytes;
    else scriptBytes += bytes;
  }

  const documentBytes = gzipSync(Buffer.from(html), { level: 9 }).byteLength;
  return {
    documentBytes,
    scriptBytes,
    styleBytes,
    totalBytes: documentBytes + scriptBytes + styleBytes,
    missing,
  };
}

function directoryBytes(dir) {
  if (!existsSync(dir)) return 0;
  let total = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    total += entry.isDirectory() ? directoryBytes(path) : statSync(path).size;
  }
  return total;
}

if (!existsSync(OUT_DIR)) {
  console.error(`✗ ${OUT_DIR}/ does not exist. Run \`npm run build\` first.`);
  process.exit(1);
}
if (!existsSync(BUDGET_FILE)) {
  console.error(`✗ ${BUDGET_FILE} is missing.`);
  process.exit(1);
}

const budget = JSON.parse(readFileSync(BUDGET_FILE, "utf8"));
const failures = [];
const rows = [];

for (const [route, limits] of Object.entries(budget.routes)) {
  const measured = measureRoute(limits.file);
  if (!measured) {
    failures.push(`${route}: ${limits.file} was not built — the budget cannot be checked`);
    continue;
  }
  if (measured.missing > 0) {
    failures.push(`${route}: ${measured.missing} referenced asset(s) missing from the export`);
  }
  rows.push({
    route,
    total: kb(measured.totalBytes),
    limit: limits.totalKb,
    document: kb(measured.documentBytes),
    script: kb(measured.scriptBytes),
    style: kb(measured.styleBytes),
  });
  if (kb(measured.totalBytes) > limits.totalKb) {
    failures.push(
      `${route}: ${kb(measured.totalBytes).toFixed(1)} KB gzipped exceeds the ` +
        `${limits.totalKb} KB budget by ${(kb(measured.totalBytes) - limits.totalKb).toFixed(1)} KB`
    );
  }
}

const imageRows = [];
for (const [name, limits] of Object.entries(budget.assets ?? {})) {
  const bytes = directoryBytes(limits.directory);
  imageRows.push({ name, total: kb(bytes), limit: limits.totalKb });
  if (kb(bytes) > limits.totalKb) {
    failures.push(
      `${name}: ${kb(bytes).toFixed(1)} KB exceeds the ${limits.totalKb} KB budget by ` +
        `${(kb(bytes) - limits.totalKb).toFixed(1)} KB`
    );
  }
}

console.log("\nPer-route weight, gzipped (document + scripts + styles)\n");
console.log("  route                  total     budget    document   scripts    styles");
console.log(`  ${"─".repeat(76)}`);
for (const row of rows) {
  const flag = row.total > row.limit ? "✗" : " ";
  console.log(
    `${flag} ${row.route.padEnd(22)} ${row.total.toFixed(1).padStart(6)} KB ` +
      `${String(row.limit).padStart(6)} KB   ${row.document.toFixed(1).padStart(6)} KB ` +
      `${row.script.toFixed(1).padStart(7)} KB ${row.style.toFixed(1).padStart(8)} KB`
  );
}

if (imageRows.length > 0) {
  console.log("\nStatic assets, uncompressed\n");
  for (const row of imageRows) {
    const flag = row.total > row.limit ? "✗" : " ";
    console.log(
      `${flag} ${row.name.padEnd(22)} ${row.total.toFixed(1).padStart(6)} KB ` +
        `${String(row.limit).padStart(6)} KB`
    );
  }
}

if (reportOnly) {
  console.log("\nReport only — budgets not enforced.\n");
  process.exit(0);
}

if (failures.length > 0) {
  console.error(`\n✗ Performance budget exceeded:\n`);
  for (const failure of failures) console.error(`   • ${failure}`);
  console.error(
    "\nEither make it smaller, or raise the budget in performance-budget.json and say why\n" +
      "in the pull request. Raising it silently is how a fast site stops being one.\n"
  );
  process.exit(1);
}

console.log("\n✓ Every route is inside its performance budget.\n");
