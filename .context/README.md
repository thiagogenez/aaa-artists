# AAA Artists local context vault

This ignored Obsidian vault carries general context and handoffs between Claude, Codex, and the
maintainer on this machine. It is not part of the repository and must never contain secrets,
visitor data, credentials, or facts that the project depends on for correctness.

## Start here

- Read `handoff.md` for the current work and the next safe action.
- Read `decisions.md` for context-model decisions that affect both agents.
- Use `../AGENTS.md` as the mandatory shared contract.
- Use `../CONTRIBUTING.md` for issue and pull-request writing.
- Use the focused files in `../docs/` for durable architecture and operations.
- Use GitHub issues and pull requests for the live backlog and implementation record.

## Ownership rule

- Keep conversational handoffs, hypotheses, and reminders here.
- Put Claude-specific configuration and memory in `~/.claude/` or `.claude/`.
- Put Codex-specific configuration and memory in `~/.codex/` or `.codex/`.
- Promote any rule, verified fact, architectural rationale, or operating procedure that must
  survive this machine to the relevant versioned Markdown file through an issue and pull request.
- Remove or rewrite stale local notes instead of treating the vault as an append-only archive.

## Obsidian

Open this `.context` directory as the vault. Obsidian will create `.context/.obsidian/`, which is
ignored together with the rest of the vault. No plugin, Obsidian Sync account, or proprietary
metadata is required; the notes stay standard Markdown.
