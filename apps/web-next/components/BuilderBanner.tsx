"use client";

export function BuilderBanner() {
  if (process.env.NEXT_PUBLIC_UI_BUILDER !== 'true') return null;
  return (
    <div data-builder="on" className="fixed top-0 inset-x-0 z-50 bg-emerald-600 text-white text-sm py-1 text-center">
      UI Builder Mode • canlı veri yoksa degraded moda düşer • aksiyonlar devre dışı
    </div>
  );
} 