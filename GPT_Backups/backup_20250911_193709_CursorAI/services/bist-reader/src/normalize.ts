// BIST Data Normalization
export const normalizeBISTData = (bistData: any) => {
  // TODO: Normalize BIST data to @spark/marketdata types
  // Handle timezone differences (IEX/BIST to UTC)
  return {
    symbol: bistData.symbol,
    price: parseFloat(bistData.price),
    volume: parseFloat(bistData.volume),
    timestamp: new Date().toISOString(),
    exchange: "BIST"
  };
};

export const convertToUTC = (bistTimestamp: string) => {
  // TODO: Convert BIST timezone to UTC
  return new Date(bistTimestamp).toISOString();
}; 