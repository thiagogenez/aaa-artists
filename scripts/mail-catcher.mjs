#!/usr/bin/env node
/**
 * A stand-in for Brevo, for local testing of the booking form.
 *
 * The Worker delivers over HTTPS to Brevo's API, not over SMTP, so no mail server
 * is involved. This catcher accepts the exact POST the Worker would send to Brevo,
 * writes the message to disk, prints a summary, and answers with a Brevo-shaped
 * 201 so the Worker's success path runs for real.
 *
 * The whole round trip is therefore testable with no credentials and nobody
 * emailed: form, Turnstile, Worker validation, email rendering, and the
 * enquiry_delivered log record. Not the rate limits — those bindings only
 * exist on the named environments, so tests/worker/enquiries.test.mjs covers them
 * with stubs instead.
 *
 *   Terminal 1:  npm run dev:mail
 *   Terminal 2:  npm run dev:worker
 *   Browser:     http://localhost:8787/contact
 *
 * Each capture is written to .preview/ three ways:
 *
 *   .eml   a real RFC 5322 message. Open it and Mail.app renders it exactly as a
 *          received email, headers and all. This is the one to look at.
 *   .html  the HTML body alone, for a browser.
 *   .txt   the plain-text alternative plus the envelope, for a quick read.
 *
 * This proves the Worker builds the right message. It cannot prove deliverability,
 * DKIM, threading, or what Gmail does with it. For that, use a separate Brevo API
 * key and send to yourself: docs/local-testing.md.
 */
import { createServer } from "node:http";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const PORT = Number.parseInt(process.env.MAIL_CATCHER_PORT ?? "8025", 10);
const HOST = "127.0.0.1";
const OUT_DIR = process.env.MAIL_CATCHER_OUT_DIR ?? ".preview";

/** A real RFC 5322 message, so the file opens in Mail.app exactly as a received
 *  email: correct headers, and both the plain-text and HTML alternatives. */
function buildEml(payload) {
  const boundary = `aaa-${Date.now().toString(36)}`;
  const to = (payload.to ?? []).map((r) => (r.name ? `${r.name} <${r.email}>` : r.email));
  const encode = (value) =>
    Buffer.from(value ?? "", "utf8")
      .toString("base64")
      .replace(/(.{76})/g, "$1\r\n");
  return [
    `From: ${payload.sender?.name ?? ""} <${payload.sender?.email ?? ""}>`,
    `To: ${to.join(", ")}`,
    `Bcc: ${(payload.bcc ?? []).map((r) => r.email).join(", ")}`,
    `Reply-To: ${payload.replyTo?.email ?? ""}`,
    `Subject: ${payload.subject ?? ""}`,
    `Date: ${new Date().toUTCString()}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    'Content-Type: text/plain; charset="utf-8"',
    "Content-Transfer-Encoding: base64",
    "",
    encode(payload.textContent),
    "",
    `--${boundary}`,
    'Content-Type: text/html; charset="utf-8"',
    "Content-Transfer-Encoding: base64",
    "",
    encode(payload.htmlContent),
    "",
    `--${boundary}--`,
    "",
  ].join("\r\n");
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      // The Worker caps enquiries well below this; anything larger is a mistake.
      if (body.length > 2_000_000) reject(new Error("body too large"));
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

mkdirSync(OUT_DIR, { recursive: true });

const server = createServer(async (request, response) => {
  if (request.method !== "POST" || !request.url?.includes("/smtp/email")) {
    response.writeHead(404, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ error: "Only POST /v3/smtp/email is emulated." }));
    return;
  }

  let payload;
  try {
    payload = JSON.parse(await readBody(request));
  } catch {
    response.writeHead(400, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ error: "Body was not JSON." }));
    return;
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const htmlPath = join(OUT_DIR, `email-${stamp}.html`);
  const textPath = join(OUT_DIR, `email-${stamp}.txt`);
  const emlPath = join(OUT_DIR, `email-${stamp}.eml`);
  const eml = buildEml(payload);
  writeFileSync(emlPath, eml);
  writeFileSync(htmlPath, payload.htmlContent ?? "");
  writeFileSync(
    textPath,
    [
      `To:          ${(payload.to ?? []).map((r) => r.email).join(", ")}`,
      `Bcc:         ${(payload.bcc ?? []).map((r) => r.email).join(", ")}`,
      `Reply-To:    ${payload.replyTo?.email ?? ""}`,
      `From:        ${payload.sender?.name ?? ""} <${payload.sender?.email ?? ""}>`,
      `Subject:     ${payload.subject ?? ""}`,
      "",
      payload.textContent ?? "",
    ].join("\n")
  );

  console.log("\n─── enquiry captured ────────────────────────────────────────");
  console.log(`  subject   ${payload.subject}`);
  console.log(`  to        ${(payload.to ?? []).map((r) => r.email).join(", ")}`);
  console.log(`  bcc       ${(payload.bcc ?? []).map((r) => r.email).join(", ")}`);
  console.log(`  reply-to  ${payload.replyTo?.email}`);
  console.log(`  eml       ${emlPath}`);
  console.log(`  html      ${htmlPath}`);
  console.log(`  text      ${textPath}`);
  console.log("─────────────────────────────────────────────────────────────");
  console.log(`  open ${emlPath}     (renders in Mail.app as a received email)\n`);

  // Brevo answers 201 with a messageId; the Worker only checks response.ok.
  response.writeHead(201, { "Content-Type": "application/json" });
  response.end(JSON.stringify({ messageId: `<local-${stamp}@mail-catcher.test>` }));
});

server.listen(PORT, HOST, () => {
  console.log(`\nMail catcher listening on http://${HOST}:${PORT}`);
  console.log(`Emails will be written to ${OUT_DIR}/ as .eml, .html and .txt`);
  console.log("Nothing reaches a real external inbox. Stop with Ctrl-C.\n");
});
