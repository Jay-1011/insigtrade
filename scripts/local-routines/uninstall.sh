#!/bin/zsh
# Tear down Insigtrade local routines.
# Stops + removes launchd agents and (optionally) the ~/insigtrade-routines tree.

set -euo pipefail
LAUNCHD_DIR="$HOME/Library/LaunchAgents"
ROUTINE_DIR="$HOME/insigtrade-routines"

for name in daily weekly monthly; do
  plist="$LAUNCHD_DIR/com.insigtrade.${name}.plist"
  if [[ -f "$plist" ]]; then
    launchctl bootout "gui/$(id -u)" "$plist" 2>/dev/null || true
    rm -f "$plist"
    echo "✓ Removed $plist"
  fi
done

if [[ "${1:-}" == "--purge" ]]; then
  if [[ -d "$ROUTINE_DIR" ]]; then
    rm -rf "$ROUTINE_DIR"
    echo "✓ Removed $ROUTINE_DIR (logs and prompts)"
  fi
else
  echo "ℹ Kept $ROUTINE_DIR (logs preserved). Run with --purge to delete it."
fi
