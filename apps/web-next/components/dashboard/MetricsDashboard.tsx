'use client';

import React from "react";
import KPIBar from "@/components/dashboard/KPIBar";
import HealthBanner from "@/components/common/HealthBanner";
import dynamic from "next/dynamic";
const CanaryKPI = dynamic(()=>import('@/components/dashboard/CanaryKPI'),{ ssr:false });
const CanaryAlert = dynamic(()=>import('@/components/dashboard/CanaryAlert'),{ ssr:false });
const CanaryMatrix = dynamic(()=>import('@/components/dashboard/CanaryMatrix'),{ ssr:false });
const AdvisorBanner = dynamic(()=>import('@/components/dashboard/AdvisorBanner'),{ ssr:false });

function useFusionHealth(){
	// placeholder: wire real state/endpoint later
	return { featuresHashOk: true } as { featuresHashOk: boolean };
}

export default function MetricsDashboard() {
	const { featuresHashOk } = useFusionHealth();
	return (
		<div className="space-y-2">
			<HealthBanner />
			{!featuresHashOk && (
				<div className="inline-flex items-center gap-2 text-sm px-2 py-1 rounded bg-yellow-100 text-yellow-800" title="Model features != online features; retrain önerin.">
					<span className="w-2 h-2 rounded-full bg-yellow-500" />
					<span>Features hash uyumsuz</span>
				</div>
			)}
			<CanaryAlert />
			<AdvisorBanner />
			<CanaryKPI />
			<CanaryMatrix />
			<KPIBar />
		</div>
	);
} 