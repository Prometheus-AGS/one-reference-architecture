import ApplicationContainer from '@/components/application-container';
import ONEPlatformArchitectureDiagram from '@/components/architecture-diagram';
import RouteErrorBoundary from '@/components/route-error-boundary';

export default function DashboardPage(): React.JSX.Element {
  return (
    <RouteErrorBoundary routeName="Dashboard">
      <ApplicationContainer>
        <div className="flex flex-col items-center justify-center w-full h-full p-4 space-y-4">
          {/* Hero content */}
          <div className="text-center p-6 rounded-xl bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-700 shadow-sm">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
              ONE Platform Architecture
            </h1>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Explore the powerful, cross-platform architecture of ONE, built with a shared Rust core, adaptive runtimes for web and desktop, and a secure, sandboxed environment for AI-driven code execution.
            </p>
          </div>

          {/* Card wrapper for the diagram */}
          <div className="flex-grow w-full h-full rounded-xl bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-700 shadow-sm p-4">
            <ONEPlatformArchitectureDiagram />
          </div>
        </div>
      </ApplicationContainer>
    </RouteErrorBoundary>
  );
}
