"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * /backtest route now redirects to Strategy Lab with backtest tab active
 * This maintains backward compatibility while consolidating the workflow
 */
export default function BacktestRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to Strategy Lab with backtest tab
    router.replace("/strategy-lab?tab=backtest");
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="text-lg mb-2">Yönlendiriliyor...</div>
        <div className="text-sm text-zinc-500">
          /strategy-lab?tab=backtest sayfasına yönlendiriliyorsunuz
        </div>
      </div>
    </div>
  );
}
