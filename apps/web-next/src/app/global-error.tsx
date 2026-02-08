'use client';

/**
 * Global Error Boundary - Root seviyesinde hataları yakalar
 * Layout/root tarafında patlayan hatalar segment error.tsx'e düşmeyebilir
 * Bu dosya "beyaz ekran"ı daima bir hata ekranına çevirir.
 * BOOT: Bu ekran görünüyorsa root/layout crash yakalandı demektir.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html data-boot="global-error">
      <body style={{ padding: 24, fontFamily: 'ui-sans-serif, system-ui', background: '#000', color: '#fff', margin: 0 }}>
        <div style={{ marginBottom: 16, padding: '8px 12px', background: '#1a1a2e', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
          BOOT: global-error (root crash yakalandı)
        </div>
        <h1 style={{ fontSize: 18, marginBottom: 8, fontWeight: 600 }}>Uygulama Hatası</h1>
        <p style={{ opacity: 0.8, marginBottom: 12, fontSize: 14 }}>
          Root seviyesinde bir hata oluştu. (digest: {error.digest ?? 'yok'})
        </p>
        <pre style={{ 
          whiteSpace: 'pre-wrap', 
          background: '#111', 
          color: '#eee', 
          padding: 12, 
          borderRadius: 12,
          fontSize: 12,
          lineHeight: 1.5,
          overflow: 'auto',
          maxHeight: '60vh'
        }}>
          {String(error?.stack ?? error?.message ?? error)}
        </pre>
        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          <button
            onClick={() => reset()}
            style={{ 
              padding: '10px 14px', 
              borderRadius: 10, 
              cursor: 'pointer',
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              fontSize: 14,
              fontWeight: 500
            }}
          >
            Tekrar dene
          </button>
          <button
            onClick={() => window.location.reload()}
            style={{ 
              padding: '10px 14px', 
              borderRadius: 10, 
              cursor: 'pointer',
              background: '#374151',
              color: '#fff',
              border: 'none',
              fontSize: 14,
              fontWeight: 500
            }}
          >
            Sayfayı yenile
          </button>
        </div>
      </body>
    </html>
  );
}
