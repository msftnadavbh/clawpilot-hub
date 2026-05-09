#!/usr/bin/env bash
# Usage: deploy_vercel.sh <path-to-html-or-project-dir> [project-name]
# Deploys static content / project to Vercel production and prints the final URL on the last line.
set -euo pipefail

export PATH="/opt/homebrew/bin:$PATH"

SRC="${1:?path to html file or project directory required}"
PROJECT_NAME="${2:-}"

if [ ! -e "$SRC" ]; then
  echo "ERROR: $SRC not found" >&2; exit 1
fi

# Build a clean staging dir so a single HTML file deploys as index.html
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

if [ -d "$SRC" ]; then
  cp -R "$SRC"/. "$WORK"/
else
  cp "$SRC" "$WORK/index.html"
fi

# Derive project name from filename if not given
if [ -z "$PROJECT_NAME" ]; then
  base=$(basename "$SRC")
  PROJECT_NAME="${base%.*}"
  PROJECT_NAME=$(echo "$PROJECT_NAME" | tr '[:upper:]_ ' '[:lower:]--' | tr -cd 'a-z0-9-')
fi

cd "$WORK"

# Deploy. --yes accepts defaults; --prod pushes to production alias.
OUT=$(vercel deploy --prod --yes --name "$PROJECT_NAME" 2>&1 | tee /dev/stderr)

# The production URL is the last https://... line printed
URL=$(printf '%s\n' "$OUT" | grep -Eo 'https://[a-zA-Z0-9.-]+\.vercel\.app' | tail -1)

if [ -z "$URL" ]; then
  echo "ERROR: could not parse Vercel URL" >&2; exit 2
fi

echo "DEPLOYED_URL=$URL"
