'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  routeName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class RouteErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error(`🚨 [ROUTE-ERROR-BOUNDARY] Error in ${this.props.routeName || 'route'}:`, error);
    console.error('🚨 [ROUTE-ERROR-BOUNDARY] Error info:', errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center mb-4">
                <AlertTriangle className="w-16 h-16 text-destructive" />
              </div>
              <CardTitle className="text-destructive text-2xl">
                {this.props.routeName ? `${this.props.routeName} Error` : 'Page Error'}
              </CardTitle>
              <CardDescription className="text-lg">
                Something went wrong while loading this page
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {this.state.error && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <h4 className="font-medium text-destructive mb-2">Error Details:</h4>
                  <p className="text-sm text-destructive/80 font-mono break-all">
                    {this.state.error.message}
                  </p>
                </div>
              )}
              
              <div className="text-sm text-muted-foreground space-y-2">
                <p><strong>This could be caused by:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Component initialization failure</li>
                  <li>Missing dependencies or imports</li>
                  <li>Client-side JavaScript errors</li>
                  <li>Network connectivity issues</li>
                </ul>
              </div>

              <div className="flex justify-center gap-4">
                <Button onClick={this.handleRetry} className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Retry Page
                </Button>
                <Button onClick={this.handleGoHome} variant="outline" className="flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  Go Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default RouteErrorBoundary;