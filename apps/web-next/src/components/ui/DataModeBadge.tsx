"use client";
import { useEffect, useState } from "react";
import StatusBadge from "./StatusBadge";

/**
 * Data Mode Badge
 * Shows if system is using real or mock data
 * V1.3-P4: Migrated to StatusBadge
 */
export default function DataModeBadge() {
  const [isReal, setIsReal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkDataMode();
    const interval = setInterval(checkDataMode, 30000);
    return () => clearInterval(interval);
  }, []);

  async function checkDataMode() {
    try {
      const response = await fetch("/api/healthz");
      const health = await response.json();
      
      // Check if any venue is UP (not MOCK)
      const hasRealData = 
        health.venues?.btcturk?.status === 'UP' ||
        health.venues?.bist?.status === 'UP';
      
      setIsReal(hasRealData);
      setLoading(false);
    } catch {
      setIsReal(false);
      setLoading(false);
    }
  }

  if (loading) {
    return null;
  }

  return (
    <StatusBadge 
      status={isReal ? 'success' : 'warn'} 
      label={isReal ? 'LIVE' : 'MOCK MODE'}
    />
  );
}

