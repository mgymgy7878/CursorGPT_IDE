#!/bin/bash
# flight-deck.sh - tmux "uçuş güvertesi" setup

set -euo pipefail

SESSION="go-live"
URL="${API_URL:-http://localhost:3003}"

# Check if session exists
if tmux has-session -t "$SESSION" 2>/dev/null; then
  echo "✅ Session '$SESSION' already exists. Attaching..."
  tmux attach -t "$SESSION"
  exit 0
fi

echo "🚀 Creating flight deck tmux session..."

# Create session and split panes
tmux new-session -d -s "$SESSION" -n "flight-deck"

# Pane 0: Green-room check + shell
tmux send-keys -t "$SESSION:0.0" "cd apps/web-next" C-m
tmux send-keys -t "$SESSION:0.0" "echo '🎭 GREEN-ROOM CHECK'" C-m
tmux send-keys -t "$SESSION:0.0" "bash scripts/green-room-check.sh" C-m
tmux send-keys -t "$SESSION:0.0" "echo ''" C-m
tmux send-keys -t "$SESSION:0.0" "echo '💡 Ready for commands...'" C-m

# Pane 1: Live monitoring (right)
tmux split-window -h -t "$SESSION:0.0"
tmux send-keys -t "$SESSION:0.1" "cd apps/web-next" C-m
tmux send-keys -t "$SESSION:0.1" "echo '📊 LIVE MONITORING'" C-m
tmux send-keys -t "$SESSION:0.1" "bash scripts/monitor-live.sh" C-m

# Pane 2: Metrics watch (bottom right)
tmux split-window -v -t "$SESSION:0.1"
tmux send-keys -t "$SESSION:0.2" "cd apps/web-next" C-m
tmux send-keys -t "$SESSION:0.2" "echo '📈 METRICS WATCH'" C-m
tmux send-keys -t "$SESSION:0.2" "export URL='$URL'" C-m
tmux send-keys -t "$SESSION:0.2" "watch -n 10 \"curl -s \\\$URL/api/tools/get_metrics?window=5m 2>/dev/null | jq '{p95:.p95_ms,stale:.staleness_s,err:.error_rate}' || echo 'Waiting for metrics...'\"" C-m

# Select left pane (command pane)
tmux select-pane -t "$SESSION:0.0"

# Attach to session
echo "✅ Flight deck ready!"
echo "📋 Layout:"
echo "   ┌─────────────┬─────────────┐"
echo "   │             │   Monitor   │"
echo "   │   Command   ├─────────────┤"
echo "   │             │   Metrics   │"
echo "   └─────────────┴─────────────┘"
echo ""
echo "Attaching to session '$SESSION'..."
sleep 1

tmux attach -t "$SESSION"

