import { privacyMissingFields } from "../config/privacy.js";
import { PRIVACY_EMAIL } from "../config/site.js";

const missing = [...privacyMissingFields(), !PRIVACY_EMAIL && "PRIVACY_EMAIL"].filter(Boolean);

if (missing.length > 0) {
  console.error(`Privacy release check failed. Confirm and update: ${missing.join(", ")}.`);
  process.exitCode = 1;
} else {
  console.log("Privacy release check passed.");
}
