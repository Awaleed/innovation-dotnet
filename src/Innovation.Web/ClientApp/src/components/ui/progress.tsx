import React from 'react';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
}

export function Progress({ value = 0, className, ...props }: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      className={['relative h-2 w-full overflow-hidden rounded bg-muted', className]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      <div className="h-full bg-primary transition-[width]" style={{ width: `${clamped}%` }} />
    </div>
  );
}

export default Progress;
