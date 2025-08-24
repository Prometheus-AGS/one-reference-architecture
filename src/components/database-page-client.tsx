'use client'

import ClientOnly from '@/components/client-only';
import DatabaseClient from '@/components/database-client';
import DatabaseErrorBoundary from '@/components/database-error-boundary';

interface DatabaseData {
  title: string;
  description: string;
  features: string[];
  examples: {
    users: Array<{ id: number; name: string; email: string; role: string }>;
    products: Array<{ id: number; name: string; price: number; category: string }>;
    orders: Array<{ id: number; user_id: number; product_id: number; quantity: number; total: number }>;
  };
  database_info: {
    engine: string;
    version: string;
    size: string;
    persistence: string;
    extensions: string[];
  };
  performance: {
    startup_time: string;
    query_time: string;
    memory_usage: string;
    concurrent_connections: string;
  };
  timestamp: string;
  source: string;
}

interface DatabasePageClientProps {
  data: DatabaseData | null;
}

export default function DatabasePageClient({ data }: DatabasePageClientProps) {
  // Handle null data case
  if (!data) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Loading Database Demo...</h1>
          <p className="text-muted-foreground">Please wait while we initialize the database.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
        {/* Database Info Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Database Info */}
          <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
            <h2 className="text-2xl font-bold text-card-foreground mb-4">Database Information</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="font-medium text-muted-foreground">Engine:</span>
                <span className="text-card-foreground">{data.database_info.engine}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-muted-foreground">Version:</span>
                <span className="text-card-foreground">{data.database_info.version}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-muted-foreground">Size:</span>
                <span className="text-card-foreground">{data.database_info.size}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-muted-foreground">Persistence:</span>
                <span className="text-card-foreground">{data.database_info.persistence}</span>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-card-foreground mt-6 mb-3">Extensions</h3>
            <div className="flex flex-wrap gap-2">
              {data.database_info.extensions.map((ext, index) => (
                <span key={index} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                  {ext}
                </span>
              ))}
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
            <h2 className="text-2xl font-bold text-card-foreground mb-4">Performance</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="font-medium text-muted-foreground">Startup Time:</span>
                <span className="text-primary font-medium">{data.performance.startup_time}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-muted-foreground">Query Time:</span>
                <span className="text-primary font-medium">{data.performance.query_time}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-muted-foreground">Memory Usage:</span>
                <span className="text-primary font-medium">{data.performance.memory_usage}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-muted-foreground">Connections:</span>
                <span className="text-card-foreground">{data.performance.concurrent_connections}</span>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-card-foreground mt-6 mb-3">Features</h3>
            <ul className="space-y-2">
              {data.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-card-foreground">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Client-Only Database Interface with Enhanced Error Handling */}
        <ClientOnly
          fallback={
            <div className="bg-card rounded-lg shadow-sm p-6 text-center border border-border">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mx-auto mb-4"></div>
                <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
              </div>
              <p className="text-muted-foreground mt-4">Loading database interface...</p>
              <p className="text-xs text-muted-foreground/70 mt-2">Initializing WASM polyfills and PGLite...</p>
            </div>
          }
        >
          <DatabaseErrorBoundary>
            <DatabaseClient />
          </DatabaseErrorBoundary>
        </ClientOnly>

        {/* Metadata */}
        <div className="text-center text-sm text-muted-foreground pt-4 border-t border-border">
          <p>Data generated at: {new Date(data.timestamp).toLocaleString()}</p>
          <p>Source: {data.source}</p>
        </div>
    </div>
  );
}