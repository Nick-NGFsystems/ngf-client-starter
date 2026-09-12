#!/usr/bin/env bash
#
# Vercel "Ignored Build Step" — exit 0 to SKIP the deploy, exit 1 to BUILD.
# Skips only when every change since the last deployment is documentation.
#
# Wired up via vercel.json:  "ignoreCommand": "bash scripts/vercel-skip-docs.sh"
# (the inline form outgrew Vercel's 256-character limit for that field).
#
# Why "since the last deployment" and not "this commit": Vercel used to run
# `git diff HEAD^ HEAD`, which looks at the LAST commit only. A push whose
# final commit was docs-only cancelled the whole build even when earlier
# commits in the same push changed code — production silently stayed on old
# code (2026-09-08). Vercel exposes the previously deployed commit as
# VERCEL_GIT_PREVIOUS_SHA; diffing from there covers the whole push.
#
# Why the defensive resolution: Vercel's clone is shallow, so that commit is
# often not present. `git diff` against a missing object exits 128, and Vercel
# treats a non-0/1 exit from this step as a FAILED deployment, not "build".
# So: check the base exists, deepen once if not, and if it still cannot be
# resolved, BUILD. Never fall back to HEAD^ for a real previous SHA: that
# would silently reintroduce the last-commit-only bug. Any git failure maps
# to exit 1 (build). Skipping is the only outcome that must be
# proven; building is always the safe default.
#
# Docs-only means: any .md anywhere, .github/*, .gitignore, .gitattributes,
# LICENSE, and this script itself.
#
# IMPORTANT: this file MUST have LF line endings (.gitattributes enforces it).
# CRLF makes bash fail on every line and every deploy fails.

# No previous deployment to compare against — first deploy of a project, or a
# trigger where Vercel does not set it. BUILD. The earlier version fell back to
# HEAD^ here, which is the last-commit-only comparison this whole script exists
# to replace: a first deploy whose final commit was docs-only would have been
# skipped, leaving the project with no production deployment at all.
if [ -z "${VERCEL_GIT_PREVIOUS_SHA:-}" ]; then
  echo "vercel-skip-docs: no previous deployment to compare against — building"
  exit 1
fi

base="$VERCEL_GIT_PREVIOUS_SHA"

if ! git cat-file -e "${base}^{commit}" 2>/dev/null; then
  git fetch -q --depth=100 origin main 2>/dev/null || true
fi
if ! git cat-file -e "${base}^{commit}" 2>/dev/null; then
  echo "vercel-skip-docs: cannot resolve base ${base} — building to be safe"
  exit 1
fi

if git diff --quiet "$base" HEAD -- . \
  ':(exclude)*.md' \
  ':(exclude)**/*.md' \
  ':(exclude).gitignore' \
  ':(exclude).gitattributes' \
  ':(exclude)LICENSE' \
  ':(exclude).github/**' \
  ':(exclude)scripts/vercel-skip-docs.sh'; then
  echo "vercel-skip-docs: only docs changed since ${base} — skipping build"
  exit 0
fi

# Either real changes exist, or git could not answer. Build in both cases.
echo "vercel-skip-docs: code changed since ${base} (or base unresolvable) — building"
exit 1
