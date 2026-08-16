import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validatePrBody } from "../../scripts/validate-pr-body.mjs";

const COMPLETE_BODY = `Closes #73

## Problem
The validator accepted pull requests without comparative evidence.

## Before
The same fixture passed without these sections.

## After
The fixture fails when either comparison is absent.

## Change
- Validate every required section.

## Verification
| Check | Command | Result |
| --- | --- | --- |
| Fixture | \`node --test tests/tooling/pr-body.test.mjs\` | Passed |

## Risks and limitations
- Markdown inside fenced code is not parsed as a separate document.

## Next steps
- none
`;

describe("pull request body validation", () => {
  it("accepts a complete human pull request body", () => {
    assert.deepEqual(validatePrBody(COMPLETE_BODY), []);
  });

  it("requires the issue reference and every human section", () => {
    const headings = [
      "Problem",
      "Before",
      "After",
      "Change",
      "Verification",
      "Risks and limitations",
      "Next steps",
    ];

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
    const emptyBefore = COMPLETE_BODY.replace(
      "The same fixture passed without these sections.",
      "<!-- add evidence -->\n-"
    );
    const emptyVerification = COMPLETE_BODY.replace(
      "| Fixture | `node --test tests/tooling/pr-body.test.mjs` | Passed |",
      "| Fixture | `node --test tests/tooling/pr-body.test.mjs` | |"
    );

    assert.ok(validatePrBody(emptyBefore).some((error) => error.includes("## Before")));
    assert.ok(validatePrBody(emptyVerification).some((error) => error.includes("## Verification")));
  });

  it("does not treat a heading inside a code fence as a real section", () => {
    const withoutBefore = COMPLETE_BODY.replace(
      /\n## Before\nThe same fixture passed without these sections\.\n/,
      ""
    ).replace(
      "The validator accepted pull requests without comparative evidence.",
      "The validator accepted pull requests without comparative evidence.\n\n```md\n## Before\nnot a real section\n```"
    );

    assert.ok(validatePrBody(withoutBefore).some((error) => error.includes("## Before")));
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
