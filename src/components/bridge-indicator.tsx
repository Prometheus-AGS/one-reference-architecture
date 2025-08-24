'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

type BridgeStatus = 'connecting' | 'ready' | 'error';

interface BridgeIndicatorProps {
  onBridgeReady?: () => void;
}

export const BridgeIndicator: React.FC<BridgeIndicatorProps> = ({ onBridgeReady }) => {
  const [status, setStatus] = useState<BridgeStatus>('connecting');
  const [message, setMessage] = useState('Initializing bridge...');

  useEffect(() => {
    // Simulate bridge initialization process
    const initializeBridge = async () => {
      try {
        setStatus('connecting');
        setMessage('Connecting to container bridge...');
        
        // Simulate connection delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simulate bridge ready
        setStatus('ready');
        setMessage('Bridge ready - Container connected');
        
        // Notify parent component that bridge is ready
        if (onBridgeReady) {
          onBridgeReady();
        }
        
        // Send bridge ready message
        console.log("Bridge hook: afterMount -> notifyReady");
        if (typeof window !== 'undefined' && window.parent) {
          window.parent.postMessage({
            type: 'BRIDGE_READY',
            payload: { 
              artifactId: 'one-demo-artifact', 
              version: '3.0.0',
              timestamp: new Date().toISOString()
            }
          }, '*');
        }
        
      } catch (error) {
        setStatus('error');
        setMessage('Bridge connection failed');
        console.error('Bridge initialization error:', error);
      }
    };

    initializeBridge();
  }, [onBridgeReady]);

  const getStatusIcon = () => {
    switch (status) {
      case 'connecting':
        return <Loader2 size={16} className="animate-spin text-blue-500" />;
      case 'ready':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'error':
        return <AlertCircle size={16} className="text-red-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'connecting':
        return 'bg-primary/10 text-primary';
      case 'ready':
        return 'bg-primary/20 text-primary';
      case 'error':
        return 'bg-destructive/10 text-destructive';
    }
  };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
      {getStatusIcon()}
      <span>{message}</span>
    </div>
  );
};

export default BridgeIndicator;
