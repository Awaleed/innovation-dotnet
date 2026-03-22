import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import { home } from '@/routes';
import { router } from '@inertiajs/react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error?: Error;
    errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        this.setState({
            error,
            errorInfo,
        });

        // Log error to console in development
        if (process.env.NODE_ENV === 'development') {
            console.error('ErrorBoundary caught an error:', error, errorInfo);
        }

        // Call custom error handler if provided
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }

        // Log error to external service in production
        if (process.env.NODE_ENV === 'production') {
            // You can integrate with error reporting services here
            // Example: Sentry, LogRocket, etc.
            console.error('ErrorBoundary caught an error:', error, errorInfo);
        }
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    };

    handleGoHome = () => {
        router.visit(home.url());
    };

    handleGoBack = () => {
        window.history.back();
    };

    override render() {
        if (this.state.hasError) {
            // Custom fallback UI
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default error UI
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                    <Card className="w-full max-w-md">
                        <CardHeader className="text-center">
                            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                                <AlertTriangle className="h-6 w-6 text-red-600" />
                            </div>
                            <CardTitle className="text-xl font-semibold text-gray-900">
                                Something went wrong
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                    An unexpected error occurred. Please try again or contact support if the problem persists.
                                </AlertDescription>
                            </Alert>

                            {process.env.NODE_ENV === 'development' && this.state.error && (
                                <div className="space-y-2">
                                    <details className="text-sm">
                                        <summary className="cursor-pointer font-medium text-gray-700">
                                            Error Details (Development)
                                        </summary>
                                        <div className="mt-2 rounded bg-gray-100 p-3 text-xs font-mono text-gray-800">
                                            <div className="mb-2">
                                                <strong>Error:</strong> {this.state.error.message}
                                            </div>
                                            {this.state.error.stack && (
                                                <div>
                                                    <strong>Stack:</strong>
                                                    <pre className="mt-1 whitespace-pre-wrap">
                                                        {this.state.error.stack}
                                                    </pre>
                                                </div>
                                            )}
                                            {this.state.errorInfo && (
                                                <div className="mt-2">
                                                    <strong>Component Stack:</strong>
                                                    <pre className="mt-1 whitespace-pre-wrap">
                                                        {this.state.errorInfo.componentStack}
                                                    </pre>
                                                </div>
                                            )}
                                        </div>
                                    </details>
                                </div>
                            )}

                            <div className="flex flex-col space-y-2">
                                <Button onClick={this.handleRetry} className="w-full">
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Try Again
                                </Button>
                                <Button variant="outline" onClick={this.handleGoBack} className="w-full">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Go Back
                                </Button>
                                <Button variant="outline" onClick={this.handleGoHome} className="w-full">
                                    <Home className="mr-2 h-4 w-4" />
                                    Go Home
                                </Button>
                            </div>

                            <div className="text-center text-sm text-gray-500">
                                <p>
                                    If this problem continues, please contact support with the error details.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}

// Hook for functional components to catch errors
export function useErrorHandler() {
    const handleError = (error: Error, errorInfo?: ErrorInfo) => {
        // Log error to console in development
        if (process.env.NODE_ENV === 'development') {
            console.error('useErrorHandler caught an error:', error, errorInfo);
        }

        // Log error to external service in production
        if (process.env.NODE_ENV === 'production') {
            // You can integrate with error reporting services here
            console.error('useErrorHandler caught an error:', error, errorInfo);
        }
    };

    return { handleError };
}

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
    Component: React.ComponentType<P>,
    errorBoundaryProps?: Omit<Props, 'children'>
) {
    const WrappedComponent = (props: P) => (
        <ErrorBoundary {...errorBoundaryProps}>
            <Component {...props} />
        </ErrorBoundary>
    );

    WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

    return WrappedComponent;
}
