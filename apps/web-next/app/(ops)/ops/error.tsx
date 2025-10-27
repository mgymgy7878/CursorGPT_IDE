'use client';
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <pre style={{ padding: 16, whiteSpace: 'pre-wrap' }}>
      OPS error: {error.message}{'\n'}{error.stack}
      {'\n\n'}<button onClick={() => reset()}>Retry</button>
    </pre>
  );
}
