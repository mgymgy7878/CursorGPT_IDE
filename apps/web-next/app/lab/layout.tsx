import TopTabs from '@/app/_components/TopTabs';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body style={{ margin: 0, background: '#f8fafc', fontFamily: 'Inter, system-ui, Segoe UI, Arial, sans-serif' }}>
        <TopTabs />
        {children}
      </body>
    </html>
  );
}
