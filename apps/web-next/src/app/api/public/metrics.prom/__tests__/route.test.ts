import { GET } from '../route';

describe('/api/public/metrics.prom', () => {
  it('should return 200 status', async () => {
    const response = await GET();
    expect(response.status).toBe(200);
  });

  it('should have correct Content-Type header (Prometheus 0.0.4)', async () => {
    const response = await GET();
    const contentType = response.headers.get('Content-Type');
    
    expect(contentType).toBe('text/plain; version=0.0.4; charset=utf-8');
  });

  it('should have Cache-Control no-store header', async () => {
    const response = await GET();
    const cacheControl = response.headers.get('Cache-Control');
    
    expect(cacheControl).toContain('no-store');
    expect(cacheControl).toContain('no-cache');
  });

  it('should return valid Prometheus text format body', async () => {
    const response = await GET();
    const text = await response.text();
    
    // Check for required metric format
    expect(text).toContain('# HELP spark_up');
    expect(text).toContain('# TYPE spark_up gauge');
    expect(text).toContain('spark_up 1');
  });

  it('should include standard metrics', async () => {
    const response = await GET();
    const text = await response.text();
    
    // Standard metrics should be present
    expect(text).toContain('spark_ws_btcturk_msgs_total');
    expect(text).toContain('spark_ws_staleness_seconds');
    expect(text).toContain('spark_api_latency_p95_ms');
  });

  it('should not include invalid characters in metric names', async () => {
    const response = await GET();
    const text = await response.text();
    
    // Metric names must match [a-zA-Z_:][a-zA-Z0-9_:]*
    const lines = text.split('\n').filter(l => !l.startsWith('#') && l.trim());
    
    for (const line of lines) {
      const metricName = line.split(/\s+/)[0];
      expect(metricName).toMatch(/^[a-zA-Z_:][a-zA-Z0-9_:]*$/);
    }
  });
});

