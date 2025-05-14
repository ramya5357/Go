import React from 'react';
import { SimulationResults, ProcessedOrderbook } from '../types';

interface OutputPanelProps {
  results: SimulationResults;
  orderbook: ProcessedOrderbook | null;
  latency: number;
  messageRate: number;
  connected: boolean;
}

const OutputPanel: React.FC<OutputPanelProps> = ({ 
  results, 
  orderbook,
  latency,
  messageRate,
  connected
}) => {
  // Format numbers with specific precision
  const formatNumber = (value: number, precision = 2, suffix = '') => {
    return value.toFixed(precision) + suffix;
  };
  
  // Determine status color
  const getStatusColor = (connected: boolean) => {
    return connected ? 'text-green-400' : 'text-red-400';
  };
  
  // Format currency values
  const formatCurrency = (value: number) => {
    return `$${value.toFixed(2)}`;
  };
  
  // Format percentage values
  const formatPercent = (value: number) => {
    return `${value.toFixed(4)}%`;
  };
  
  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Simulation Results</h2>
        <div className={`flex items-center ${getStatusColor(connected)}`}>
          <div className={`w-3 h-3 rounded-full mr-2 ${connected ? 'bg-green-400' : 'bg-red-400'}`}></div>
          <span>{connected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>
      
      {orderbook ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-gray-400 text-sm">Exchange</div>
              <div className="text-white font-semibold">{orderbook.exchange}</div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-gray-400 text-sm">Symbol</div>
              <div className="text-white font-semibold">{orderbook.symbol}</div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-gray-400 text-sm">Mid Price</div>
              <div className="text-white font-mono text-lg">
                {formatCurrency(orderbook.midPrice)}
              </div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-gray-400 text-sm">Spread</div>
              <div className="text-white font-mono">
                {formatCurrency(orderbook.spread)} ({(orderbook.spread/orderbook.midPrice*100).toFixed(4)}%)
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-white font-semibold text-lg">Cost Analysis</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-700">
                <span className="text-gray-300">Expected Slippage</span>
                <span className="text-white font-mono">{formatPercent(results.expectedSlippage)}</span>
              </div>
              
              <div className="flex items-center justify-between py-2 border-b border-gray-700">
                <span className="text-gray-300">Expected Fees</span>
                <span className="text-white font-mono">{formatCurrency(results.expectedFees)}</span>
              </div>
              
              <div className="flex items-center justify-between py-2 border-b border-gray-700">
                <span className="text-gray-300">Market Impact</span>
                <span className="text-white font-mono">{formatPercent(results.expectedMarketImpact)}</span>
              </div>
              
              <div className="flex items-center justify-between py-2 border-b border-gray-700">
                <span className="text-gray-300">Maker/Taker Proportion</span>
                <span className="text-white font-mono">
                  {(results.makerTakerProportion * 100).toFixed(1)}% / {((1 - results.makerTakerProportion) * 100).toFixed(1)}%
                </span>
              </div>
              
              <div className="flex items-center justify-between py-2 mt-2">
                <span className="text-white font-semibold">Net Cost</span>
                <span className="text-white font-mono text-lg">{formatCurrency(results.netCost)}</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-white font-semibold text-lg">Performance Metrics</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="text-gray-400 text-sm">Messages/Sec</div>
                <div className="text-white font-mono text-lg">{messageRate}</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="text-gray-400 text-sm">Processing Latency</div>
                <div className="text-white font-mono text-lg">{formatNumber(latency, 2, 'ms')}</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="text-gray-400 text-sm">Internal Latency</div>
                <div className="text-white font-mono text-lg">{formatNumber(results.internalLatency, 2, 'ms')}</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">Awaiting data...</div>
        </div>
      )}
    </div>
  );
};

export default OutputPanel;