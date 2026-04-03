#!/usr/bin/env bash
set -euo pipefail

harness_dir="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== Pikit Install ==="

# Bun
if ! command -v bun &>/dev/null; then
  echo "Installing bun..."
  curl -fsSL https://bun.sh/install | bash
  export PATH="$HOME/.bun/bin:$PATH"
fi
echo "bun: $(bun --version)"

# pi-mono
pkg="@mariozechner/pi-coding-agent"
if ! command -v pi &>/dev/null; then
  echo "Installing $pkg..."
  bun install -g "$pkg"
else
  installed=$(pi --version 2>/dev/null || echo "unknown")
  latest=$(npm view "$pkg" version 2>/dev/null || echo "unknown")
  if [[ "$latest" != "unknown" && "$installed" != "$latest" ]]; then
    echo "pi: $installed -> $latest (updating...)"
    bun install -g "$pkg"
  else
    echo "pi: $installed (up to date)"
  fi
fi

# RTK (https://github.com/rtk-ai/rtk)
if command -v rtk &>/dev/null; then
  if command -v brew &>/dev/null; then
    outdated=$(brew outdated --quiet rtk 2>/dev/null || true)
    if [[ -n "$outdated" ]]; then
      echo "rtk: updating..."
      brew upgrade rtk
    else
      echo "rtk: $(rtk --version 2>/dev/null || echo 'installed') (up to date)"
    fi
  else
    echo "rtk: $(rtk --version 2>/dev/null || echo 'installed')"
  fi
else
  echo "Installing rtk..."
  if command -v brew &>/dev/null; then
    brew install rtk
  else
    echo "Error: Homebrew not found. Install rtk manually: https://github.com/rtk-ai/rtk"
    exit 1
  fi
fi

# Harness dependencies
echo "Installing pikit dependencies..."
(cd "$harness_dir" && bun install)

echo ""
echo "=== Done ==="
echo ""
echo "Next:"
echo "  1. Link to a project:  ./scripts/setup.sh /path/to/project"
echo "  2. Start coding:       cd /path/to/project && pi"
echo ""
echo "  Set API key:  export ANTHROPIC_API_KEY=sk-ant-..."
echo "  Switch model: /config apply codex    (or anthropic, gemini)"
echo ""
echo "Workflows:"
echo "  /workflow brainstorm <idea>          — Open ideation"
echo "  /workflow feature <prompt>           — Brainstorm → Plan → Implement"
echo "  /workflow code-review <target>       — Analyze → Summarize"
echo "  /workflow research <question>        — Clarify → Search → Analyze → Synthesize"
echo "  /workflow test <target>              — Analyze → Generate → Run → Fix"
echo "  /workflow tri-review <target>        — 3-tier review → Consolidate"
echo "  /workflow tri-dispatch <prompt>      — 3 models → Compare"
echo "  /workflow self-improve <metric cmd>  — Metric-gated iteration"
