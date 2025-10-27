export const dynamic = 'force-dynamic';
export const revalidate = 0;

import dynamicImport from 'next/dynamic';
const ClientStarter = dynamicImport(() => import('./ClientStarter'), { ssr: false });

export default function OptimizationPage() {
  return (
    <div style={{padding:16}}>
      <h1 style={{fontSize:18, marginBottom:8}}>Optimization Lab</h1>
      <p style={{fontSize:14, marginBottom:16, opacity:0.7}}>
        Mock HPO Runner - v1.3 iskelet
      </p>
      <ClientStarter />
    </div>
  );
}
