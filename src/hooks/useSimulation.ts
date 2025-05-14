import { useState, useEffect } from 'react';
import { ProcessedOrderbook, SimulationParams, SimulationResults } from '../types';
import { calculateExpectedSlippage } from '../models/slippage';
import { calculateFees, estimateMakerTakerRatio } from '../models/fees';
import { calculateMarketImpact } from '../models/marketImpact';

export const useSimulation = (
  orderbook: ProcessedOrderbook | null,
  params: SimulationParams,
  latency: number
) => {
  const [results, setResults] = useState<SimulationResults>({
    expectedSlippage: 0,
    expectedFees: 0,
    expectedMarketImpact: 0,
    netCost: 0,
    makerTakerProportion: 0,
    internalLatency: 0
  });
  
  useEffect(() => {
    if (!orderbook) return;
    
    // Start timing for latency measurement
    const startTime = performance.now();
    
    // Estimate maker/taker proportion
    const makerTakerProportion = estimateMakerTakerRatio(
      params.volatility,
      params.orderType
    );
    
    // Calculate expected slippage
    const slippage = calculateExpectedSlippage(
      orderbook,
      params.quantity,
      params.volatility,
      'buy' // Assuming buy for now
    );
    
    // Calculate expected fees
    const fees = calculateFees(
      params.exchange,
      params.feeTier,
      params.quantity,
      orderbook.midPrice,
      makerTakerProportion
    );
    
    // Calculate market impact
    const marketImpact = calculateMarketImpact(
      orderbook,
      params.quantity,
      params.volatility,
      'buy' // Assuming buy for now
    );
    
    // Calculate net cost
    const netCost = slippage + fees + marketImpact;
    
    // Measure internal latency
    const endTime = performance.now();
    const processingLatency = endTime - startTime;
    
    // Update results
    setResults({
      expectedSlippage: slippage,
      expectedFees: fees,
      expectedMarketImpact: marketImpact,
      netCost,
      makerTakerProportion,
      internalLatency: processingLatency
    });
    
  }, [orderbook, params, latency]);
  
  return results;
};