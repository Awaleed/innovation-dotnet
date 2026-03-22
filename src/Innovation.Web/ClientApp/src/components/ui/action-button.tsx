import React, { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePage } from '@inertiajs/react';

interface ActionButtonProps extends Omit<React.ComponentProps<typeof Button>, 'disabled'> {
  permission: string;
  children: ReactNode;
  fallbackText?: string;
  requireAll?: boolean;
  disabled?: boolean;
}

export function ActionButton({
  permission,
  children,
  fallbackText = 'Access Denied',
  requireAll = false,
  disabled = false,
  className,
  ...props
}: ActionButtonProps) {
  const { auth } = usePage<{ auth: { permissions: string[] } }>().props;
  const user = auth;

  const hasPermission = user && (requireAll
    ? permission.split('|').every(p => user.permissions?.includes(p))
    : permission.split('|').some(p => user.permissions?.includes(p)));

  const isDisabled = disabled || !hasPermission;

  return (
    <Button
      {...props}
      disabled={isDisabled}
      className={cn(
        !hasPermission && 'opacity-50 cursor-not-allowed',
        className
      )}
      title={!hasPermission ? fallbackText : undefined}
    >
      {children}
    </Button>
  );
}
