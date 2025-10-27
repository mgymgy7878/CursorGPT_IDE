// Mock fast JSON implementation
export const sendJson = (res: any, data: any) => {
  res.json(data);
};

export const OpenOrdersSchema = {
  validate: (data: any) => data
};

export const PnLSchema = {
  title: "PnL",
  type: "object",
  properties: {
    unrealized: { type: "number" },
    realized: { type: "number" },
    total: { type: "number" }
  }
};

export const SignalSchema = {
  title: "Signal",
  type: "object",
  properties: {
    id: { type: "string" },
    symbol: { type: "string" },
    action: { type: "string" },
    confidence: { type: "number" },
    timestamp: { type: "string" }
  }
}; 