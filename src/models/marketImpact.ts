import { ProcessedOrderbook } from '../types';

/**
 * Implements the Almgren-Chriss market impact model
 * 
 * The Almgren-Chriss model estimates market impact as:
 * I = σ * sign(X) * sqrt(τ/V) * |X| + γ * X
 * 
 * Where:
 * - σ is market volatility
 * - X is order size
 * - τ is time horizon
 * - V is market volume
 * - γ is a permanent impact factor
 */
export const calculateMarketImpact = (
  orderbook: ProcessedOrderbook,
  quantity: number,
  volatility: number,
  side: 'buy' | 'sell'
): number => {
  // Calculate market depth as an approximation of volume
  const totalVolume = calculateMarketDepth(orderbook);
  
  // Parameters for the model
  const signX = side === 'buy' ? 1 : -1;
  const timeHorizon = 1; // Assume immediate execution for market orders
  const permanentImpactFactor = 0.1; // This would be calibrated with historical data
  
  // Calculate temporary and permanent impact components
  const temporaryImpact = volatility * signX * Math.sqrt(timeHorizon / totalVolume) * Math.abs(quantity);
  const permanentImpact = permanentImpactFactor * quantity;
  
  // Total market impact as percentage of price
  const totalImpact = (temporaryImpact + permanentImpact) / orderbook.midPrice * 100;
  
  return totalImpact;
};

/**
 * Calculate market depth from the orderbook
 */
const calculateMarketDepth = (orderbook: ProcessedOrderbook): number => {
  // Sum the total size across all levels as a proxy for market depth
  const askVolume = orderbook.asks.reduce((sum, level) => sum + level.size, 0);
  const bidVolume = orderbook.bids.reduce((sum, level) => sum + level.size, 0);
  
  return askVolume + bidVolume;
};

/**
 * Calculate the optimal execution strategy using Almgren-Chriss model
 * This is a simplified implementation
 */
export const calculateOptimalExecution = (
  orderbook: ProcessedOrderbook,
  quantity: number,
  volatility: number,
  riskAversion = 1
): { executionSchedule: { time: number; quantity: number }[] } => {
  // Number of intervals for execution
  const intervals = 5;
  const totalTime = 1;
  
  // Calculate parameters
  const marketDepth = calculateMarketDepth(orderbook);
  const sigma = volatility * orderbook.midPrice;
  const eta = 0.1; // Temporary impact coefficient
  const gamma = 0.05; // Permanent impact coefficient
  
  // Calculate optimal trajectory (simplified)
  const tau = Math.sqrt((sigma * sigma * riskAversion) / (eta * marketDepth));
  const executionSchedule = [];
  
  for (let i = 0; i <= intervals; i++) {
    const time = i * (totalTime / intervals);
    const remainingTime = totalTime - time;
    const quantityAtTime = quantity * (Math.sinh(remainingTime / tau) / Math.sinh(totalTime / tau));
    
    executionSchedule.push({
      time,
      quantity: i === 0 ? 0 : quantity - quantityAtTime
    });
  }
  
  return { executionSchedule };
};