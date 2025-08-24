'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

export class DatabaseErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('🚨 [DATABASE-ERROR-BOUNDARY] Caught error:', error);
    console.error('🚨 [DATABASE-ERROR-BOUNDARY] Error info:', errorInfo);
    
    this.setState({
      hasError: true,
      error,
      errorInfo
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <AlertTriangle className="w-12 h-12 text-destructive" />
            </div>
            <CardTitle className="text-destructive">Database Error</CardTitle>
            <CardDescription>
              An error occurred while initializing or using the database
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {this.state.error && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <h4 className="font-medium text-destructive mb-2">Error Details:</h4>
                <p className="text-sm text-destructive/80 font-mono">
                  {this.state.error.message}
                </p>
              </div>
            )}
            
            <div className="text-sm text-muted-foreground space-y-2">
              <p><strong>Possible causes:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>WASM polyfills not properly initialized</li>
                <li>PGLite failed to load or initialize</li>
                <li>Browser compatibility issues</li>
                <li>IndexedDB access denied or unavailable</li>
              </ul>
            </div>

            <div className="flex justify-center">
              <Button onClick={this.handleRetry} className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Retry Database Connection
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default DatabaseErrorBoundary;