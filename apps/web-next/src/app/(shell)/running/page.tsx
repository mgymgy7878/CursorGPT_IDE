'use client';

import { useEffect } from 'react';
import RunningStrategiesPage from '@/components/strategies/RunningStrategiesPage';

export default function RunningPage() {
  // UI-1: Document title (SEO + browser tabs)
  useEffect(() => {
    document.title = 'Çalışan Stratejiler — Spark Trading';
  }, []);

  return <RunningStrategiesPage />;
}

