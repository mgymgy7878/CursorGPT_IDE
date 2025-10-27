export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const mockDecisions = [
    {
      decision_id: 'guard_001',
      ts: Date.now() - 300000,
      score: 85,
      allowed: true,
      confirm_required: false,
      reasons: ['risk_threshold_ok', 'liquidity_sufficient']
    },
    {
      decision_id: 'guard_002', 
      ts: Date.now() - 600000,
      score: 45,
      allowed: false,
      confirm_required: true,
      reasons: ['max_drawdown_exceeded', 'position_size_high']
    },
    {
      decision_id: 'guard_003',
      ts: Date.now() - 900000,
      score: 92,
      allowed: true,
      confirm_required: false,
      reasons: ['all_checks_passed']
    },
    {
      decision_id: 'guard_004',
      ts: Date.now() - 1200000,
      score: 67,
      allowed: true,
      confirm_required: true,
      reasons: ['margin_ratio_low', 'volatility_high']
    },
    {
      decision_id: 'guard_005',
      ts: Date.now() - 1500000,
      score: 23,
      allowed: false,
      confirm_required: false,
      reasons: ['insufficient_balance', 'market_closed']
    },
    {
      decision_id: 'guard_006',
      ts: Date.now() - 1800000,
      score: 78,
      allowed: true,
      confirm_required: false,
      reasons: ['risk_acceptable', 'timing_optimal']
    },
    {
      decision_id: 'guard_007',
      ts: Date.now() - 2100000,
      score: 56,
      allowed: true,
      confirm_required: true,
      reasons: ['leverage_high', 'correlation_risk']
    },
    {
      decision_id: 'guard_008',
      ts: Date.now() - 2400000,
      score: 89,
      allowed: true,
      confirm_required: false,
      reasons: ['strategy_aligned', 'market_conditions_good']
    },
    {
      decision_id: 'guard_009',
      ts: Date.now() - 2700000,
      score: 34,
      allowed: false,
      confirm_required: true,
      reasons: ['stop_loss_triggered', 'slippage_high']
    },
    {
      decision_id: 'guard_010',
      ts: Date.now() - 3000000,
      score: 71,
      allowed: true,
      confirm_required: false,
      reasons: ['partial_fill_ok', 'fees_acceptable']
    }
  ];

  return Response.json(mockDecisions, {
    headers: { 'Cache-Control': 'no-store' }
  });
}
