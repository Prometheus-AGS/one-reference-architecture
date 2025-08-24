'use client';

import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Database, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface DatabaseStatusProps {
  className?: string;
}

export default function DatabaseStatusIndicator({ className = '' }: DatabaseStatusProps) {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error' | 'disconnected'>('connecting');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkDatabaseStatus = async () => {
      try {
        setStatus('connecting');
        setError(null);

        // Verify polyfills first
        const { verifyPolyfills } = await import('@/lib/polyfill-init');
        const polyfillsReady = verifyPolyfills();
        
        if (!polyfillsReady) {
          throw new Error('WASM polyfills not available');
        }

        // Try to get database instance
        const { database } = await import('@/lib/database');
        
        // Initialize if not already done
        if (!database.isReady) {
          await database.initializeSimple();
        }

        if (database.isReady) {
          // Test with a simple query
          await database.query('SELECT 1 as test');
          setStatus('connected');
        } else {
          throw new Error('Database not ready after initialization');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown database error';
        setError(errorMessage);
        setStatus('error');
        console.error('🔴 [DB-STATUS] Database status check failed:', err);
      }
    };

    // Only run in browser environment
    if (typeof window !== 'undefined') {
      checkDatabaseStatus();
    }
  }, []);

  const getStatusConfig = () => {
    switch (status) {
      case 'connecting':
        return {
          icon: <Loader2 className="w-3 h-3 animate-spin" />,
          text: 'Connecting...',
          variant: 'secondary' as const,
          className: 'bg-blue-50 text-blue-700 border-blue-200'
        };
      case 'connected':
        return {
          icon: <CheckCircle className="w-3 h-3" />,
          text: 'PGLite Connected',
          variant: 'secondary' as const,
          className: 'bg-green-50 text-green-700 border-green-200'
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-3 h-3" />,
          text: 'Database Error',
          variant: 'destructive' as const,
          className: 'bg-red-50 text-red-700 border-red-200'
        };
      case 'disconnected':
        return {
          icon: <Database className="w-3 h-3" />,
          text: 'Disconnected',
          variant: 'outline' as const,
          className: 'bg-gray-50 text-gray-700 border-gray-200'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Badge 
      variant={config.variant} 
      className={`flex items-center gap-1 ${config.className} ${className}`}
      title={error || undefined}
    >
      {config.icon}
      {config.text}
    </Badge>
  );
}