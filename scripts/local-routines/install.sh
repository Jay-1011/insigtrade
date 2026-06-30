#!/bin/zsh
# Insigtrade local routines installer.
#
# Renders the templates under ./templates with your real CRON_SECRET and
# installs the result under:
#   ~/insigtrade-routines/                  (scripts + prompts + logs)
#   ~/Library/LaunchAgents/com.insigtrade.* (launchd plists)
#
# Then loads each launchd job so the schedules become active immediately.
#
# Usage:
#   cd scripts/local-routines
#   ./install.sh           # reads CRON_SECRET from ../../.env.local
#   CRON_SECRET=xyz ./install.sh   # or pass it explicitly
#
# Safe to re-run: rewrites prompts + scripts in place, reloads launchd
# agents. Will NOT clobber the logs/ directory.

set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$HERE/../.." && pwd)"
TEMPLATES_DIR="$HERE/templates"
ROUTINE_DIR="$HOME/insigtrade-routines"
LAUNCHD_DIR="$HOME/Library/LaunchAgents"

# ── 1. resolve CRON_SECRET + optional notification env vars ──
read_env_var() {
  local name="$1"
  if [[ -z "${(P)name:-}" ]]; then
    if [[ -f "$REPO_ROOT/.env.local" ]]; then
      eval "$name=$(grep -E "^${name}=" "$REPO_ROOT/.env.local" | cut -d= -f2- | tr -d '"' | tr -d "'")"
    fi
  fi
}
read_env_var CRON_SECRET
read_env_var RESEND_API_KEY
read_env_var NOTIFY_EMAIL

if [[ -z "${CRON_SECRET:-}" ]]; then
  echo "✗ CRON_SECRET is not set." >&2
  echo "  Either export CRON_SECRET=... in your shell, or put it in $REPO_ROOT/.env.local" >&2
  exit 1
fi
echo "✓ Found CRON_SECRET (${#CRON_SECRET} chars)"

if [[ -n "${RESEND_API_KEY:-}" ]]; then
  echo "✓ Found RESEND_API_KEY (${#RESEND_API_KEY} chars) — email notifications enabled"
else
  echo "ℹ RESEND_API_KEY not set — only macOS notifications. Sign up at"
  echo "  https://resend.com (free, ~2 min), add RESEND_API_KEY to .env.local,"
  echo "  then re-run this installer to enable email alerts."
fi

NOTIFY_EMAIL="${NOTIFY_EMAIL:-jaypatel1833@gmail.com}"
echo "✓ Notifications will go to: $NOTIFY_EMAIL"

# ── 2. set up directory ────────────────────────────────────────
mkdir -p "$ROUTINE_DIR/logs"
echo "✓ Ensured $ROUTINE_DIR/"

# ── 3. render scripts ──────────────────────────────────────────
install -m 0755 "$TEMPLATES_DIR/claude-wrapper.sh.template" "$ROUTINE_DIR/claude-wrapper.sh"
install -m 0755 "$TEMPLATES_DIR/runner.sh.template"         "$ROUTINE_DIR/runner.sh"
install -m 0755 "$TEMPLATES_DIR/status.sh.template"         "$ROUTINE_DIR/status.sh"
install -m 0755 "$TEMPLATES_DIR/notify.sh.template"         "$ROUTINE_DIR/notify.sh"
echo "✓ Installed claude-wrapper.sh + runner.sh + status.sh + notify.sh"

# ── 4. render prompt files ─────────────────────────────────────
render_prompt() {
  local name="$1"
  local src="$TEMPLATES_DIR/${name}.prompt.md.template"
  local dst="$ROUTINE_DIR/${name}.prompt.md"
  # Use a safe delimiter for sed to handle any characters in the secret.
  awk -v secret="$CRON_SECRET" '{ gsub(/__CRON_SECRET__/, secret); print }' "$src" >"$dst"
  chmod 600 "$dst"   # prompts contain the bearer secret; keep them private
  echo "✓ Rendered $dst (mode 600)"
}
render_prompt daily
render_prompt weekly
render_prompt monthly

# ── 5. render launchd plists ───────────────────────────────────
mkdir -p "$LAUNCHD_DIR"
render_plist() {
  local name="$1"
  local src="$TEMPLATES_DIR/com.insigtrade.${name}.plist.template"
  local dst="$LAUNCHD_DIR/com.insigtrade.${name}.plist"
  awk -v home="$HOME" \
      -v routine_dir="$ROUTINE_DIR" \
      -v notify_email="$NOTIFY_EMAIL" \
      -v resend_key="${RESEND_API_KEY:-}" '{
    gsub(/__HOME__/, home);
    gsub(/__ROUTINE_DIR__/, routine_dir);
    gsub(/__NOTIFY_EMAIL__/, notify_email);
    gsub(/__RESEND_API_KEY__/, resend_key);
    print
  }' "$src" >"$dst"
  # Plist contains the Resend key — keep it private.
  chmod 600 "$dst"
  echo "✓ Rendered $dst (mode 600)"
}
render_plist daily
render_plist weekly
render_plist monthly

# ── 6. load launchd agents ─────────────────────────────────────
load_agent() {
  local name="$1"
  local plist="$LAUNCHD_DIR/com.insigtrade.${name}.plist"
  # bootout first (idempotent reload) — ignore failures if it's not loaded
  launchctl bootout "gui/$(id -u)" "$plist" 2>/dev/null || true
  launchctl bootstrap "gui/$(id -u)" "$plist"
  echo "✓ Loaded com.insigtrade.${name}"
}
load_agent daily
load_agent weekly
load_agent monthly

echo ""
echo "==========================================================="
echo "Done. Verify with:"
echo "  launchctl list | grep insigtrade"
echo ""
echo "Trigger the daily routine now (one-off test) with:"
echo "  $ROUTINE_DIR/runner.sh daily"
echo "  tail -f $ROUTINE_DIR/logs/daily_*.log"
echo ""
echo "Notifications:"
echo "  - macOS Notification Center alerts on every real run"
if [[ -n "${RESEND_API_KEY:-}" ]]; then
  echo "  - Emails go to $NOTIFY_EMAIL via Resend"
else
  echo "  - Email DISABLED. To enable:"
  echo "    1. Sign up at https://resend.com with $NOTIFY_EMAIL"
  echo "    2. Copy your API key into .env.local as RESEND_API_KEY=re_..."
  echo "    3. Re-run this installer"
fi
echo "==========================================================="
