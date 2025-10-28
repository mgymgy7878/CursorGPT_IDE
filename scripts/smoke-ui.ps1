$ErrorActionPreference='Stop'
$Base='http://127.0.0.1:3003'
$endpoints=@('/','/portfolio','/strategies','/running','/settings','/api/health')
$ok=$true
New-Item -Force -ItemType Directory -Path 'evidence/ui-smoke' | Out-Null
foreach($p in $endpoints){
  $r=Invoke-WebRequest -UseBasicParsing -Uri ($Base+$p) -Method Get -TimeoutSec 10 -ErrorAction SilentlyContinue
  if(-not $r -or $r.StatusCode -ne 200){ Write-Host "FAIL $p"; $ok=$false } else { Write-Host "OK $p" }
}
$hdr=(Invoke-WebRequest -UseBasicParsing -Method Head -Uri "$Base/api/public/metrics.prom").Headers
$ct=$hdr['Content-Type']; $cc=$hdr['Cache-Control']
if($ct -notlike 'text/plain; version=0.0.4*'){ Write-Host "BAD CT: $ct"; $ok=$false } else { Write-Host "OK CT" }
if(($cc -notlike '*no-store*')){ Write-Host "BAD CC: $cc"; $ok=$false } else { Write-Host "OK CC" }
"CT=$ct`nCC=$cc" | Out-File evidence/ui-smoke/headers.txt -Encoding utf8
if(-not $ok){ throw 'SMOKE FAIL' } else { 'SMOKE PASS' | Out-File evidence/ui-smoke/_summary.txt }
