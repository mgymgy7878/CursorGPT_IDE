import React, { useState } from "react";

interface ExchangeSelectorProps {
  selectedExchange: string;
  onExchangeChange: (exchange: string) => void;
  exchanges?: string[];
}

export function ExchangeSelector({ 
  selectedExchange, 
  onExchangeChange, 
  exchanges = ['BINANCE', 'BYBIT', 'OKX'] 
}: ExchangeSelectorProps) {
  return (
    <div className="exchange-selector" style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
        Borsa Seçin:
      </label>
      <select
        value={selectedExchange}
        onChange={(e) => onExchangeChange(e.target.value)}
        style={{
          padding: '8px 12px',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          fontSize: '14px',
          minWidth: '150px'
        }}
      >
        {exchanges.map((exchange) => (
          <option key={exchange} value={exchange}>
            {exchange}
          </option>
        ))}
      </select>
    </div>
  );
} 