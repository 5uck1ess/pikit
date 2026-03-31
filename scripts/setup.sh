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

# Write a .pikit.json config pointing to the harness
cat > "$repo/.pikit.json" <<CONF
{
  "harness": "$harness_dir"
}
CONF
echo "Created $repo/.pikit.json -> $harness_dir"

# Symlink for pi-mono discovery
ln -sfn "$harness_dir" "$repo/.pi"

# Ensure .gitignore covers pikit files
gitignore="$repo/.gitignore"
touch "$gitignore"

ignore_entries=(".pikit.json" ".pi" ".pikit/")
for entry in "${ignore_entries[@]}"; do
  grep -qxF "$entry" "$gitignore" || echo "$entry" >> "$gitignore"
done

echo "Updated $gitignore"
echo ""
echo "Ready. Run 'pi' in $repo to start."
