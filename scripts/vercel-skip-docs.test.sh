#!/usr/bin/env bash
# Exercises the real vercel-skip-docs.sh against a real throwaway git repo.
# exit 0 = SKIP the deploy, exit 1 = BUILD.
#
# Run it:  npm run test:deploy-rule     (or: bash scripts/vercel-skip-docs.test.sh)
#
# This script is copied verbatim into every client repo, and a wrong answer is
# expensive in both directions: a false SKIP leaves production on old code (or
# cancels the redeploy someone needed to pick up an env var, 2026-09-18), a
# false BUILD wastes a deploy on a typo fix. It has no unit-test framework
# because it is bash — this drives the REAL script against a REAL throwaway
# git repo instead.
# Resolve to an ABSOLUTE path: every case runs after cd-ing into the throwaway
# repo, and a relative path would look for the script in there instead.
SCRIPT="$(cd "$(dirname "${1:-$0}")" && pwd)/$(basename "${1:-vercel-skip-docs.sh}")"
T=$(mktemp -d); pass=0; fail=0
run() { # run <label> <expected 0|1> <env base>
  local label="$1" expect="$2" base="$3"
  ( cd "$T" && VERCEL_GIT_PREVIOUS_SHA="$base" bash "$SCRIPT" >/dev/null 2>&1 )
  local got=$?
  local w=$([ "$expect" = 0 ] && echo SKIP || echo BUILD)
  local g=$([ "$got" = 0 ] && echo SKIP || echo BUILD)
  if [ "$got" = "$expect" ]; then pass=$((pass+1)); printf '  ok    %-52s %s\n' "$label" "$g"
  else fail=$((fail+1)); printf '  FAIL  %-52s wanted %s got %s\n' "$label" "$w" "$g"; fi
}
cd "$T"; git init -q .; git config user.email t@t; git config user.name t
mkdir -p scripts; cp "$SCRIPT" scripts/vercel-skip-docs.sh
echo "code v1" > app.tsx; echo "# readme" > README.md
git add -A; git commit -qm c1; C1=$(git rev-parse HEAD)
echo "# more docs" >> README.md; git commit -qam c2; C2_DOCS=$(git rev-parse HEAD)
echo "code v2" > app.tsx; git commit -qam c3; C3_CODE=$(git rev-parse HEAD)

echo "--- the bug this fix targets"
run "redeploy: base == HEAD (env var changed, no new commit)" 1 "$C3_CODE"
echo "--- behaviour that must NOT regress"
run "code changed since base"                                  1 "$C1"
run "no previous deployment (empty base)"                       1 ""
run "base is an unresolvable sha"                               1 "deadbeefdeadbeefdeadbeefdeadbeefdeadbeef"
# docs-only: roll HEAD back to the docs commit so base->HEAD is docs only
git checkout -q "$C2_DOCS"
run "only docs changed since base (the skip this exists for)"   0 "$C1"
git checkout -q "$C3_CODE"
printf '\n# touched\n' >> scripts/vercel-skip-docs.sh; git commit -qam rule; C4_RULE=$(git rev-parse HEAD)
run "a change to the deploy rule itself builds"                 1 "$C3_CODE"
run "redeploy at a docs commit still builds"                    1 "$C2_DOCS"
rm -rf "$T"
echo; echo "$pass passed, $fail failed"; [ "$fail" -eq 0 ]
