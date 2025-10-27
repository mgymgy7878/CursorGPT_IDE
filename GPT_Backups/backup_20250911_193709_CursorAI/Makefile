# GA Ship Makefile Targets
# Usage: make ga-verify NONCE=20250827180000-a1b2c3

.PHONY: ga-verify ga-archive ga-watch-report ga-self-check ga-stop-gate-triage

# GA Ship verification
ga-verify:
	@echo "🔍 GA Ship Verification - NONCE: $(NONCE)"
	@set -e; ./scripts/verify-offline.sh \
	  evidence/receipts-smoke/$(NONCE)/sha256-manifest.json \
	  evidence/receipts-smoke/$(NONCE)/sha256-manifest.json.asc

# GA Ship archive
ga-archive:
	@echo "📦 GA Ship Archive - NONCE: $(NONCE), VERSION: $(VERSION)"
	@set -e; mkdir -p evidence/ga/$(VERSION)/$(NONCE); \
	rsync -a evidence/receipts-smoke/$(NONCE)/ evidence/ga/$(VERSION)/$(NONCE)/; \
	ln -sfn evidence/ga/$(VERSION)/$(NONCE) evidence/ga/$(VERSION)/latest

# GA Ship monitoring report
ga-watch-report:
	@echo "📊 GA Ship Monitoring Report"
	@echo "fail_5m=$$(curl -s $(PROM)/api/v1/query?query=sum(rate(receipts_gate_fail_total[5m])) | jq -r .data.result[0].value[1])"
	@echo "nonce_reuse_48h=$$(curl -s $(PROM)/api/v1/query?query=sum(increase(nonce_reuse_detected_total[48h])) | jq -r .data.result[0].value[1])"
	@echo "duration_p95_1h=$$(curl -s $(PROM)/api/v1/query?query=max_over_time(receipts_gate_duration_ms_p95[1h]) | jq -r .data.result[0].value[1])"

# GA Ship self-check
ga-self-check:
	@echo "🔍 GA Ship Self-Check - NONCE: $(NONCE)"
	@./scripts/ga-self-check.sh $(NONCE)

# GA Ship stop-gate triage
ga-stop-gate-triage:
	@echo "🚨 GA Ship Stop-Gate Triage - NONCE: $(NONCE), INCIDENT: $(INCIDENT)"
	@./scripts/ga-stop-gate-triage.sh $(NONCE) $(INCIDENT)

# GA Ship complete archive with compression
ga-archive-complete:
	@echo "📦 GA Ship Complete Archive - NONCE: $(NONCE), VERSION: $(VERSION)"
	@./scripts/ga-archive.sh $(NONCE) $(VERSION)

# GA Ship 48-hour watch
ga-watch-48h:
	@echo "📊 GA Ship 48-Hour Watch - Checkpoint: $(CHECKPOINT)"
	@./scripts/ga-watch-48h.sh $(PROM) $(NONCE) $(CHECKPOINT)

# GA Ship quick status
ga-status:
	@echo "📋 GA Ship Status"
	@echo "Latest NONCE: $$(ls -t evidence/receipts-smoke/ | head -1)"
	@echo "Latest manifest: evidence/receipts-smoke/$$(ls -t evidence/receipts-smoke/ | head -1)/sha256-manifest.json"
	@echo "Latest archive: $$(readlink -f evidence/ga/$(VERSION)/latest 2>/dev/null || echo 'No archive')"

# GA Ship quick validation
ga-quick-validate:
	@echo "🔍 GA Ship Quick Validation - NONCE: $(NONCE)"
	@./scripts/ga-quick-validate.sh $(NONCE)

# GA Ship enhanced quick validation (with hardening)
ga-quick-validate-enhanced:
	@echo "🔍 GA Ship Enhanced Quick Validation - NONCE: $(NONCE)"
	@./scripts/ga-quick-validate-enhanced.sh $(NONCE)

# GA Ship health scan
ga-health-scan:
	@echo "🔍 GA Ship Health Scan"
	@./scripts/ga-health-scan.sh

