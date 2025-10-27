'use client';
export default function GlobalError({ error }: { error: Error }) {
  console.error('[global-error]', error);
  return <html><body><pre>Global Error: {String(error)}</pre></body></html>;
}
