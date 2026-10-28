# Temporary MacBook recovery checkpoint

This checkpoint preserves local project material at the maintainer's request before a machine
wipe. It is associated with #107 and draft PR #183. Do not merge it as a production release.

## Git recovery

The original 58 local branch tips are copied to remote branches under
`recovery/2026-10-28/`, retaining their original names after that prefix. The two stashes are
preserved as `recovery/2026-10-28/stash-0` and `recovery/2026-10-28/stash-1`.

After cloning, fetch all remote branches. The active work is on `improve/booking-form-flow`.
To restore a stash to the stash list, run `git stash store` with the corresponding remote
recovery branch. Restore stash 1 first, then stash 0, to retain the original ordering. Do not
apply either stash over current work without reviewing its old changes first.

## Private files

The private `personal-ai-2026-10-28_142852_304173.tar.gz` backup contains the personal Codex,
Claude, skills, and SSH configuration, plus the project's `.dev.vars`, local agent settings,
context, Obsidian state, and original images. These private backups must never be uploaded to
the public repository. A separate `webpage-local-supplement.tar.gz` preserves the project's
local files, including email previews that contain a personal address.

Dependencies, build output, generated data, and tool caches can be regenerated. Restore the
Node version from `.node-version`, install dependencies with the lockfile, and generate the
site data. The booking prototype has its own package and lockfile.

## Removing this temporary checkpoint

Before removing the temporary tracking of `.agents/`, `.claude/`, `.context/`, `.obsidian/`,
and `img/`, restore and verify their local copies. Use `git rm --cached` for these paths so
their contents remain on disk and the existing ignore rules take effect again. Remove this
recovery document when the transfer is complete. Retain the recovery branches until the new
machine and the private backup have both been verified.

The local quality suite currently stops at four formatting errors in the booking prototype.
The checkpoint does not assert that the feature is ready to merge or deploy.
