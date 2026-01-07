"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Dev'de görünsün diye
    console.error("[app/error.tsx]", error);
  }, [error]);

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ fontSize: 18, fontWeight: 600 }}>Bir hata oluştu</h2>
      <p style={{ opacity: 0.8, marginTop: 8 }}>
        İstersen sayfayı yeniden deneyebiliriz.
      </p>

      <button
        onClick={() => reset()}
        style={{
          marginTop: 16,
          padding: "8px 12px",
          borderRadius: 10,
          border: "1px solid rgba(255,255,255,0.15)",
        }}
      >
        Tekrar dene
      </button>

      {error?.digest ? (
        <div style={{ marginTop: 12, opacity: 0.6, fontSize: 12 }}>
          digest: {error.digest}
        </div>
      ) : null}
    </div>
  );
}
