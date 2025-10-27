'use client';
import { useCallback, useEffect, useState } from "react";
export type CanaryStats = { ack_p95_ms?:number; e2db_p95_ms?:number; confirm_total?:number; fail_total?:number; clock_drift_ms?:number; decision?:'GREEN'|'YELLOW'|'RED'; reason?:string|null };
export function useCanaryStats(){
	const [stats,setStats] = useState<CanaryStats>({});
	const refresh = useCallback(async()=>{
		const r = await fetch('/api/public/canary/stats',{method:'POST'}).catch(()=>null);
		setStats(await r?.json().catch(()=>({}))||{});
	},[]);
	useEffect(()=>{ refresh(); },[refresh]);
	return { stats, refresh };
} 