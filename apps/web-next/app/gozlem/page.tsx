import MetricsPreview from '@/app/_components/MetricsPreview';

export default function GozlemPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Gözlem</h1>
      <p className="text-neutral-300">Piyasa ve sistem metrikleri burada gösterilecek.</p>
      <MetricsPreview />
    </div>
  );
}