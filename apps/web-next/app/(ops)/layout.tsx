import TopTabs from '@/app/_components/TopTabs';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export default function OpsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <TopTabs />
      {children}
    </>
  );
}
