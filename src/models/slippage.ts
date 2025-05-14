import { ProcessedOrderbook } from '../types';
import { calculateVWAP } from '../utils/orderbook';

/**
 * Estimates expected slippage using linear regression model based on:
 * - Order quantity relative to market depth
 * - Volatility
 * - Current spread
 */
export const calculateExpectedSlippage = (
  orderbook: ProcessedOrderbook,
  quantity: number,
  volatility: number,
  side: 'buy' | 'sell'
): number => {
  const levels = side === 'buy' ? orderbook.asks : orderbook.bids;
  
  // Calculate market depth metrics
  const marketDepth = levels.reduce((sum, level) => sum + level.size, 0);
  const relativeOrderSize = quantity / marketDepth;
  
  // Calculate VWAP price
  const vwap = calculateVWAP(levels, quantity);
  
  // Calculate expected slippage based on linear model
  // coefficients would be derived from historical data regression
  const beta0 = 0.0001; // Base slippage
  const beta1 = 0.5; // Coefficient for relative order size
  const beta2 = 0.3; // Coefficient for volatility
  const beta3 = 0.2; // Coefficient for spread as percentage
  
  const spreadPercentage = orderbook.spread / orderbook.midPrice * 100;
  
  // Linear model: beta0 + beta1*X1 + beta2*X2 + beta3*X3
  const slippageEstimate = beta0 + 
    beta1 * relativeOrderSize + 
    beta2 * volatility + 
    beta3 * spreadPercentage;
  
  return slippageEstimate;
};

/**
 * Alternative slippage calculation using quantile regression for conservative estimates
 */
export const calculateQuantileSlippage = (
  orderbook: ProcessedOrderbook,
  quantity: number,
  volatility: number,
  side: 'buy' | 'sell',
  quantile = 0.95 // 95th percentile for conservative estimate
): number => {
  // Base slippage from linear model
  const baseSlippage = calculateExpectedSlippage(orderbook, quantity, volatility, side);
  
  // Adjust for quantile (higher quantiles lead to higher slippage estimates)
  // This is a simplified approach; actual quantile regression would use historical data
  const quantileFactor = Math.exp(quantile * 2 - 1); // maps 0.5->1, 0.95->2.72, etc.
  
  return baseSlippage * quantileFactor;
};