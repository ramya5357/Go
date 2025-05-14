import { OrderbookData, ProcessedOrderbook, OrderLevel } from '../types';

/**
 * Processes raw orderbook data from WebSocket
 */
export const processOrderbookData = (data: OrderbookData): ProcessedOrderbook => {
  // Convert string values to numbers for easier calculations
  const asks: OrderLevel[] = data.asks.map(([price, size]) => ({
    price: parseFloat(price),
    size: parseFloat(size)
  })).sort((a, b) => a.price - b.price);

  const bids: OrderLevel[] = data.bids.map(([price, size]) => ({
    price: parseFloat(price),
    size: parseFloat(size)
  })).sort((a, b) => b.price - a.price); // Sort descending for bids

  // Calculate spread and mid price
  const bestAsk = asks[0]?.price || 0;
  const bestBid = bids[0]?.price || 0;
  const spread = bestAsk - bestBid;
  const midPrice = (bestAsk + bestBid) / 2;

  return {
    timestamp: data.timestamp,
    exchange: data.exchange,
    symbol: data.symbol,
    asks,
    bids,
    spread,
    midPrice
  };
};

/**
 * Calculates the volume-weighted average price for a given quantity
 */
export const calculateVWAP = (levels: OrderLevel[], quantity: number): number => {
  let remainingQuantity = quantity;
  let totalCost = 0;

  for (const level of levels) {
    const fillQuantity = Math.min(remainingQuantity, level.size);
    totalCost += fillQuantity * level.price;
    remainingQuantity -= fillQuantity;

    if (remainingQuantity <= 0) break;
  }

  return totalCost / (quantity - remainingQuantity);
};

/**
 * Estimates slippage for a market order
 */
export const estimateSlippage = (
  orderbook: ProcessedOrderbook,
  quantity: number,
  side: 'buy' | 'sell'
): number => {
  const levels = side === 'buy' ? orderbook.asks : orderbook.bids;
  const vwap = calculateVWAP(levels, quantity);
  const midPrice = orderbook.midPrice;
  
  // Slippage as percentage
  return side === 'buy'
    ? ((vwap - midPrice) / midPrice) * 100
    : ((midPrice - vwap) / midPrice) * 100;
};

/**
 * Calculates orderbook depth at various price levels
 */
export const calculateOrderbookDepth = (orderbook: ProcessedOrderbook, levels = 10): {
  asks: { price: number; cumulative: number }[];
  bids: { price: number; cumulative: number }[];
} => {
  const asks = [];
  const bids = [];
  
  let cumulativeAsk = 0;
  for (let i = 0; i < Math.min(levels, orderbook.asks.length); i++) {
    cumulativeAsk += orderbook.asks[i].size;
    asks.push({
      price: orderbook.asks[i].price,
      cumulative: cumulativeAsk
    });
  }
  
  let cumulativeBid = 0;
  for (let i = 0; i < Math.min(levels, orderbook.bids.length); i++) {
    cumulativeBid += orderbook.bids[i].size;
    bids.push({
      price: orderbook.bids[i].price,
      cumulative: cumulativeBid
    });
  }
  
  return { asks, bids };
};