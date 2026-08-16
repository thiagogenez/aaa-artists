#!/usr/bin/env node
/**
 * Render the booking acknowledgement to disk, with no network and no API key.
 *
 * This is the fastest way to answer "what does the customer actually receive?".
 * It calls the same `enquiryEmail()` the Worker calls, so what you open in the
 * browser is byte-for-byte what Brevo would be asked to send.
 *
 *   npm run preview:email
 *   npm run preview:email -- --open      also open it in the default browser
 *
 * For the full round trip — form, Turnstile, Worker, rate limits — use the mail
 * catcher instead: docs/local-testing.md.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { execFile } from "node:child_process";
import { join, resolve } from "node:path";
import { enquiryEmail } from "../worker/index.js";

const OUT_DIR = ".preview";
const shouldOpen = process.argv.includes("--open");

/** A deliberately full enquiry: multiple artists, both timing modes, every
 *  optional field populated. A sparse one hides most of the template. */
const payload = {
  name: "Jane Booker",
  email: "jane.booker@example.com",
  submissionId: "123e4567-e89b-42d3-a456-426614174000",
  company: "Northern Lights Events",
  phone: "+447700900123",
  whatsappNumber: "",
  whatsappUsername: "@janebooker",
  bookings: [
    {
      artist: "Xijaro & Pitch",
      timingMode: "times",
      durationMinutes: "",
      startTime: "23:00",
      finishTime: "01:00",
    },
    {
      artist: "C-Systems",
      timingMode: "duration",
      durationMinutes: "90",
      startTime: "",
      finishTime: "",
    },
  ],
  eventName: "Fusion Winter Warm-Up",
  eventType: "Club night",
  eventDate: "2026-12-05",
  venue: "The Old Bakery",
  city: "Manchester",
  country: "United Kingdom",
  capacity: "500-1,000",
  ticketing: "Ticketed",
  currency: "GBP",
  budgetRange: "5,000-10,000",
  lineup: "Support from two local residents, doors 22:00.",
  hearAbout: "Instagram",
  message:
    "We are planning a two-room night and would like both artists on the main room.\n\nHappy to discuss fees and travel.",
  turnstileToken: "",
  website: "",
};

const email = enquiryEmail(payload);

mkdirSync(OUT_DIR, { recursive: true });
const htmlPath = join(OUT_DIR, "enquiry-email.html");
const textPath = join(OUT_DIR, "enquiry-email.txt");
writeFileSync(htmlPath, email.htmlContent);
writeFileSync(
  textPath,
  [
    `From:     ${email.sender.name} <${email.sender.email}>`,
    `To:       ${email.to.map((r) => `${r.name ?? ""} <${r.email}>`).join(", ")}`,
    `Bcc:      ${email.bcc.map((r) => r.email).join(", ")}`,
    `Reply-To: ${email.replyTo.email}`,
    `Subject:  ${email.subject}`,
    "",
    email.textContent,
  ].join("\n")
);

console.log("\nBooking acknowledgement rendered from the Worker's own builder.\n");
console.log(`  subject   ${email.subject}`);
console.log(`  to        ${email.to.map((r) => r.email).join(", ")}`);
console.log(`  bcc       ${email.bcc.map((r) => r.email).join(", ")}`);
console.log(`  reply-to  ${email.replyTo.email}`);
console.log(`\n  html      ${htmlPath}`);
console.log(`  text      ${textPath}\n`);
console.log("Nothing was sent. No API key was used.\n");

if (shouldOpen) {
  const opener = process.platform === "darwin" ? "open" : "xdg-open";
  execFile(opener, [resolve(htmlPath)], (error) => {
    if (error) console.log(`Could not open automatically: ${error.message}`);
  });
}
