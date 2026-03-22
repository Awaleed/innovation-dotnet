import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ErrorAlertProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
  variant?: 'default' | 'destructive';
}

export function ErrorAlert({
  title = 'Error',
  message,
  onRetry,
  className,
  variant = 'destructive',
}: ErrorAlertProps) {
  return (
    <Alert variant={variant} className={cn('border-red-200 bg-red-50', className)}>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-red-800">{title}</h4>
          <p className="text-sm text-red-700 mt-1">{message}</p>
        </div>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="ms-4 border-red-300 text-red-700 hover:bg-red-100"
          >
            <RefreshCw className="h-4 w-4 me-2" />
            Retry
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
