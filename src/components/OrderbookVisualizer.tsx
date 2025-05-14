import React, { useMemo } from 'react';
import { ProcessedOrderbook } from '../types';

interface OrderbookVisualizerProps {
  orderbook: ProcessedOrderbook | null;
}

const OrderbookVisualizer: React.FC<OrderbookVisualizerProps> = ({ orderbook }) => {
  // Calculate max cumulative volumes for visualization scaling
  const { maxBid, maxAsk, levels } = useMemo(() => {
    if (!orderbook) return { maxBid: 0, maxAsk: 0, levels: [] };
    
    const visibleLevels = 10; // Number of levels to display
    const askLevels = orderbook.asks.slice(0, visibleLevels);
    const bidLevels = orderbook.bids.slice(0, visibleLevels);
    
    // Calculate cumulative volumes
    let askCumulative = 0;
    const asks = askLevels.map(level => {
      askCumulative += level.size;
      return { ...level, cumulative: askCumulative };
    });
    
    let bidCumulative = 0;
    const bids = bidLevels.map(level => {
      bidCumulative += level.size;
      return { ...level, cumulative: bidCumulative };
    });
    
    const maxAsk = asks.length > 0 ? asks[asks.length - 1].cumulative : 0;
    const maxBid = bids.length > 0 ? bids[bids.length - 1].cumulative : 0;
    
    return { 
      maxBid, 
      maxAsk, 
      levels: { asks, bids }
    };
    
  }, [orderbook]);
  
  if (!orderbook) {
    return (
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 h-72 flex items-center justify-center">
        <div className="text-gray-400">Waiting for orderbook data...</div>
      </div>
    );
  }
  
  // Normalize values for visualization
  const normalizeValue = (value: number, max: number) => {
    return Math.min(value / max * 100, 100);
  };
  
  // Format prices with appropriate precision
  const formatPrice = (price: number) => {
    return price.toFixed(2);
  };
  
  // Format size with appropriate precision
  const formatSize = (size: number) => {
    return size.toFixed(4);
  };
  
  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold text-white mb-4">Order Book</h2>
      
      <div className="grid grid-cols-2 gap-2">
        <div className="font-mono text-xs text-gray-400 grid grid-cols-3 gap-2">
          <div>Size</div>
          <div className="text-center">Cumulative</div>
          <div className="text-right">Bid Price</div>
        </div>
        
        <div className="font-mono text-xs text-gray-400 grid grid-cols-3 gap-2">
          <div>Ask Price</div>
          <div className="text-center">Cumulative</div>
          <div className="text-right">Size</div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 mt-2">
        {/* Bids */}
        <div>
          {levels.bids?.map((level, index) => (
            <div key={`bid-${index}`} className="grid grid-cols-3 gap-2 py-1">
              <div className="font-mono text-xs text-gray-200">{formatSize(level.size)}</div>
              <div className="relative h-5">
                <div 
                  className="absolute top-0 right-0 h-full bg-green-900 opacity-30"
                  style={{ width: `${normalizeValue(level.cumulative, maxBid)}%` }}
                ></div>
                <div className="absolute top-0 right-0 h-full w-full flex items-center justify-center">
                  <span className="font-mono text-xs text-gray-200">
                    {formatSize(level.cumulative)}
                  </span>
                </div>
              </div>
              <div className="text-right font-mono text-xs text-green-400">{formatPrice(level.price)}</div>
            </div>
          ))}
        </div>
        
        {/* Asks */}
        <div>
          {levels.asks?.map((level, index) => (
            <div key={`ask-${index}`} className="grid grid-cols-3 gap-2 py-1">
              <div className="font-mono text-xs text-red-400">{formatPrice(level.price)}</div>
              <div className="relative h-5">
                <div 
                  className="absolute top-0 left-0 h-full bg-red-900 opacity-30"
                  style={{ width: `${normalizeValue(level.cumulative, maxAsk)}%` }}
                ></div>
                <div className="absolute top-0 left-0 h-full w-full flex items-center justify-center">
                  <span className="font-mono text-xs text-gray-200">
                    {formatSize(level.cumulative)}
                  </span>
                </div>
              </div>
              <div className="text-right font-mono text-xs text-gray-200">{formatSize(level.size)}</div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-4 text-sm text-gray-400">
        <div className="text-center">
          Mid Price: <span className="text-white font-mono">${orderbook.midPrice.toFixed(2)}</span> | 
          Spread: <span className="text-white font-mono">${orderbook.spread.toFixed(2)} ({(orderbook.spread/orderbook.midPrice*100).toFixed(4)}%)</span>
        </div>
      </div>
    </div>
  );
};

export default OrderbookVisualizer;