# GA Ship closeout
ga-closeout:
	@echo "📋 GA Ship Closeout - NONCE: $(NONCE), PROM: $(PROM)"
	@./scripts/ga-closeout.sh $(NONCE) $(PROM)

# GA Ship manifest generation
ga-manifest:
	@echo "📝 GA Ship Manifest Generation - NONCE: $(NONCE)"
	@node scripts/make-manifest.mjs $(NONCE) $(if $(PREV),--prev $(PREV),) $(if $(OUT),--out $(OUT),)

# GA Ship GPG FPR pin control
ga-fpr-pin:
	@echo "🔐 GA Ship GPG FPR Pin Control"
	@node scripts/gpg-fpr-pin.mjs $(SIG) $(MANIFEST) $(if $(REQUIRED_FPR),--required-fpr $(REQUIRED_FPR),)

# GA Ship chaos probe
ga-chaos-probe:
	@echo "🚨 GA Ship Chaos Probe - Type: $(PROBE_TYPE)"
	@node scripts/make-receipts-chaos.mjs --probe $(PROBE_TYPE)

# GA Ship complete GREEN workflow
ga-green:
	@echo "🟢 GA Ship Complete GREEN Workflow - NONCE: $(NONCE)"
	@echo "1️⃣ Creating manifest..."
	@$(MAKE) ga-manifest NONCE=$(NONCE)
	@echo "2️⃣ Signing manifest..."
	@gpg --detach-sign --armor -o evidence/receipts-smoke/$(NONCE)/sha256-manifest.json.asc evidence/receipts-smoke/$(NONCE)/sha256-manifest.json
	@echo "3️⃣ Enhanced validation..."
	@$(MAKE) ga-quick-validate-enhanced NONCE=$(NONCE)
	@echo "4️⃣ Health scan..."
	@$(MAKE) ga-health-scan
	@echo "5️⃣ Chaos probe..."
	@$(MAKE) ga-chaos-probe PROBE_TYPE=receipts_fail
	@echo "✅ GA Ship GREEN workflow completed!"

# GA Ship help
ga-help:
	@echo "GA Ship Makefile Targets:"
	@echo "  ga-verify NONCE=<nonce>                    - Verify GA ship manifest"
	@echo "  ga-archive NONCE=<nonce> VERSION=<version> - Archive GA ship files"
	@echo "  ga-watch-report PROM=<prometheus_url>      - Get monitoring metrics"
	@echo "  ga-self-check NONCE=<nonce>                - Run 3-minute self-check"
	@echo "  ga-stop-gate-triage NONCE=<nonce> INCIDENT=<type> - Run incident triage"
	@echo "  ga-archive-complete NONCE=<nonce> VERSION=<version> - Complete archive with compression"
	@echo "  ga-watch-48h PROM=<url> NONCE=<nonce> CHECKPOINT=<T0|T+4h|T+24h|T+48h> - 48-hour monitoring"
	@echo "  ga-status VERSION=<version>                - Show GA ship status"
	@echo "  ga-quick-validate NONCE=<nonce>            - Quick validation (tag, manifest, signature, chain)"
	@echo "  ga-quick-validate-enhanced NONCE=<nonce>   - Enhanced validation (with hardening)"
	@echo "  ga-health-scan                             - Health scan (vulnerabilities, dependencies, environment)"
	@echo "  ga-closeout NONCE=<nonce> PROM=<url>       - T+48h final assessment"
	@echo "  ga-manifest NONCE=<nonce> [PREV=<prev>] [OUT=<out>] - Generate manifest"
	@echo "  ga-fpr-pin SIG=<sig> MANIFEST=<manifest> [REQUIRED_FPR=<fpr>] - GPG FPR pin control"
	@echo "  ga-chaos-probe PROBE_TYPE=<type>           - Chaos probe (receipts_fail, fpr_mismatch, nonce_reuse, offline_verify_fail)"
	@echo "  ga-green NONCE=<nonce>                     - Complete GREEN workflow"
	@echo "  ga-help                                    - Show this help" 