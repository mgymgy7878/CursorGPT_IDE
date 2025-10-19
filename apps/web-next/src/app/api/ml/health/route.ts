import { NextResponse } from "next/server";
import { getAuditHealthStats, validateAuditHealth } from "@/lib/ml/auditHealth";

export async function GET() {
  const stats = getAuditHealthStats();
  const validation = validateAuditHealth(stats);
  
  return NextResponse.json({
    ...stats,
    health: validation
  }, {
    status: validation.healthy ? 200 : 400,
    headers: {
      "X-ML-Score-Rate": stats.mlScoreRate.toString(),
      "X-Signal-Null-Rate": stats.mlSignalPartsNullRate.toString(),
      "X-Health-Status": validation.healthy ? "healthy" : "unhealthy"
    }
  });
}
