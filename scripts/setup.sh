#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${1:-}" ]]; then
  echo "Usage: ./setup.sh <path-to-repo>"
  echo ""
  echo "Links pikit to a project so the pi agent loads this harness."
  exit 1
fi

repo="$(cd "$1" && pwd)"
harness_dir="$(cd "$(dirname "$0")/.." && pwd)"

# Create .pi symlink
ln -sfn "$harness_dir" "$repo/.pi"
echo "Linked: $repo/.pi -> $harness_dir"

# Ensure .gitignore covers pikit files
gitignore="$repo/.gitignore"
touch "$gitignore"

for entry in "# pikit" ".pi" ".pikit/"; do
  if ! grep -qxF "$entry" "$gitignore"; then
    echo "$entry" >> "$gitignore"
  fi
done

echo "Updated $gitignore"
echo ""
echo "Ready. Run 'pi' in $repo to start."
