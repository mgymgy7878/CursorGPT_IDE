import { NextRequest, NextResponse } from "next/server";
import { verifyToken, readCookie } from "../../../../../lib/auth-server";
import { hasPermission } from "../../../../../lib/rbac";

export async function GET(request: NextRequest) {
  try {
    // Auth kontrolü
    const token = readCookie(request);
    if (!token) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    
    // Export permission kontrolü
    if (!hasPermission(payload.role.toLowerCase(), "read")) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const executionId = searchParams.get('executionId');

    // Mock trade data
    const mockTrades = [
      {
        id: 'trade_1',
        symbol: 'BTCUSDT',
        side: 'BUY',
        qty: 0.00012,
        price: 45000,
        fee: 0.000001,
        feeAsset: 'BTC',
        maker: false,
        ts: new Date().toISOString(),
        executionId: executionId || 'exec_1'
      },
      {
        id: 'trade_2',
        symbol: 'BTCUSDT',
        side: 'SELL',
        qty: 0.00008,
        price: 45100,
        fee: 0.000001,
        feeAsset: 'BTC',
        maker: true,
        ts: new Date(Date.now() - 60000).toISOString(),
        executionId: executionId || 'exec_1'
      }
    ];

    // Generate CSV
    const csvHeaders = ['id', 'symbol', 'side', 'qty', 'price', 'fee', 'feeAsset', 'maker', 'ts', 'executionId'];
    const csvRows = mockTrades.map(trade => 
      csvHeaders.map(header => {
        const value = trade[header as keyof typeof trade];
        // Escape quotes and wrap in quotes if contains comma
        const escaped = String(value).replace(/"/g, '""');
        return escaped.includes(',') ? `"${escaped}"` : escaped;
      }).join(',')
    );

    const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');
    const csvBuffer = Buffer.from(csvContent, 'utf-8');

    // Set headers for file download
    const headers = {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="trades_${executionId || 'all'}_${new Date().toISOString().split('T')[0]}.csv"`,
      'Content-Length': csvBuffer.length.toString()
    };

    return new NextResponse(csvBuffer, { headers });

  } catch (error) {
    console.error("CSV export error:", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
} 