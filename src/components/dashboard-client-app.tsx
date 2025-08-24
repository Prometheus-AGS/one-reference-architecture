'use client'

import ONEPlatformArchitectureDiagram from '@/components/architecture-diagram';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppNavigation } from '@/hooks/use-navigation';
import { NavigationItem } from '@/stores/navigation';
import { Activity, ArrowRight, CheckCircle, Database, HardDrive, Home, Layers, Network, Server, Shield, Zap } from 'lucide-react';

// Icon mapping for navigation items
const iconMap = {
  Database,
  Server,
  HardDrive,
  Network,
  Activity,
  Home
};

interface HomeData {
  message: string;
  timestamp: string;
  source: string;
  architecture: {
    components: string[];
    features: string[];
    status: string;
  };
}

interface DashboardClientAppProps {
  data: HomeData | null;
}

export default function DashboardClientApp({ data }: DashboardClientAppProps) {
  const { items, navigateTo } = useAppNavigation();

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-foreground mb-2">Loading...</h2>
          <p className="text-muted-foreground">Initializing architecture demo</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            {data.architecture.status}
          </div>
          
          <h1 className="text-4xl font-bold text-foreground sm:text-5xl">
            ONE
            <span className="block text-primary">Integration Architecture</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            A complete full-stack solution combining Tuono's React SSR framework with Tauri's desktop capabilities,
            featuring embedded PostgreSQL database, file-based routing with Rust handlers, and transparent proxy systems.
          </p>
        </div>

        {/* Architecture Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center mb-2">
                <Layers className="w-5 h-5 text-primary-foreground" />
              </div>
              <CardTitle className="text-lg">Web & Desktop</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Single code base for both web and desktop
              </p>
            </CardContent>
          </Card>

          <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
            <CardHeader className="pb-3">
              <div className="w-10 h-10 bg-emerald-600 dark:bg-emerald-500 rounded-lg flex items-center justify-center mb-2">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <CardTitle className="text-lg">Real-time Data</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Direct access to databases, file system, environment variables, and native APIs
              </p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20">
            <CardHeader className="pb-3">
              <div className="w-10 h-10 bg-purple-600 dark:bg-purple-500 rounded-lg flex items-center justify-center mb-2">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <CardTitle className="text-lg">Type Safety</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Full TypeScript support with Rust backend integration and compile-time safety
              </p>
            </CardContent>
          </Card>

          <Card className="border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20">
            <CardHeader className="pb-3">
              <div className="w-10 h-10 bg-orange-600 dark:bg-orange-500 rounded-lg flex items-center justify-center mb-2">
                <ArrowRight className="w-5 h-5 text-white" />
              </div>
              <CardTitle className="text-lg">Hot Reload</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Development-time reloading of .rs files with instant feedback in both environments
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Cards */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground mb-2">Explore the Architecture</h2>
            <p className="text-muted-foreground">
              Interactive system overview showing the complete ONE platform architecture
            </p>
          </div>

          {/* Interactive Architecture Diagram */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="h-96 w-full">
                <ONEPlatformArchitectureDiagram />
              </div>
            </CardContent>
          </Card>

          <div className="text-center">
            <h3 className="text-2xl font-bold text-foreground mb-2">Component Navigation</h3>
            <p className="text-muted-foreground">
              Click on any component below to see it in action and understand how the integration works
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item: NavigationItem) => {
              const IconComponent = iconMap[item.icon as keyof typeof iconMap] || CheckCircle;
              
              return (
                <Card
                  key={item.id}
                  className={`cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${
                    item.isActive ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-accent'
                  }`}
                  onClick={() => navigateTo(item)}
                >
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        item.isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{item.title}</CardTitle>
                        {item.isActive && (
                          <Badge className="mt-1 bg-primary/10 text-primary">
                            Currently Active
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm mb-4">
                      {item.description}
                    </CardDescription>
                    <Button
                      variant={item.isActive ? "default" : "outline"}
                      size="sm"
                      className="w-full"
                    >
                      {item.isActive ? 'Currently Viewing' : 'Explore Component'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Technical Details */}
        <Card className="bg-gradient-to-r from-muted/30 to-primary/5 border-border">
          <CardHeader>
            <CardTitle className="text-2xl text-foreground">Technical Architecture</CardTitle>
            <CardDescription>
              Built with modern technologies and best practices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {data.architecture.components.map((component, index) => (
                <div key={index} className="text-center p-3 bg-card rounded-lg border border-border">
                  <div className="font-medium text-card-foreground">{component}</div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 flex flex-wrap gap-2">
              {data.architecture.features.map((feature, index) => (
                <Badge key={index} variant="secondary" className="bg-primary/10 text-primary">
                  {feature}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Metadata */}
        <div className="text-center text-sm text-muted-foreground pt-4 border-t border-border">
          <p>Data generated at: {new Date(data.timestamp).toLocaleString()}</p>
          <p>Source: {data.source}</p>
        </div>
    </div>
  );
}