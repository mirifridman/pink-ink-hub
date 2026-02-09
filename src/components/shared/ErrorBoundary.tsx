import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  private handleRefresh = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <Card className="max-w-md w-full border-destructive/50">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="p-3 rounded-full bg-destructive/10 mb-4">
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>
                <h3 className="text-lg font-semibold mb-2">משהו השתבש</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  אירעה שגיאה בטעינת הרכיב. נסה לרענן את הדף או לחזור לדף הבית.
                </p>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={this.handleRetry}>
                    נסה שוב
                  </Button>
                  <Button onClick={this.handleRefresh} className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    רענן דף
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
