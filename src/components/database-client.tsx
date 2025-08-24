'use client';

import { useState, useEffect } from 'react';

export default function DatabaseClient() {
  const [dbManager, setDbManager] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [queryResult, setQueryResult] = useState<any>(null);
  const [currentQuery, setCurrentQuery] = useState('SELECT version();');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize PGLite database (client-side only)
  useEffect(() => {
    const initDatabase = async () => {
      try {
        setIsLoading(true);
        setError(null);

        console.log('🔄 [DB-CLIENT] Starting client-side database initialization...');
        console.log('🔄 [DB-CLIENT] Environment check - window:', typeof window !== 'undefined');

        // Verify polyfills are working before proceeding
        const { verifyPolyfills, polyfillStatus } = await import('@/lib/polyfill-init');
        console.log('🔄 [DB-CLIENT] Polyfill status:', polyfillStatus);
        
        const polyfillsReady = verifyPolyfills();
        if (!polyfillsReady) {
          console.error('🔄 [DB-CLIENT] ❌ CRITICAL: Polyfills not ready!');
          throw new Error('WASM polyfills not available - cannot initialize database');
        } else {
          console.log('🔄 [DB-CLIENT] ✅ Polyfills verified - safe to proceed');
        }

        // Import DatabaseManager (PGLite is excluded from SSR via Vite config)
        console.log('🔄 [DB-CLIENT] Importing DatabaseManager module (polyfills verified)...');
        const { DatabaseManager } = await import('@/lib/database');
        console.log('🔄 [DB-CLIENT] DatabaseManager imported successfully');

        // Use singleton instance to prevent duplicate initialization
        const manager = DatabaseManager.getInstance({
          dataDir: 'idb://tuono-tauri-demo',
          debug: true
        });

        console.log('📦 DatabaseManager created, initializing...');

        // Initialize with simplified schema
        await manager.initializeSimple();
        
        console.log('🔍 Checking if database is ready...');

        // Check if initialization was successful
        if (manager.isReady) {
          setDbManager(manager);
          setIsConnected(true);

          console.log('✅ Database connected successfully!');

          // Run initial query
          try {
            const result = await manager.query('SELECT version();');
            setQueryResult(result);
            console.log('🎯 Initial query successful:', result);
          } catch (queryErr) {
            console.warn('⚠️ Initial query failed, but database is connected:', queryErr);
          }
        } else {
          throw new Error('Database initialization failed - not ready');
        }

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize database';
        setError(errorMessage);
        console.error('❌ Database initialization error:', err);
        setIsConnected(false);
        setDbManager(null);
      } finally {
        setIsLoading(false);
      }
    };

    // Initialize immediately since we're guaranteed to be client-side
    initDatabase();
  }, []);

  const executeQuery = async () => {
    if (!dbManager || !currentQuery.trim()) return;

    try {
      setIsLoading(true);
      setError(null);

      const result = await dbManager.query(currentQuery);
      setQueryResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Query execution failed');
      console.error('Query error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const predefinedQueries = [
    {
      name: 'Database Version',
      query: 'SELECT version();'
    },
    {
      name: 'All Users',
      query: 'SELECT * FROM users ORDER BY created_at DESC;'
    },
    {
      name: 'All Products',
      query: 'SELECT * FROM products ORDER BY price DESC;'
    },
    {
      name: 'User Count',
      query: 'SELECT COUNT(*) as total_users FROM users;'
    },
    {
      name: 'Product Count',
      query: 'SELECT COUNT(*) as total_products FROM products;'
    },
    {
      name: 'Table Information',
      query: `
        SELECT
          table_name,
          column_name,
          data_type,
          is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
        ORDER BY table_name, ordinal_position;
      `
    }
  ];

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <div className={`w-3 h-3 rounded-full ${
          isLoading ? 'bg-primary animate-pulse' :
          isConnected ? 'bg-primary' : 'bg-destructive'
        }`}></div>
        <span className={`font-medium ${
          isLoading ? 'text-muted-foreground' :
          isConnected ? 'text-primary' : 'text-destructive'
        }`}>
          {isLoading ? 'Connecting to Database...' :
           isConnected ? 'Database Connected (Client-Side Only)' : 'Database Disconnected'}
        </span>
      </div>

      {/* Error Display */}
      {error && !isLoading && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <h4 className="text-destructive font-medium mb-2">❌ Database Connection Failed</h4>
          <p className="text-destructive/80 text-sm mb-3">{error}</p>
          <div className="text-xs text-destructive/70">
            <p><strong>This should not happen in client-side only mode.</strong></p>
            <p>Please check the browser console for detailed error information.</p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {isConnected && !isLoading && (
        <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
          <h4 className="text-primary font-medium mb-2">✅ Database Connected Successfully!</h4>
          <p className="text-primary/80 text-sm">PGLite is running in client-side only mode with full functionality.</p>
        </div>
      )}

      {/* Interactive Query Section */}
      <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
        <h2 className="text-2xl font-bold text-card-foreground mb-4">Interactive SQL Console</h2>
        
        {/* Predefined Queries */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-card-foreground mb-2">Quick Queries</h3>
          <div className="flex flex-wrap gap-2">
            {predefinedQueries.map((query, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuery(query.query)}
                className="px-3 py-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded text-sm transition-colors"
              >
                {query.name}
              </button>
            ))}
          </div>
        </div>

        {/* Query Input */}
        <div className="mb-4">
          <textarea
            value={currentQuery}
            onChange={(e) => setCurrentQuery(e.target.value)}
            className="w-full h-32 p-3 border border-border rounded-lg font-mono text-sm resize-none bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
            placeholder="Enter your SQL query here..."
          />
        </div>

        {/* Execute Button */}
        <div className="mb-4">
          <button
            onClick={executeQuery}
            disabled={!isConnected || isLoading || !currentQuery.trim()}
            className="px-6 py-2 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground rounded-lg font-medium transition-colors"
          >
            {isLoading ? 'Executing...' : 'Execute Query'}
          </button>
        </div>

        {/* Query Error Display */}
        {error && isConnected && (
          <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <h4 className="text-destructive font-medium mb-2">Query Error</h4>
            <p className="text-destructive/80 text-sm font-mono">{error}</p>
          </div>
        )}

        {/* Query Results */}
        {queryResult && (
          <div className="border border-border rounded-lg overflow-hidden">
            <div className="bg-muted px-4 py-2 border-b border-border">
              <h4 className="font-medium text-foreground">
                Query Results ({queryResult.rows.length} rows)
              </h4>
            </div>
            <div className="overflow-x-auto">
              {queryResult.rows.length > 0 ? (
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      {queryResult.fields.map((field: any, index: number) => (
                        <th key={index} className="px-4 py-2 text-left text-sm font-medium text-foreground border-b border-border">
                          {field.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {queryResult.rows.map((row: any, rowIndex: number) => (
                      <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-background' : 'bg-muted/50'}>
                        {queryResult.fields.map((field: any, colIndex: number) => (
                          <td key={colIndex} className="px-4 py-2 text-sm text-foreground border-b border-border">
                            {row[field.name] !== null ? String(row[field.name]) : 'NULL'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  No results returned
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}