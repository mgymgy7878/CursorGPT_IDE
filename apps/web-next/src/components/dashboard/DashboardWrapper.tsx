'use client';

import AlarmCard from '@/components/dashboard/AlarmCard';
import SmokeCard from '@/components/dashboard/SmokeCard';
import DashboardClient, { type DevState } from '@/components/dashboard/DashboardClient';

interface DashboardWrapperProps {
  devState: DevState | null;
}

export default function DashboardWrapper({ devState }: DashboardWrapperProps) {
  // Dashboard ana içeriğini render et
  return <DashboardClient devState={devState} />;
}

