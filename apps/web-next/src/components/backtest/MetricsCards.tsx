"use client";

type Props = {
  train?: {
    sharpe: number;
    winRate: number;
    ddMax: number;
    pnl: number;
    trades: number;
  };
  test?: {
    sharpe: number;
    winRate: number;
    ddMax: number;
    pnl: number;
    trades: number;
  };
  overfitting?: {
    detected: boolean;
    ratio: number;
    threshold: number;
  };
};

export default function MetricsCards({ train, test, overfitting }: Props) {
  const Card = ({ title, children, highlight = false }: any) => (
    <div className={`rounded-xl border p-4 ${highlight ? 'border-green-500 bg-green-950/20' : 'border-neutral-800'}`}>
      <div className="text-xs opacity-70 mb-1">{title}</div>
      <div className="text-2xl font-semibold">{children}</div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Overfitting Badge */}
      {overfitting && (
        <div className={`rounded-xl border p-3 ${overfitting.detected ? 'border-red-500 bg-red-950/30' : 'border-green-500 bg-green-950/20'}`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">
                {overfitting.detected ? '⚠️ Overfitting Tespit Edildi' : '✅ Overfitting Tespit Edilmedi'}
              </div>
              <div className="text-xs opacity-70 mt-1">
                Test/Train Sharpe Oranı: {overfitting.ratio.toFixed(3)} 
                {' '}(Eşik: {overfitting.threshold})
              </div>
            </div>
            <div className={`text-3xl font-bold ${overfitting.detected ? 'text-red-400' : 'text-green-400'}`}>
              {(overfitting.ratio * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      )}

      {/* Train Metrics */}
      {train && (
        <div>
          <h4 className="text-sm opacity-70 mb-2">📚 Train Metrikleri</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <Card title="Sharpe">
              <span className={train.sharpe > 1.5 ? 'text-green-400' : train.sharpe > 1.0 ? 'text-yellow-400' : 'text-red-400'}>
                {train.sharpe.toFixed(2)}
              </span>
            </Card>
            <Card title="Win Rate">
              {(train.winRate * 100).toFixed(1)}%
            </Card>
            <Card title="Max DD">
              <span className="text-red-400">{train.ddMax.toFixed(1)}%</span>
            </Card>
            <Card title="PnL">
              <span className={train.pnl > 0 ? 'text-green-400' : 'text-red-400'}>
                ${train.pnl.toFixed(0)}
              </span>
            </Card>
            <Card title="Trades">
              {train.trades}
            </Card>
          </div>
        </div>
      )}

      {/* Test Metrics */}
      {test && (
        <div>
          <h4 className="text-sm opacity-70 mb-2">🧪 Test Metrikleri (Out-of-Sample)</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <Card title="Sharpe" highlight={true}>
              <span className={test.sharpe > 1.5 ? 'text-green-400' : test.sharpe > 1.0 ? 'text-yellow-400' : 'text-red-400'}>
                {test.sharpe.toFixed(2)}
              </span>
            </Card>
            <Card title="Win Rate" highlight={true}>
              {(test.winRate * 100).toFixed(1)}%
            </Card>
            <Card title="Max DD" highlight={true}>
              <span className="text-red-400">{test.ddMax.toFixed(1)}%</span>
            </Card>
            <Card title="PnL" highlight={true}>
              <span className={test.pnl > 0 ? 'text-green-400' : 'text-red-400'}>
                ${test.pnl.toFixed(0)}
              </span>
            </Card>
            <Card title="Trades" highlight={true}>
              {test.trades}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

