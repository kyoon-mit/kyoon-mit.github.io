#!/bin/bash
# Refresh the BNS live-runs page and publish it if anything changed.
# Meant for cron, e.g. hourly:
#   0 * * * * /home/kyoon/SSM-BNS/WEB/kyoon-mit.github.io/tools/refresh_live.sh >> /tmp/bns_live_refresh.log 2>&1
set -euo pipefail
export PATH="$HOME/.local/bin:/usr/local/bin:/usr/bin:/bin"

REPO=$(cd "$(dirname "$0")/.." && pwd)
cd "$REPO"

git pull --quiet --rebase
uv run --script tools/bns_live.py

# The timestamp alone is not a change worth a commit.
changed=$(git diff -U0 -- docs/_data/bns_live.yml | grep -E '^[+-][^+-]' | grep -vE '^[+-]updated:' || true)
if [ -z "$changed" ] && git diff --quiet -- docs/assets/img/bns/live; then
    git checkout -- docs/_data/bns_live.yml
    echo "$(date '+%F %T') no change"
    exit 0
fi

git add docs/_data/bns_live.yml docs/assets/img/bns/live
git commit --quiet -m "Refresh live runs

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
git push --quiet origin HEAD:main
echo "$(date '+%F %T') published"
