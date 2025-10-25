#!/usr/bin/env bash
# War-Room Shell Alias - Add to ~/.bashrc or ~/.zshrc

# War-room single-line generator
alias wrline='echo "$(date -Is) | stage=${STAGE:-unknown} | p95=${P95:-NaN}ms 5xx=${ERR:-NaN}% ws=${WS:-NaN}s idem=${IDEM:-NaN}% risk=${RISK:-NaN}/min csp=${CSP:-NaN}/min evloop=${EVL:-NaN}ms gc=${GC:-NaN}ms | karar=${KARAR:-pending}"'

# Quick installation
# echo "alias wrline='echo \"\$(date -Is) | stage=\${STAGE:-unknown} | p95=\${P95:-NaN}ms 5xx=\${ERR:-NaN}% ws=\${WS:-NaN}s idem=\${IDEM:-NaN}% risk=\${RISK:-NaN}/min csp=\${CSP:-NaN}/min evloop=\${EVL:-NaN}ms gc=\${GC:-NaN}ms | karar=\${KARAR:-pending}\"'" >> ~/.bashrc

# Usage example:
# export STAGE=5%; export P95=145; export ERR=0.3; export WS=12; export IDEM=0.2; export RISK=0.1; export CSP=0.04; export EVL=15; export GC=10; export KARAR=proceed
# wrline
# Output: 2024-10-25T12:34:56Z | stage=5% | p95=145ms 5xx=0.3% ws=12s idem=0.2% risk=0.1/min csp=0.04/min evloop=15ms gc=10ms | karar=proceed

---

_War-Room Alias | Shell utility | v1.4.0_

