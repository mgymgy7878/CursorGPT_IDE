# Optimization Lab+ — Bayesian / Genetic

- Optimize Panelinde yöntem seç: `grid | bayesian | genetic`
- Parametreler: `budget` (maks deneme), `earlyStop` (erken durdurma)
- Payload: `action="optimizer.search"` + `{ method, budget, earlyStop, ...grid }`
- Executor 404/501 durumunda UI graceful.
