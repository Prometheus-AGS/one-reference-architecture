'use client'

import ApplicationContainer from '@/components/application-container';
import DatabasePageClient from '@/components/database-page-client';
import RouteErrorBoundary from '@/components/route-error-boundary';

// Mock data for database page
const mockData = {
  title: "PGLite Database Demo",
  description: "Client-side PostgreSQL database with WASM",
  features: [
    "Client-side PostgreSQL database",
    "WASM-based execution",
    "Real-time queries",
    "IndexedDB persistence",
    "Vector search capabilities"
  ],
  examples: {
    users: [
      { id: 1, name: "John Doe", email: "john@example.com", role: "admin" },
      { id: 2, name: "Jane Smith", email: "jane@example.com", role: "user" }
    ],
    products: [
      { id: 1, name: "Widget A", price: 29.99, category: "Tools" },
      { id: 2, name: "Widget B", price: 49.99, category: "Gadgets" }
    ],
    orders: [
      { id: 1, user_id: 1, product_id: 1, quantity: 2, total: 59.98 },
      { id: 2, user_id: 2, product_id: 2, quantity: 1, total: 49.99 }
    ]
  },
  database_info: {
    engine: "PGLite",
    version: "0.3.7",
    size: "Client-side",
    persistence: "IndexedDB",
    extensions: ["vector", "uuid", "btree_gist"]
  },
  performance: {
    startup_time: "~100ms",
    query_time: "<1ms",
    memory_usage: "~10MB",
    concurrent_connections: "Single-threaded"
  },
  timestamp: new Date().toISOString(),
  source: "Client-side mock data"
};

export default function DatabasePage() {
  return (
    <RouteErrorBoundary routeName="Database Page">
      <ApplicationContainer>
        <DatabasePageClient data={mockData} />
      </ApplicationContainer>
    </RouteErrorBoundary>
  )
}