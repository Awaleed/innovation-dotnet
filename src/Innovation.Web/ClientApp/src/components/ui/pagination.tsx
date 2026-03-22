import * as React from 'react';
import { ChevronLeftIcon, ChevronRightIcon, MoreHorizontalIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useRTL } from '@/components/rtl-provider';

function Pagination({ className, ...props }: React.ComponentProps<'nav'>) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn('flex justify-center mx-auto w-full', className)}
      {...props}
    />
  );
}

function PaginationContent({ className, ...props }: React.ComponentProps<'ul'>) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn('flex flex-row gap-1 items-center', className)}
      {...props}
    />
  );
}

function PaginationItem({ ...props }: React.ComponentProps<'li'>) {
  return <li data-slot="pagination-item" {...props} />;
}

type PaginationLinkProps = {
  isActive?: boolean;
} & Pick<React.ComponentProps<typeof Button>, 'size'> &
  React.ComponentProps<'a'>;

function PaginationLink({ className, isActive, size = 'icon', ...props }: PaginationLinkProps) {
  return (
    <a
      aria-current={isActive ? 'page' : undefined}
      data-slot="pagination-link"
      data-active={isActive}
      className={cn(
        buttonVariants({
          variant: isActive ? 'outline' : 'ghost',
          size,
        }),
        className,
      )}
      {...props}
    />
  );
}

function PaginationPrevious({ className, ...props }: React.ComponentProps<typeof PaginationLink>) {
  const { t } = useTranslation('ui/pagination');
  return (
    <PaginationLink
      aria-label={t('go_to_previous_page', 'Go to previous page')}
      size="default"
      className={cn('gap-1 px-2.5 sm:ps-2.5', className)}
      {...props}
    >
      <ChevronLeftIcon />
      <span className="hidden sm:block">{t('previous', 'Previous')}</span>
    </PaginationLink>
  );
}

function PaginationNext({ className, ...props }: React.ComponentProps<typeof PaginationLink>) {
  const { t } = useTranslation('ui/pagination');
  return (
    <PaginationLink
      aria-label={t('go_to_next_page', 'Go to next page')}
      size="default"
      className={cn('gap-1 px-2.5 sm:pe-2.5', className)}
      {...props}
    >
      <span className="hidden sm:block">{t('next', 'Next')}</span>
      <ChevronRightIcon />
    </PaginationLink>
  );
}

function PaginationEllipsis({ className, ...props }: React.ComponentProps<'span'>) {
  const { t } = useTranslation('ui/pagination');
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn('flex justify-center items-center size-9', className)}
      {...props}
    >
      <MoreHorizontalIcon className="size-4" />
      <span className="sr-only">{t('more_pages', 'More pages')}</span>
    </span>
  );
}

function getPageRange(current: number, total: number, siblingCount = 1) {
  const DOTS = '...';
  const totalPageNumbers = siblingCount * 2 + 5;
  if (totalPageNumbers >= total) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const leftSibling = Math.max(current - siblingCount, 1);
  const rightSibling = Math.min(current + siblingCount, total);
  const showLeftDots = leftSibling > 2;
  const showRightDots = rightSibling < total - 1;
  const range = (start: number, end: number) =>
    Array.from({ length: end - start + 1 }, (_, i) => i + start);
  if (!showLeftDots && showRightDots) {
    return [...range(1, 3 + 2 * siblingCount), DOTS, total];
  }
  if (showLeftDots && !showRightDots) {
    return [1, DOTS, ...range(total - (2 + 2 * siblingCount), total)];
  }
  if (showLeftDots && showRightDots) {
    return [1, DOTS, ...range(leftSibling, rightSibling), DOTS, total];
  }
  return range(1, total);
}

interface PaginationBarProps {
  page: number;
  totalPages: number;
  pageSize: number;
  pageSizes?: number[];
  isLoading?: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  totalLabel?: string; // Optional, for custom total label
  totalItems?: number; // Total number of items for "Showing X of Y"
}

