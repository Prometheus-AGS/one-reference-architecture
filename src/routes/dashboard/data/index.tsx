'use client'

import ApplicationContainer from '@/components/application-container';
import DataPageClient from '@/components/data-page-client';
import RouteErrorBoundary from '@/components/route-error-boundary';

// Mock data for data page
const mockData = {
  message: "Data access demo (client-side)",
  timestamp: new Date().toISOString(),
  source: "Client-side mock data",
  capabilities: {
    file_system: {
      status: "success",
      project_name: "one-reference-app",
      version: "0.0.1",
      description: "ONE Reference App"
    },
    system: {
      os: "Browser Environment",
      arch: "WebAssembly",
      family: "Client-side",
      current_dir: "/client-app"
    },
    environment: {
      node_env: "development",
      rust_env: "client-only",
      is_development: true
    }
  }
};

export default function DataPage() {
  return (
    <RouteErrorBoundary routeName="Data Page">
      <ApplicationContainer>
        <DataPageClient data={mockData} />
      </ApplicationContainer>
    </RouteErrorBoundary>
  )
}