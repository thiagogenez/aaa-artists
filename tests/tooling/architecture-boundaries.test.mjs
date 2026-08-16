import assert from "node:assert/strict";
import { dirname, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { ESLint } from "eslint";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const eslint = new ESLint({ cwd: root });

async function restrictedImportMessages(filePath, source) {
  const [result] = await eslint.lintText(source, { filePath: resolve(root, filePath) });
  return result.messages.filter((message) => message.ruleId === "no-restricted-imports");
}

test("rejects imports from tooling into shipped app code", async () => {
  const messages = await restrictedImportMessages(
    "scripts/__probe.mjs",
    'import "../lib/site.ts";\n'
  );

  assert.equal(messages.length, 1);
  assert.match(messages[0].message, /Tooling may import config/);
});

test("allows nested tooling to import another script helper", async () => {
  const messages = await restrictedImportMessages(
    "scripts/sources/__probe.mjs",
    'import "../lib/source-http.mjs";\n'
  );

  assert.deepEqual(messages, []);
});

test("rejects imports from the Worker into static app code", async () => {
  const messages = await restrictedImportMessages(
    "worker/__probe.js",
    'import "../lib/site.ts";\n'
  );

  assert.equal(messages.length, 1);
  assert.match(messages[0].message, /Worker may only import from config/);
});

test("rejects imports from browser code into tooling", async () => {
  const messages = await restrictedImportMessages(
    "components/__probe.tsx",
    'import "../scripts/gen-artists.mjs";\n'
  );

  assert.equal(messages.length, 1);
  assert.match(messages[0].message, /must not reach the browser bundle/);
});

test("rejects direct generated artist JSON imports", async () => {
  const messages = await restrictedImportMessages(
    "app/__probe.tsx",
    'import artists from "@/data/artists.data.json";\nvoid artists;\n'
  );

  assert.equal(messages.length, 1);
  assert.match(messages[0].message, /data\/artists\.ts/);
});
