import { readFile, rm, mkdir, writeFile, copyFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packageRoot = path.join(root, "node_modules", "all-countries-and-cities-json");
const outputDir = path.join(root, "public", "cities");

function countrySlug(country) {
  return country
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const source = JSON.parse(await readFile(path.join(packageRoot, "countries.min.json"), "utf8"));
await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

await Promise.all(Object.entries(source).map(([country, cities]) => (
  writeFile(path.join(outputDir, `${countrySlug(country)}.json`), JSON.stringify(cities))
)));

await copyFile(path.join(packageRoot, "LICENSE"), path.join(outputDir, "LICENSE.txt"));
await writeFile(
  path.join(outputDir, "ATTRIBUTION.txt"),
  "City suggestions generated from all-countries-and-cities-json by Ruslan Orel (MIT).\n",
);

console.log(`Generated ${Object.keys(source).length} country city files in public/cities.`);
