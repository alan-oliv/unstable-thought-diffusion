#!/bin/sh
# usage: bash build-brief.sh <slug> <head.md>
# Writes ~/code/prompt-fiction/prompts/unstable-thought-diffusion/<slug>/brief.md: the head,
# then the post's README with its leading <p>...</p> badge block removed.
set -eu
SLUG="$1"; HEAD="$2"
README="$HOME/code/unstable-thought-diffusion/$SLUG/README.md"
OUT="$HOME/code/prompt-fiction/prompts/unstable-thought-diffusion/$SLUG/brief.md"
[ -f "$README" ] || { echo "no post at $README" >&2; exit 1; }
[ -f "$HEAD" ] || { echo "no head file at $HEAD" >&2; exit 1; }
mkdir -p "$(dirname "$OUT")"
{
  cat "$HEAD"
  printf '\n## The post, for context\n\n'
  sed '1,/<\/p>/d' "$README" | sed '/./,$!d'
} > "$OUT"
fences=$(grep -c '^```' "$OUT" || true)
badges=$(grep -c 'badgen.net' "$OUT" || true)
images=$(grep -c 'article-0[0-9]\.png' "$README" || true)
printf '%s\nfences: %s (expect %s)\nbadge lines left: %s (expect 0)\n' "$OUT" "$fences" "$((images * 2))" "$badges"
