import React, { useState } from 'react';
import { SimulationParams } from '../types';

interface InputPanelProps {
  onParamsChange: (params: SimulationParams) => void;
}

const DEFAULT_PARAMS: SimulationParams = {
  exchange: 'OKX',
  symbol: 'BTC-USDT',
  orderType: 'market',
  quantity: 100,
  volatility: 0.5,
  feeTier: 'VIP0'
};

const InputPanel: React.FC<InputPanelProps> = ({ onParamsChange }) => {
  const [params, setParams] = useState<SimulationParams>(DEFAULT_PARAMS);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    const updatedParams = {
      ...params,
      [name]: name === 'quantity' || name === 'volatility' 
        ? parseFloat(value) 
        : value
    };
    
    setParams(updatedParams);
    onParamsChange(updatedParams);
  };
  
  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold text-white mb-6">Input Parameters</h2>
      
      <div className="space-y-4">
        <div className="flex flex-col">
          <label className="text-gray-300 mb-1">Exchange</label>
          <select 
            name="exchange"
            value={params.exchange}
            onChange={handleInputChange}
            className="bg-gray-700 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="OKX">OKX</option>
          </select>
        </div>
        
        <div className="flex flex-col">
          <label className="text-gray-300 mb-1">Symbol</label>
          <select 
            name="symbol"
            value={params.symbol}
            onChange={handleInputChange}
            className="bg-gray-700 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="BTC-USDT">BTC-USDT</option>
            <option value="ETH-USDT">ETH-USDT</option>
            <option value="SOL-USDT">SOL-USDT</option>
          </select>
        </div>
        
        <div className="flex flex-col">
          <label className="text-gray-300 mb-1">Order Type</label>
          <select 
            name="orderType"
            value={params.orderType}
            onChange={handleInputChange}
            className="bg-gray-700 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="market">Market</option>
            <option value="limit">Limit</option>
          </select>
        </div>
        
        <div className="flex flex-col">
          <label className="text-gray-300 mb-1">Quantity (USD)</label>
          <input 
            type="number"
            name="quantity"
            value={params.quantity}
            onChange={handleInputChange}
            min="1"
            max="10000"
            className="bg-gray-700 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="flex flex-col">
          <label className="text-gray-300 mb-1">Volatility</label>
          <div className="flex items-center gap-4">
            <input 
              type="range"
              name="volatility"
              value={params.volatility}
              onChange={handleInputChange}
              min="0.1"
              max="5"
              step="0.1"
              className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-white font-mono w-12 text-right">{params.volatility.toFixed(1)}</span>
          </div>
        </div>
        
        <div className="flex flex-col">
          <label className="text-gray-300 mb-1">Fee Tier</label>
          <select 
            name="feeTier"
            value={params.feeTier}
            onChange={handleInputChange}
            className="bg-gray-700 text-white rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="VIP0">VIP0</option>
            <option value="VIP1">VIP1</option>
            <option value="VIP2">VIP2</option>
            <option value="VIP3">VIP3</option>
            <option value="VIP4">VIP4</option>
            <option value="VIP5">VIP5</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default InputPanel;