#!/usr/bin/env bash
set -euo pipefail

# Check for pi-mono updates and report if pikit is behind.
# Run manually or via cron/CI.

pkg="@mariozechner/pi-coding-agent"
harness_dir="$(cd "$(dirname "$0")/.." && pwd)"

# Get installed and latest versions
installed=$(node -e "const p=require('$harness_dir/node_modules/$pkg/package.json'); console.log(p.version)" 2>/dev/null || echo "not installed")
latest=$(npm view "$pkg" version 2>/dev/null || echo "unknown")

echo "pi-mono ($pkg)"
echo "  installed: $installed"
echo "  latest:    $latest"

if [[ "$installed" == "not installed" ]]; then
  echo ""
  echo "  Not installed. Run: bun install"
  exit 1
fi

if [[ "$latest" == "unknown" ]]; then
  echo ""
  echo "  Could not reach npm registry."
  exit 1
fi

if [[ "$installed" == "$latest" ]]; then
  echo ""
  echo "  Up to date."
  exit 0
fi

# Compare versions
echo ""
echo "  Update available: $installed -> $latest"
echo ""
echo "  To update:"
echo "    1. Review changelog: https://github.com/badlogic/pi-mono/releases"
echo "    2. Update package.json: \"$pkg\": \"^$latest\""
echo "    3. Run: bun install"
echo "    4. Run: bun test"
exit 2
