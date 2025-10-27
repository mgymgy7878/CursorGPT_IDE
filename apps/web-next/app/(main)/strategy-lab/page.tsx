export const dynamic = 'force-dynamic';
export const revalidate = 0;

import dynamicImport from 'next/dynamic';
const SSEQualityCard = dynamicImport(() => import('@/components/sse/SSEQualityCard'), { ssr: false });

export default function StrategyLabPage() {
  return (
    <div style={{padding:16}}>
      <h1 style={{fontSize:18, marginBottom:8}}>Strategy Lab</h1>
      <SSEQualityCard />
    </div>
  );
}
