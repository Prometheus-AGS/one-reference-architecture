'use client'

interface DataPageProps {
  message: string;
  timestamp: string;
  source: string;
  capabilities: {
    file_system: {
      status: string;
      project_name?: string;
      version?: string;
      description?: string;
      message?: string;
    };
    system: {
      os: string;
      arch: string;
      family: string;
      current_dir: string;
    };
    environment: {
      node_env: string;
      rust_env: string;
      is_development: boolean;
    };
  };
}

interface DataPageClientProps {
  data: DataPageProps | null;
}

export default function DataPageClient({ data }: DataPageClientProps) {
  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Loading...</h2>
          <p className="text-muted-foreground">Fetching data from Rust SSR handler</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
        
      {/* Server Response */}
      <div className="bg-card rounded-lg shadow-md p-6 border">
        <h2 className="text-xl font-semibold text-card-foreground mb-4">
          Server Response
        </h2>
        <div className="space-y-2 text-card-foreground">
          <p><strong>Message:</strong> {data.message}</p>
          <p><strong>Timestamp:</strong> {data.timestamp}</p>
          <p><strong>Source:</strong> {data.source}</p>
        </div>
      </div>

      {/* Data Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* File System Access */}
          <div className="bg-card rounded-lg shadow-md p-6 border">
            <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-4">
              📁 File System Access
            </h3>
            {data.capabilities.file_system.status === 'success' ? (
              <div className="space-y-2 text-sm text-card-foreground">
                <p><strong>Project:</strong> {data.capabilities.file_system.project_name}</p>
                <p><strong>Version:</strong> {data.capabilities.file_system.version}</p>
                <p><strong>Description:</strong> {data.capabilities.file_system.description}</p>
              </div>
            ) : (
              <p className="text-destructive text-sm">
                {data.capabilities.file_system.message}
              </p>
            )}
          </div>

          {/* System Information */}
          <div className="bg-card rounded-lg shadow-md p-6 border">
            <h3 className="text-lg font-semibold text-emerald-600 dark:text-emerald-400 mb-4">
              💻 System Information
            </h3>
            <div className="space-y-2 text-sm text-card-foreground">
              <p><strong>OS:</strong> {data.capabilities.system.os}</p>
              <p><strong>Architecture:</strong> {data.capabilities.system.arch}</p>
              <p><strong>Family:</strong> {data.capabilities.system.family}</p>
              <p><strong>Current Dir:</strong>
                <span className="text-xs block mt-1 text-muted-foreground break-all">
                  {data.capabilities.system.current_dir}
                </span>
              </p>
            </div>
          </div>

          {/* Environment Information */}
          <div className="bg-card rounded-lg shadow-md p-6 border">
            <h3 className="text-lg font-semibold text-purple-600 dark:text-purple-400 mb-4">
              🌍 Environment
            </h3>
            <div className="space-y-2 text-sm text-card-foreground">
              <p><strong>Node ENV:</strong> {data.capabilities.environment.node_env}</p>
              <p><strong>Rust ENV:</strong> {data.capabilities.environment.rust_env}</p>
              <p><strong>Development:</strong>
                <span className={`ml-2 px-2 py-1 rounded text-xs ${
                  data.capabilities.environment.is_development
                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
                    : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200'
                }`}>
                  {data.capabilities.environment.is_development ? 'Yes' : 'No'}
                </span>
              </p>
            </div>
          </div>
      </div>

      {/* What This Demonstrates */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-primary mb-3">
          🚀 What This Demonstrates
        </h3>
        <ul className="list-disc list-inside space-y-2 text-primary/80">
          <li><strong>File System Access:</strong> Reading package.json from the project root</li>
          <li><strong>System Information:</strong> Accessing OS and architecture details</li>
          <li><strong>Environment Variables:</strong> Reading NODE_ENV and custom variables</li>
          <li><strong>Real-time Data:</strong> Server-side timestamp generation</li>
          <li><strong>Error Handling:</strong> Graceful fallbacks for failed operations</li>
        </ul>
      </div>

      {/* Refresh Button */}
      <div className="text-center">
        <button
          onClick={() => window.location.reload()}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 px-4 rounded-lg transition-colors"
        >
          🔄 Refresh Data
        </button>
      </div>
    </div>
  );
}