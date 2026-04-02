#!/usr/bin/env bash
set -euo pipefail

dev_dir="$(cd "$(dirname "$0")/.." && pwd)"
public_dir="$(cd "$dev_dir/../pikit" && pwd)"

if [[ -z "${1:-}" ]]; then
  echo "Usage: ./scripts/publish.sh \"commit message\""
  echo ""
  echo "Syncs pikit-dev to pikit (public repo) as a single commit."
  exit 1
fi

message="$1"

echo "Syncing pikit-dev -> pikit..."
rsync -a --delete \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='.pikit/' \
  --exclude='.pikit.json' \
  --exclude='.pi' \
  --exclude='scripts/publish.sh' \
  "$dev_dir/" "$public_dir/"

# Public repo uses .pi -> . so pi discovers the repo itself as the harness
ln -sfn . "$public_dir/.pi"

cd "$public_dir"

# Check if there are actual changes
if git diff --quiet && git diff --cached --quiet && [[ -z "$(git ls-files --others --exclude-standard)" ]]; then
  echo "No changes to publish."
  exit 0
fi

git add -A
git commit -m "$message"
git push

echo ""
echo "Published to 5uck1ess/pikit: $message"
