import "./globals.css";
import Link from "next/link";
import TopTabs from '@/app/_components/TopTabs';
import SystemBadges from '@/components/SystemBadges';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className="h-full">
      <body className="h-full bg-neutral-950 text-neutral-100 antialiased overflow-hidden">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-neutral-800">
            <TopTabs />
            <SystemBadges />
          </div>
          <main className="flex-1 container mx-auto px-4 py-6 max-w-7xl overflow-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}