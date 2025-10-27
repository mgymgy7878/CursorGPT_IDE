import React, { useState, useEffect } from "react";

interface WebSocketTickerProps {
  symbol: string;
  userRoles: string[];
}

export function WebSocketTicker({ symbol, userRoles }: WebSocketTickerProps) {
  const [price, setPrice] = useState<number | null>(null);
  const [change, setChange] = useState<number | null>(null);
  const [changePercent, setChangePercent] = useState<number | null>(null);
  const [volume, setVolume] = useState<number | null>(null);

  useEffect(() => {
    // Mock data for now - replace with real WebSocket connection
    const interval = setInterval(() => {
      const mockPrice = 50000 + Math.random() * 1000;
      const mockChange = (Math.random() - 0.5) * 100;
      const mockChangePercent = (mockChange / mockPrice) * 100;
      const mockVolume = Math.random() * 1000000;

      setPrice(mockPrice);
      setChange(mockChange);
      setChangePercent(mockChangePercent);
      setVolume(mockVolume);
    }, 1000);

    return () => clearInterval(interval);
  }, [symbol]);

  if (!userRoles.includes('trader') && !userRoles.includes('admin')) {
    return null;
  }

  return (
    <div className="ticker-card" style={{
      padding: '12px',
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      backgroundColor: '#f9f9f9',
      margin: '8px 0'
    }}>
      <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{symbol}</div>
      <div style={{ fontSize: '20px', fontWeight: 'bold', color: change && change > 0 ? '#22c55e' : '#ef4444' }}>
        {price ? `$${price.toFixed(2)}` : 'Loading...'}
      </div>
      {change !== null && (
        <div style={{ color: change > 0 ? '#22c55e' : '#ef4444' }}>
          {change > 0 ? '+' : ''}{change.toFixed(2)} ({changePercent?.toFixed(2)}%)
        </div>
      )}
      {volume && (
        <div style={{ fontSize: '12px', color: '#666' }}>
          Vol: {volume.toLocaleString()}
        </div>
      )}
    </div>
  );
} 