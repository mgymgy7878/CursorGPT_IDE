'use client';

import { useEffect } from 'react';
import { redirect } from 'next/navigation';

export default function StrategyLab() {
  useEffect(() => {
    redirect('/strategies?tab=lab');
  }, []);
  return null;
}
