"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body style={{ margin: 0, padding: 24, fontFamily: "system-ui" }}>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>Global hata</h2>
        <p style={{ opacity: 0.8, marginTop: 8 }}>
          Uygulama seviyesinde bir hata yakalandı.
        </p>

        <button
          onClick={() => reset()}
          style={{
            marginTop: 16,
            padding: "8px 12px",
            borderRadius: 10,
            border: "1px solid rgba(0,0,0,0.2)",
          }}
        >
          Yeniden dene
        </button>

        <pre style={{ marginTop: 16, opacity: 0.7, whiteSpace: "pre-wrap" }}>
          {String(error?.message ?? error)}
        </pre>
      </body>
    </html>
  );
}
