# Release Checklist

- [ ] Version bump (package.json/labels)
- [ ] Canary smoke: PASS (artifact attached)
- [ ] Dashboard metrics: p95/staleness/exit_code OK
- [ ] Docs updated (Roadmap badge/band + links check)
- [ ] Prometheus rules rendered + `promtool check` PASS
- [ ] Alertmanager routing diff reviewed
- [ ] Export@scale smoke (10k rows) PASS
- [ ] Audit note added to RecentActions
