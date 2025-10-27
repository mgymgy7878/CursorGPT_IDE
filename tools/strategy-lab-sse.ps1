# tools/strategy-lab-sse.ps1
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$EVIDENCE_DIR = "evidence/local/strategy-lab"
New-Item -ItemType Directory -Force -Path $EVIDENCE_DIR | Out-Null
$OUT_JSONL = Join-Path $EVIDENCE_DIR "sse_stream.jsonl"

$uri = "http://127.0.0.1:4001/api/backtest/jobs/stream/test-id"  # UI butonu yerine direkt SSE fallback stream
$client = [System.Net.Http.HttpClient]::new()
$client.Timeout = [TimeSpan]::FromSeconds(10)
$req = [System.Net.Http.HttpRequestMessage]::new([System.Net.Http.HttpMethod]::Get, $uri)
$req.Headers.Accept.Add([System.Net.Http.Headers.MediaTypeWithQualityHeaderValue]::new("text/event-stream"))

$resp = $client.Send($req, [System.Net.Http.HttpCompletionOption]::ResponseHeadersRead)
$stream = $resp.Content.ReadAsStream()
$reader = New-Object System.IO.StreamReader($stream)

$stopAt = (Get-Date).AddSeconds(30)
while ((Get-Date) -lt $stopAt) {
  $line = $reader.ReadLine()
  if ($null -eq $line) { Start-Sleep -Milliseconds 50; continue }
  if ($line.Trim().StartsWith("data:")) {
    $json = $line.Substring(5).Trim()
    if ($json.Length -gt 0) { $json | Add-Content -Path $OUT_JSONL -Encoding UTF8 }
  }
}
$reader.Dispose(); $stream.Dispose(); $client.Dispose()
"Saved SSE evidence to: $OUT_JSONL"
