export default function TestPage() {
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Test Page</h1>
      <p>Timestamp: {new Date().toISOString()}</p>
      <p>Node ENV: {process.env.NODE_ENV}</p>
      <p>Executor Origin: {process.env.EXECUTOR_ORIGIN}</p>
      <p>Status: OK</p>
    </div>
  );
}
