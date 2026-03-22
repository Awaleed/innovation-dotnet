import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';

export interface TableOfContentsItem {
  title: string;
  pageNumber: string | number;
  href?: string;
  onClick?: () => void;
}

export interface TableOfContentsProps {
  title?: string;
  items: TableOfContentsItem[];
  className?: string;
  titleClassName?: string;
  itemClassName?: string;
}

export function TableOfContents({
  title = 'Table of Contents',
  items,
  className,
  titleClassName,
  itemClassName,
}: TableOfContentsProps) {
  return (
    <div className={cn('flex flex-col gap-6', className)}>
      {/* Title */}
      {title && (
        <>
          <h1
            className={cn(
              'text-center text-3xl font-bold font-heading text-[#0c2341] dark:text-white',
              titleClassName,
            )}
          >
            {title}
          </h1>
          {/* Separator Line */}
          <div className="h-px w-full bg-[#0c2341]/20 dark:bg-white/20" />
        </>
      )}

      {/* Content Entries */}
      <div className="flex flex-col gap-4">
        {items.map((item, index) => {
          const content = (
            <div
              className={cn(
                'flex items-center w-full group',
                item.href || item.onClick
                  ? 'cursor-pointer hover:opacity-80 transition-opacity'
                  : '',
                itemClassName,
              )}
            >
              {/* Entry Label */}
              <span className="text-base font-body text-[#0c2341] dark:text-white shrink-0">
                {item.title}
              </span>

              {/* Dotted Leader */}
              <div className="flex-1 flex items-center min-w-0 ms-2 me-2 h-0">
                <div
                  className="flex-1 border-t border-dotted border-[#0c2341]/30 dark:border-white/30"
                  style={{
                    borderWidth: '1px 0 0 0',
                    borderSpacing: '2px',
                  }}
                />
              </div>

              {/* Page Number */}
              <span className="text-base font-body text-[#0c2341] dark:text-white shrink-0 tabular-nums">
                {item.pageNumber}
              </span>
            </div>
          );

          if (item.href) {
            return (
              <Link key={index} href={item.href} className="block">
                {content}
              </Link>
            );
          }

          if (item.onClick) {
            return (
              <button key={index} onClick={item.onClick} className="block w-full text-start">
                {content}
              </button>
            );
          }

          return <div key={index}>{content}</div>;
        })}
      </div>
    </div>
  );
}
