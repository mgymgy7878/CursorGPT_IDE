import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export const metadata = { title: "Spark Platform", description: "Trading & Analytics" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <ErrorBoundary>
          <div className="flex h-screen">
            <Sidebar />
            <main className="flex-1 overflow-auto">{children}</main>
          </div>
        </ErrorBoundary>
      </body>
    </html>
  );
}
