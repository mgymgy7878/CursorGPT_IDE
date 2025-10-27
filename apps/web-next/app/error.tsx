'use client';
export default function Error({ error }: { error: Error }) {
  console.error('[app/error]', error);
  return <pre>App Error: {String(error)}</pre>;
}
