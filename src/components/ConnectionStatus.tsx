import React from 'react';
import { WebSocketStatus } from '../types';

interface ConnectionStatusProps {
  status: WebSocketStatus;
  onConnect: () => void;
  onDisconnect: () => void;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
  status, 
  onConnect, 
  onDisconnect 
}) => {
  const { connected, lastMessage, error } = status;
  
  // Calculate time since last message
  const getTimeSinceLastMessage = () => {
    if (!lastMessage) return 'Never';
    
    const seconds = Math.floor((Date.now() - lastMessage) / 1000);
    
    if (seconds < 60) return `${seconds} sec ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    return `${Math.floor(seconds / 3600)} hour(s) ago`;
  };
  
  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-4 flex items-center justify-between">
      <div className="flex items-center">
        <div className={`w-3 h-3 rounded-full mr-2 ${connected ? 'bg-green-400' : 'bg-red-400'}`}></div>
        <div>
          <span className={`font-semibold ${connected ? 'text-green-400' : 'text-red-400'}`}>
            {connected ? 'Connected' : 'Disconnected'}
          </span>
          <span className="text-gray-400 text-sm ml-2">
            Last message: {getTimeSinceLastMessage()}
          </span>
          {error && (
            <span className="text-red-400 text-sm ml-2">
              Error: {error}
            </span>
          )}
        </div>
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={onConnect}
          disabled={connected}
          className={`px-3 py-1 rounded text-sm font-medium ${
            connected 
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          Connect
        </button>
        <button
          onClick={onDisconnect}
          disabled={!connected}
          className={`px-3 py-1 rounded text-sm font-medium ${
            !connected 
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
              : 'bg-red-600 text-white hover:bg-red-700'
          }`}
        >
          Disconnect
        </button>
      </div>
    </div>
  );
};

export default ConnectionStatus;