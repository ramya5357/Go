/**
 * Calculates expected fees based on the exchange fee structure
 */
export const calculateFees = (
  exchange: string,
  feeTier: string,
  quantity: number,
  price: number,
  makerTakerRatio = 0.5
): number => {
  // OKX fee structure (simplified)
  const feeRates: Record<string, { maker: number; taker: number }> = {
    OKX: {
      VIP0: { maker: 0.0008, taker: 0.001 },
      VIP1: { maker: 0.0007, taker: 0.0009 },
      VIP2: { maker: 0.0006, taker: 0.0008 },
      VIP3: { maker: 0.0005, taker: 0.0007 },
      VIP4: { maker: 0.0004, taker: 0.0006 },
      VIP5: { maker: 0.0003, taker: 0.0005 },
    }
  };

  // Get fee rates for the exchange and tier
  const rates = feeRates[exchange]?.[feeTier] || { maker: 0.001, taker: 0.002 };
  
  // Calculate total fee based on maker/taker proportion
  const makerFee = rates.maker * quantity * price * makerTakerRatio;
  const takerFee = rates.taker * quantity * price * (1 - makerTakerRatio);
  
  return makerFee + takerFee;
};

/**
 * Estimates maker/taker ratio based on market conditions
 * This is a simplified logistic regression model
 */
export const estimateMakerTakerRatio = (
  volatility: number,
  orderType: 'market' | 'limit'
): number => {
  if (orderType === 'market') {
    // Market orders are almost always taker orders
    return 0.1;
  }
  
  // Simple logistic function that returns lower maker proportion as volatility increases
  return 1 / (1 + Math.exp(volatility - 5));
};