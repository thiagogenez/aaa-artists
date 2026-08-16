const HUMAN_REQUIRED_SECTIONS = [
  "Problem",
  "Before",
  "After",
  "Change",
  "Verification",
  "Risks and limitations",
  "Next steps",
];

const AUTOMATED_REQUIRED_SECTIONS = ["Before", "After"];

const ISSUE_REFERENCE = /(closes|fixes|resolves|refs|part of)\s+#[0-9]+/i;

function stripHtmlComments(body) {
  return body.replace(/<!--[\s\S]*?-->/g, "");
}

function sectionContent(body, heading) {
  const lines = body.split(/\r?\n/);
  const content = [];
  let inside = false;
  let fence;

  for (const line of lines) {
    const fenceMatch = line.match(/^\s*(`{3,}|~{3,})/);
    if (fenceMatch) {
      if (!fence) fence = fenceMatch[1][0];
      else if (fence === fenceMatch[1][0]) fence = undefined;
      if (inside) content.push(line);
      continue;
    }

    if (fence) {
      if (inside) content.push(line);
      continue;
    }

    const match = line.match(/^##\s+(.+?)\s*$/);
    if (match) {
      inside = match[1] === heading;
      continue;
    }
    if (inside) content.push(line);
  }

  return content;
}

function isMeaningfulLine(line) {
  const value = line.trim();
  if (!value || /^[-*+]$/.test(value) || /^[-*+]\s+\[\s\]$/.test(value)) return false;
  if (/^(`{3,}|~{3,})/.test(value)) return false;
  if (!value.startsWith("|")) return true;

  const cells = value
    .slice(1, value.endsWith("|") ? -1 : undefined)
    .split("|")
    .map((cell) => cell.trim());

  if (cells.every((cell) => /^:?-+:?$/.test(cell))) return false;
  if (cells.some((cell) => cell.toLowerCase() === "result")) return false;
  return cells.at(-1) !== "";
}

export function validatePrBody(rawBody, { automated = false } = {}) {
  const body = stripHtmlComments(rawBody ?? "");
  const errors = [];

  if (!automated && !ISSUE_REFERENCE.test(body)) {
    errors.push("No issue reference. Add 'Closes #N' (or 'Refs #N' for partial work).");
  }

  const requiredSections = automated ? AUTOMATED_REQUIRED_SECTIONS : HUMAN_REQUIRED_SECTIONS;
  for (const heading of requiredSections) {
    const content = sectionContent(body, heading);
    if (content.length === 0) {
      errors.push(`Missing section: '## ${heading}'. Do not delete it from the template.`);
    } else if (!content.some(isMeaningfulLine)) {
      errors.push(`Section '## ${heading}' is present but empty. Fill it in.`);
    }
  }

  return errors;
}

if (process.argv[1]?.endsWith("validate-pr-body.mjs")) {
  const automated = process.env.PR_AUTHOR === "dependabot[bot]";
  const errors = validatePrBody(process.env.PR_BODY, { automated });
  if (errors.length === 0) {
    console.log(
      automated
        ? "Pull request description includes Before and After."
        : "Pull request description includes an issue reference and every required section."
    );
  } else {
    for (const error of errors) console.error(`::error::${error}`);
    process.exitCode = 1;
  }
}
