# Cross-agent context decisions

## 2026-08-25 — Agent-neutral core

- `AGENTS.md` is the concise, versioned contract that Codex reads natively.
- `CLAUDE.md` imports `AGENTS.md` and contains only Claude-specific adaptation.
- Durable project knowledge remains in focused, versioned Markdown files.
- GitHub issues and pull requests are the live work state.

## 2026-08-25 — Local Obsidian vault

- `.context/` is the local Obsidian vault shared by Claude and Codex on this machine.
- The entire vault is ignored by Git, including `.context/.obsidian/`.
- The vault holds general handoffs, hypotheses, and reminders, not secrets or authoritative facts.
- When a local note becomes a durable project rule or decision, promote it through the normal
  issue-first pull-request workflow.

## 2026-08-25 — Client-specific state

- Personal Claude settings, MCPs, permissions, and memory belong under `~/.claude/`.
- Personal Codex settings, MCPs, permissions, and memory belong under `~/.codex/`.
- Repository-local `.claude/` or `.codex/` content is allowed only for intentionally shared,
  client-specific behaviour. General project context must not be duplicated there.
