# Local routines (macOS)

Runs the daily / weekly / monthly Insigtrade routines on **your Mac only**, scheduled via `launchd`. No one else can see them. Uses your existing Claude Code (Max plan) so there's no API cost.

## What this gives you

| Routine | Schedule (local time) | Purpose |
|---|---|---|
| **daily** | 09:00 and 17:00 | Publish 2 blog posts |
| **weekly** | Monday 08:00 | Top up keyword queue with ~20 new ideas |
| **monthly** | 1st of month, 09:00 | Pull GSC/Ahrefs perf data, feed wins back into queue |

All three call your site's `/api/cron/*` endpoints. No Supabase credentials ever leave your machine; only the `CRON_SECRET` does.

## Install

```bash
cd scripts/local-routines
./install.sh
```

The script reads `CRON_SECRET` from `../../.env.local`, renders the templates with that value, copies them under `~/insigtrade-routines/`, drops three plists in `~/Library/LaunchAgents/`, and loads them.

**Re-runnable**: re-run any time you change the templates or rotate `CRON_SECRET`.

## Verify

```bash
# 1. launchd sees all three agents
launchctl list | grep insigtrade

# 2. test the daily routine right now (one-off)
~/insigtrade-routines/runner.sh daily

# 3. tail the latest log as it runs
tail -f ~/insigtrade-routines/logs/daily_*.log

# 4. confirm the post landed
curl -s -H "Authorization: Bearer $(grep ^CRON_SECRET ~/insigtrade-routines/daily.prompt.md | head -1 | sed 's/.*Bearer //;s/ .*//')" \
  https://insigtrade.com/api/cron/queue-status
```

## Caveats

- **Mac must be awake at fire time.** If the Mac is asleep, launchd defers the run until next wake. If it's powered off, that run is lost. Solutions:
  - `pmset` keep-awake during your business hours, OR
  - Migrate to a $5/month Linux VPS later (templates work the same; only `launchd` → `cron` swap is needed)
- **Claude CLI auth.** The runner uses your Claude Code's OAuth token. If you've never run `claude` interactively on this Mac, do that once first to authenticate. If launchd later complains about keychain access, run `claude setup-token` to install a long-lived token.

## Files in this directory

| File | Purpose |
|---|---|
| `install.sh` | Renders + installs everything |
| `uninstall.sh` | Removes launchd agents (`--purge` also deletes prompts/logs) |
| `templates/*` | Source templates with `__PLACEHOLDER__` tokens — never committed with real secrets |

## What lives in `~/insigtrade-routines/` (NOT in git)

```
~/insigtrade-routines/
├── claude-wrapper.sh        # always resolves to the highest claude-code version
├── runner.sh                # piped-prompt entrypoint used by all 3 plists
├── daily.prompt.md          # contains your CRON_SECRET — mode 600
├── weekly.prompt.md         # ditto
├── monthly.prompt.md        # ditto
└── logs/
    ├── daily_2026-05-29_170000.log
    ├── daily.launchd.out.log
    ├── daily.launchd.err.log
    ├── weekly_*.log
    └── monthly_*.log
```

Prompts are `chmod 600` so only your user can read them, even on a shared Mac.

## Uninstall

```bash
cd scripts/local-routines
./uninstall.sh           # keep logs in ~/insigtrade-routines/logs
./uninstall.sh --purge   # delete everything
```
