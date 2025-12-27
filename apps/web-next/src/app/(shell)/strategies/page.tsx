import StrategiesPageClient from "./strategies-page-client";

interface StrategiesPageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function StrategiesPage({ searchParams }: StrategiesPageProps) {
  const params = await searchParams;
  
  // Normalize tab: invalid values default to 'list'
  // Only 'lab' is valid for lab tab, everything else is 'list'
  const tab = params?.tab === 'lab' ? 'lab' : 'list';
  
  return <StrategiesPageClient initialTab={tab} />;
}
