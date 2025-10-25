icgo(){ cat <<'TXT'
I am IC.
Karar penceresi: 5 dk
8/8 proceed | 1-2 hold | ≥3 rollback
Kanıt: #war-room-spark
TXT
}
abort(){ cat <<'TXT'
p95>400ms OR 5xx>3% OR ws>120s
Korelasyon tetikleyicileri
Rollback: release:rollback <tag>
Kanıt: metrics+logs
TXT
}
echo "Bash alias'lar: icgo / abort"