export function PaginationBar({
  page,
  totalPages,
  pageSize,
  pageSizes = [10, 15, 20, 30, 40, 50],
  isLoading = false,
  onPageChange,
  onPageSizeChange,
  totalLabel,
  totalItems = 0,
}: PaginationBarProps) {
  const { t } = useTranslation('ui/pagination');
  const { isRtl } = useRTL();
  const pageRange = useMemo(() => getPageRange(page, totalPages, 1), [page, totalPages]);

  // Calculate items range
  const startItem = totalItems > 0 ? (page - 1) * pageSize + 1 : 0;
  const endItem = totalItems > 0 ? Math.min(page * pageSize, totalItems) : 0;

  const defaultTotalLabel = totalLabel || t('page_size_label', 'Items per page');

  return (
    <div
      className={cn(
        'relative flex flex-wrap items-center justify-between gap-4 rounded-md border bg-card px-4 py-3 transition-opacity',
        isLoading && 'opacity-60',
      )}
    >
      {/* Left Section: Items Info and Page Size */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Items Count Display */}
        <div className="flex items-center gap-1.5 text-sm">
          <span className="text-muted-foreground">{t('showing_label', 'Showing')}</span>
          <span className="font-semibold text-foreground" dir={isRtl ? 'rtl' : 'ltr'}>
            {startItem.toLocaleString()} - {endItem.toLocaleString()}
          </span>
          <span className="text-muted-foreground">{t('of_label', 'of')}</span>
          <span className="font-semibold text-primary">{totalItems.toLocaleString()}</span>
          <span className="text-muted-foreground">{t('items_label', 'items')}</span>
        </div>

        {/* Divider */}
        <div className="hidden h-5 w-px bg-border sm:block" />

        {/* Page Size Selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{defaultTotalLabel}:</span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange(Number(value))}
            disabled={isLoading}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {pageSizes.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Right Section: Navigation Controls and Page Info */}
      <div className="flex items-center gap-3">
        {/* Page Info */}
        <div className="flex items-center gap-1.5 text-sm">
          <span className="text-muted-foreground">{t('page_label', 'Page')}</span>
          <span className="font-semibold">{page.toLocaleString()}</span>
          <span className="text-muted-foreground">{t('of_label', 'of')}</span>
          <span className="font-semibold">{totalPages.toLocaleString()}</span>
        </div>

        {/* Divider */}
        <div className="h-5 w-px bg-border" />

        {/* Navigation Buttons */}
        <div className="flex items-center gap-1">
          {/* First Page */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onPageChange(1)}
            disabled={page === 1 || isLoading}
            aria-label={t('first_page', 'First page')}
          >
            {isRtl ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          </Button>

          {/* Previous Page */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1 || isLoading}
            aria-label={t('previous_page', 'Previous page')}
          >
            {isRtl ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>

          {/* Page Numbers - Desktop Only */}
          <div className="hidden items-center gap-1 px-1 sm:flex">
            {pageRange.map((p, idx) =>
              p === '...' ? (
                <span
                  key={`dots-${idx}`}
                  className="flex h-8 w-8 items-center justify-center text-muted-foreground"
                >
                  •••
                </span>
              ) : (
                <Button
                  key={`page-${p}`}
                  variant={p === page ? 'secondary' : 'ghost'}
                  size="sm"
                  className={cn(
                    'h-8 w-8 p-0 font-medium relative',
                    isLoading && p === page && 'ring-2 ring-primary ring-offset-1',
                  )}
                  onClick={() => onPageChange(Number(p))}
                  disabled={isLoading}
                  aria-current={p === page ? 'page' : undefined}
                >
                  {p}
                  {isLoading && p === page && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 animate-ping" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                    </span>
                  )}
                </Button>
              ),
            )}
          </div>

          {/* Next Page */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages || isLoading}
            aria-label={t('next_page', 'Next page')}
          >
            {isRtl ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>

          {/* Last Page */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => onPageChange(totalPages)}
            disabled={page === totalPages || isLoading}
            aria-label={t('last_page', 'Last page')}
          >
            {isRtl ? <ChevronsLeft className="h-4 w-4" /> : <ChevronsRight className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
};
