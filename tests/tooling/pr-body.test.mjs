import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validatePrBody } from "../../scripts/validate-pr-body.mjs";

const COMPLETE_BODY = `Closes #73

## Change
- Require the issue reference and the three sections used to review the change.

## Verification
| Check | Command | Result |
| --- | --- | --- |
| Fixture | \`node --test tests/tooling/pr-body.test.mjs\` | Passed |

## Risks and limitations
- Markdown inside fenced code is not parsed as a separate document.
`;

describe("pull request body validation", () => {
  it("accepts a complete human pull request body", () => {
    assert.deepEqual(validatePrBody(COMPLETE_BODY), []);
  });

  it("requires the issue reference and every human section", () => {
    const headings = ["Change", "Verification", "Risks and limitations"];

    assert.match(validatePrBody(COMPLETE_BODY.replace("Closes #73", ""))[0], /issue reference/i);
    for (const heading of headings) {
      const body = COMPLETE_BODY.replace(new RegExp(`\\n## ${heading}\\n[^#]+`), "\n");
      assert.ok(
        validatePrBody(body).some((error) => error.includes(`## ${heading}`)),
        `${heading} should be required`
      );
    }
  });

  it("rejects comments, bare bullets, and empty verification results", () => {
    const emptyChange = COMPLETE_BODY.replace(
      "- Require the issue reference and the three sections used to review the change.",
      "<!-- add evidence -->\n-"
    );
    const emptyVerification = COMPLETE_BODY.replace(
      "| Fixture | `node --test tests/tooling/pr-body.test.mjs` | Passed |",
      "| Fixture | `node --test tests/tooling/pr-body.test.mjs` | |"
    );

    assert.ok(validatePrBody(emptyChange).some((error) => error.includes("## Change")));
    assert.ok(validatePrBody(emptyVerification).some((error) => error.includes("## Verification")));
  });

  it("does not treat a heading inside a code fence as a real section", () => {
    const withoutChange = COMPLETE_BODY.replace(
      /\n## Change\n- Require the issue reference and the three sections used to review the change\.\n/,
      "\n```md\n## Change\nnot a real section\n```\n"
    );

    assert.ok(validatePrBody(withoutChange).some((error) => error.includes("## Change")));
  });

  it("requires Before and After on Dependabot pull requests", () => {
    const dependencyBody = `## Before
\`next\` resolved to 16.2.11.

## After
\`next\` resolves to 16.2.12.
`;

    assert.deepEqual(validatePrBody(dependencyBody, { automated: true }), []);
    assert.ok(
      validatePrBody(dependencyBody.replace("## After", "## Proposed"), { automated: true }).some(
        (error) => error.includes("## After")
      )
    );
  });
});
