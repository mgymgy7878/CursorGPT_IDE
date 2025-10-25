import assert from 'node:assert'

// Local sanity check - not run in CI
// Usage: tsx tests/health.smoke.ts

async function ping(path: string) {
  try {
    const r = await fetch(`http://127.0.0.1:3003${path}`)
    return r.ok
  } catch {
    return false
  }
}

;(async () => {
  console.log('Running health smoke tests...')
  
  const apiOk = await ping('/api/public/error-budget')
  assert.ok(apiOk, 'Error budget endpoint should respond')
  console.log('✓ Error budget API')
  
  const engineOk = await ping('/api/public/engine-health')
  assert.ok(engineOk, 'Engine health endpoint should respond')
  console.log('✓ Engine health API')
  
  console.log('\n✅ Health smoke: PASS')
})()

