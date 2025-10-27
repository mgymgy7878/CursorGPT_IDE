# Spark Trading Platform - ML Pipeline Automation (v1.8)
# Cross-platform make targets for retrain → validate → canary → promote

.PHONY: help gates retrain validate mini-canary all clean

# Default target
help:
	@echo ""
	@echo "Spark ML Pipeline (v1.8.1) - Make Targets"
	@echo "=========================================="
	@echo ""
	@echo "Promote Gates:"
	@echo "  make gates         - Check all 6 promote gates"
	@echo ""
	@echo "Retrain Pipeline (v1.8.1):"
	@echo "  make retrain       - Train model (Week 2)"
	@echo "  make validate      - Validate offline (Week 2-3)"
	@echo "  make mini-canary   - Run 3-phase canary (Week 3)"
	@echo "  make all           - Full pipeline (retrain + validate + canary)"
	@echo ""
	@echo "Monitoring:"
	@echo "  make daily-report  - Generate daily risk report"
	@echo "  make psi-check     - Run PSI drift detection"
	@echo ""
	@echo "Utilities:"
	@echo "  make clean         - Clean temporary files"
	@echo "  make evidence      - List all evidence files"
	@echo ""

# Check promote gates
gates:
	@echo "Checking 6 promote gates..."
	@bash scripts/check-promote-gates.sh > evidence/ml/gates_snapshot.json || true
	@echo "Gate status saved: evidence/ml/gates_snapshot.json"

# Model retraining (v1.8.1)
retrain:
	@echo "Training v1.8.1 model..."
	@echo "Note: Training scripts to be created in Week 2"
	# node scripts/ml-prepare-data-v1.8.1.cjs
	# node scripts/ml-train-v1.8.1.cjs
	@echo "Artifacts will be saved to: ml-artifacts/v1.8.1/"

# Offline validation
validate:
	@echo "Validating v1.8.1 model..."
	@echo "Note: Validation scripts to be created in Week 2-3"
	# node scripts/ml-eval-v1.8.1.cjs
	# node scripts/ml-psi-v1.8.1.cjs
	# node scripts/ml-smoke.cjs --model v1.8.1-retrain
	@echo "Evidence: evidence/ml/*_v1.8.1.*"

# Mini-canary (3 phases, 90 min)
mini-canary:
	@echo "Running mini-canary (3 phases, 90 min)..."
	@echo "Note: Mini-canary script to be created in Week 3"
	# node scripts/canary-mini-v1.8.1.cjs --live --confirm
	@echo "Evidence: evidence/ml/canary_run_v1.8.1_*.json"

# Full pipeline
all: gates retrain validate mini-canary
	@echo ""
	@echo "✅ Full pipeline targets executed"
	@echo "Review evidence/ml/ and promote if all gates PASS"

# Daily monitoring
daily-report:
	@node scripts/ml-daily-report.cjs
	@echo "Daily report: evidence/ml/daily/report_$$(date +%Y-%m-%d).json"

# PSI check
psi-check:
	@node scripts/ml-psi-snapshot.cjs
	@echo "PSI snapshot: evidence/ml/psi_snapshot.json"

# Evidence listing
evidence:
	@echo ""
	@echo "Evidence Files:"
	@ls -lh evidence/ml/*.json 2>/dev/null || echo "No evidence files found"
	@echo ""
	@echo "Daily Reports:"
	@ls -lh evidence/ml/daily/*.json 2>/dev/null | tail -5 || echo "No daily reports"
	@echo ""

# Clean temporary files
clean:
	@echo "Cleaning temporary files..."
	@rm -f evidence/ml/*_temp.json 2>/dev/null || true
	@rm -f logs/*.log.* 2>/dev/null || true
	@echo "✅ Clean complete"

