"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{ padding: 24, fontFamily: "system-ui" }}>
      <h2>Beklenmeyen Hata</h2>
      <pre style={{ whiteSpace: "pre-wrap" }}>{error?.message ?? "Bilinmeyen hata"}</pre>
      <button onClick={() => reset()}>Yeniden Dene</button>
      <button onClick={() => window.location.reload()} style={{ marginLeft: 8 }}>
        Hard Reload
      </button>
    </div>
  );
}


