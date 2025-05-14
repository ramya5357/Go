import { useState, useEffect, useCallback, useRef } from 'react';
import { OrderbookData, WebSocketStatus, ProcessedOrderbook } from '../types';
import { processOrderbookData } from '../utils/orderbook';

export const useWebSocket = (url: string) => {
  const [status, setStatus] = useState<WebSocketStatus>({
    connected: false,
    lastMessage: 0,
    error: null
  });
  
  const [orderbook, setOrderbook] = useState<ProcessedOrderbook | null>(null);
  const [latency, setLatency] = useState<number>(0);
  const socketRef = useRef<WebSocket | null>(null);
  const receiveTimeRef = useRef<number>(0);
  const reconnectAttempts = useRef<number>(0);
  const reconnectTimeoutRef = useRef<number | null>(null);
  
  // Counter for measuring message rate
  const [messageRate, setMessageRate] = useState<number>(0);
  const messageCountRef = useRef<number>(0);
  
  // Calculate exponential backoff delay
  const getBackoffDelay = () => {
    const baseDelay = 1000; // Start with 1 second
    const maxDelay = 30000; // Max delay of 30 seconds
    const delay = Math.min(baseDelay * Math.pow(2, reconnectAttempts.current), maxDelay);
    return delay;
  };

  // Clear any pending reconnection timeout
  const clearReconnectTimeout = () => {
    if (reconnectTimeoutRef.current !== null) {
      window.clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  };

  // Validate WebSocket URL
  const isValidWebSocketUrl = (urlString: string): boolean => {
    try {
      const wsUrl = new URL(urlString);
      return wsUrl.protocol === 'ws:' || wsUrl.protocol === 'wss:';
    } catch {
      return false;
    }
  };

  // Get a user-friendly error message based on the error type
  const getErrorMessage = (error: any): string => {
    // Check internet connectivity first
    if (!navigator.onLine) {
      return 'No internet connection. Please check your network connection.';
    }

    // Check if URL is valid
    if (!isValidWebSocketUrl(url)) {
      return `Invalid WebSocket URL: ${url}. URL must start with ws:// or wss://.`;
    }

    // Handle WebSocket specific errors
    if (error instanceof Event && error.target instanceof WebSocket) {
      const wsError = error.target;
      
      // Check for specific error conditions in the error event
      if ('error' in error && error.error instanceof Error) {
        const specificError = error.error;
        if (specificError.message.includes('ETIMEDOUT') || specificError.message.includes('connection timed out')) {
          return 'Connection timed out. The server is not responding.';
        }
        if (specificError.message.includes('ECONNREFUSED')) {
          return 'Connection refused. The server might be down or blocking connections.';
        }
        if (specificError.message.includes('CERT_')) {
          return 'SSL/TLS certificate error. There might be an issue with the server\'s security certificate.';
        }
      }

      // Handle different WebSocket states
      switch (wsError.readyState) {
        case WebSocket.CONNECTING:
          return `Attempting to establish connection to ${new URL(url).hostname}...`;
        case WebSocket.CLOSING:
          return 'Connection is closing. Will attempt to reconnect...';
        case WebSocket.CLOSED:
          if (reconnectAttempts.current === 0) {
            return 'Initial connection attempt failed. Retrying...';
          }
          // Check if the server is unreachable
          if (url.includes('gomarket-cpp.goquant.io')) {
            return `Unable to connect to the trading server (${new URL(url).hostname}). The service might be temporarily unavailable. Please try again later or contact support if the issue persists.`;
          }
          return `Connection lost. Retry attempt ${reconnectAttempts.current}...`;
        default:
          break;
      }

      // Check for SSL/TLS errors
      if (url.startsWith('wss://')) {
        const errorString = error.toString().toLowerCase();
        if (
          errorString.includes('ssl') || 
          errorString.includes('certificate') || 
          errorString.includes('tls')
        ) {
          return 'Secure connection failed. There might be an issue with the server\'s security certificate.';
        }
      }

      // Check for specific network errors
      const errorString = error.toString().toLowerCase();
      if (errorString.includes('timeout')) {
        return 'Connection timed out. Please check your internet connection and try again.';
      }
      if (errorString.includes('refused')) {
        return 'Connection refused. The server might be down or not accepting connections.';
      }
    }

    // Provide a detailed generic error message
    const baseMessage = 'Unable to establish WebSocket connection';
    const retryInfo = reconnectAttempts.current > 0 
      ? `Retry attempt ${reconnectAttempts.current}...` 
      : 'Attempting to connect...';
    const serverInfo = `Server: ${new URL(url).hostname}`;
    
    return `${baseMessage}. ${serverInfo}. ${retryInfo}`;
  };
  
  // Initialize WebSocket connection
  const connect = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) return;
    
    try {
      // Validate URL before attempting connection
      if (!isValidWebSocketUrl(url)) {
        throw new Error(`Invalid WebSocket URL: ${url}`);
      }

      // Clear any existing socket
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }

      const socket = new WebSocket(url);
      socketRef.current = socket;
      
      socket.onopen = () => {
        reconnectAttempts.current = 0; // Reset attempts on successful connection
        setStatus({
          connected: true,
          lastMessage: Date.now(),
          error: null
        });
        console.log('WebSocket connection established');
      };
      
      socket.onmessage = (event) => {
        const receiveTime = performance.now();
        receiveTimeRef.current = receiveTime;
        
        try {
          const data = JSON.parse(event.data) as OrderbookData;
          
          // Process orderbook data
          const processedOrderbook = processOrderbookData(data);
          setOrderbook(processedOrderbook);
          
          // Update message stats
          messageCountRef.current++;
          
          // Update connection status
          setStatus(prev => ({
            ...prev,
            lastMessage: Date.now(),
            connected: true,
            error: null
          }));
          
          // Calculate processing latency
          const processingTime = performance.now() - receiveTime;
          setLatency(processingTime);
          
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
          setStatus(prev => ({
            ...prev,
            error: 'Error processing data from server. The data format might be invalid.'
          }));
        }
      };
      
      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        const errorMessage = getErrorMessage(error);
        setStatus(prev => ({
          ...prev,
          connected: false,
          error: errorMessage
        }));
      };
      
      socket.onclose = (event) => {
        const wasConnected = socketRef.current?.readyState === WebSocket.OPEN;
        let closeReason = 'Connection closed unexpectedly';

        // Provide more specific close reasons based on the close code
        switch (event.code) {
          case 1000:
            closeReason = 'Normal closure';
            break;
          case 1001:
            closeReason = 'Server going down or browser navigating away';
            break;
          case 1002:
            closeReason = 'Protocol error';
            break;
          case 1003:
            closeReason = 'Invalid data received';
            break;
          case 1005:
            closeReason = 'Connection closed without status code';
            break;
          case 1006:
            closeReason = 'Connection lost unexpectedly';
            break;
          case 1007:
            closeReason = 'Invalid message format';
            break;
          case 1008:
            closeReason = 'Policy violation';
            break;
          case 1009:
            closeReason = 'Message too large';
            break;
          case 1011:
            closeReason = 'Server error';
            break;
          case 1015:
            closeReason = 'TLS handshake failure';
            break;
          default:
            closeReason = `Connection closed (Code: ${event.code})`;
        }
        
        if (event.reason) {
          closeReason += `: ${event.reason}`;
        }
        
        console.log(`WebSocket closed. ${closeReason}`);
        
        setStatus(prev => ({
          ...prev,
          connected: false,
          error: wasConnected ? `${closeReason}. Attempting to reconnect...` : prev.error
        }));

        // Attempt to reconnect with exponential backoff
        clearReconnectTimeout();
        const delay = getBackoffDelay();
        reconnectAttempts.current++;
        
        reconnectTimeoutRef.current = window.setTimeout(() => {
          if (socketRef.current?.readyState !== WebSocket.OPEN) {
            connect();
          }
        }, delay);
      };
      
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create WebSocket connection';
      setStatus({
        connected: false,
        lastMessage: Date.now(),
        error: `${errorMessage}. Retrying...`
      });

      // Attempt to reconnect on connection error
      clearReconnectTimeout();
      const delay = getBackoffDelay();
      reconnectAttempts.current++;
      
      reconnectTimeoutRef.current = window.setTimeout(() => {
        connect();
      }, delay);
    }
  }, [url]);
  
  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    clearReconnectTimeout();
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    reconnectAttempts.current = 0;
  }, []);
  
  // Reconnect logic
  useEffect(() => {
    // Auto-reconnect if connection is lost
    const checkConnection = () => {
      if (status.connected && Date.now() - status.lastMessage > 10000) {
        // If no message for 10 seconds, reconnect
        console.log('No messages received for 10 seconds, attempting reconnection');
        disconnect();
        connect();
      }
    };
    
    const interval = setInterval(checkConnection, 5000);
    
    return () => {
      clearInterval(interval);
      disconnect();
    };
  }, [connect, disconnect, status]);
  
  // Measure message rate
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageRate(messageCountRef.current);
      messageCountRef.current = 0;
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Initial connection
  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);
  
  return {
    status,
    orderbook,
    latency,
    messageRate,
    connect,
    disconnect
  };
};