import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Spark Trading v2',
  description: 'Trading platform UI v2',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className="min-h-dvh bg-neutral-950 text-neutral-100 antialiased">
        {children}
      </body>
    </html>
  );
}

