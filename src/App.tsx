import React, { useState } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { useSimulation } from './hooks/useSimulation';
import { SimulationParams } from './types';
import InputPanel from './components/InputPanel';
import OutputPanel from './components/OutputPanel';
import OrderbookVisualizer from './components/OrderbookVisualizer';
import ConnectionStatus from './components/ConnectionStatus';

const WEBSOCKET_URL = 'wss://ws.gomarket-cpp.goquant.io/ws/l2-orderbook/okx/BTC-USDT-SWAP';

function App() {
  // Initialize simulation parameters
  const [params, setParams] = useState<SimulationParams>({
    exchange: 'OKX',
    symbol: 'BTC-USDT',
    orderType: 'market',
    quantity: 100,
    volatility: 0.5,
    feeTier: 'VIP0'
  });
  
  // Initialize WebSocket connection
  const { 
    status, 
    orderbook, 
    latency, 
    messageRate, 
    connect, 
    disconnect 
  } = useWebSocket(WEBSOCKET_URL);
  
  // Run simulation with current orderbook and parameters
  const results = useSimulation(orderbook, params, latency);
  
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto py-8 px-4">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-center">Crypto Trade Simulator</h1>
          <p className="text-gray-400 text-center mt-2">
            High-performance market impact and cost analysis in real-time
          </p>
        </header>
        
        <ConnectionStatus 
          status={status} 
          onConnect={connect} 
          onDisconnect={disconnect}
        />
        
        <main className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div className="space-y-6">
            <InputPanel onParamsChange={setParams} />
            
            <OrderbookVisualizer orderbook={orderbook} />
          </div>
          
          <div>
            <OutputPanel 
              results={results}
              orderbook={orderbook}
              latency={latency}
              messageRate={messageRate}
              connected={status.connected}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;