# Geçici: prod bağımlılıklarını analiz et ve raporla
pnpm -w dedupe
pnpm -w ls --depth 1 > evidence/deps_tree.txt
pnpm -w why prom-client tdigest bintrees @alloc/quick-lru object-hash picocolors dlv is-glob postcss-selector-parser postcss-nested postcss-js > evidence/deps_why.txt
Write-Host "RAPOR: evidence/deps_tree.txt ve evidence/deps_why.txt"
