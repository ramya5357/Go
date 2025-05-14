export interface OrderbookData {
  timestamp: string;
  exchange: string;
  symbol: string;
  asks: [string, string][];
  bids: [string, string][];
}

export interface OrderLevel {
  price: number;
  size: number;
}

export interface ProcessedOrderbook {
  timestamp: string;
  exchange: string;
  symbol: string;
  asks: OrderLevel[];
  bids: OrderLevel[];
  spread: number;
  midPrice: number;
}

export interface SimulationParams {
  exchange: string;
  symbol: string;
  orderType: 'market' | 'limit';
  quantity: number;
  volatility: number;
  feeTier: string;
}

export interface SimulationResults {
  expectedSlippage: number;
  expectedFees: number;
  expectedMarketImpact: number;
  netCost: number;
  makerTakerProportion: number;
  internalLatency: number;
}

export interface WebSocketStatus {
  connected: boolean;
  lastMessage: number;
  error: string | null;
}