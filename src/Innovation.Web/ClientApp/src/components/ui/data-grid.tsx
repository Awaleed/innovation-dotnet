import { ReactNode } from 'react';
import { useDirection } from "@radix-ui/react-direction";
import { Loader2 } from "lucide-react";
import { PaginationBar } from '@/components/ui/pagination';
import { useTranslation } from 'react-i18next';

export interface GridColumn<T> {
    key: string;
    label: string;
    render?: (value: unknown, item: T, index: number) => ReactNode;
}

export interface DataGridProps<T> {
    data: T[];
    onItemClick?: (item: T, index: number) => void;
    renderItem?: (item: T, index: number) => ReactNode;
    columns?: GridColumn<T>[];
    actions?: (item: T, index: number) => ReactNode;
    emptyState?: ReactNode;
    gridCols?: {
        default?: number;
        sm?: number;
        md?: number;
        lg?: number;
        xl?: number;
        '2xl'?: number;
    };
    // Server pagination props
    pageCount?: number;
    currentPage?: number;
    onPageChange?: (page: number) => void;
    pageSize?: number;
    onPageSizeChange?: (size: number) => void;
    isLoading?: boolean;
    onPaginationChange?: ({page, size}: {page: number, size: number}) => void;
    totalItems?: number,

}

export function DataGrid<T extends { id: number | string }>({
    data = [],
    onItemClick,
    renderItem,
    columns = [],
    actions,
    emptyState,
    gridCols = { default: 1, sm: 2, md: 3, lg: 4 },
    pageCount = 1,
    currentPage = 1,
    onPageChange,
    pageSize = 10,
    onPageSizeChange,
    isLoading = false,
    onPaginationChange,
    totalItems,
}: DataGridProps<T>) {
    const direction = useDirection();
    const { t } = useTranslation('ui/data-grid');

    const getNestedValue = (obj: Record<string, unknown>, path: string): unknown => {
        return path.split('.').reduce((current: Record<string, unknown> | undefined, key) => current?.[key] as Record<string, unknown>, obj);
    };

    const getGridColsClass = () => {
        const classes = ['grid'];
        if (gridCols.default) classes.push(`grid-cols-${gridCols.default}`);
        if (gridCols.sm) classes.push(`sm:grid-cols-${gridCols.sm}`);
        if (gridCols.md) classes.push(`md:grid-cols-${gridCols.md}`);
        if (gridCols.lg) classes.push(`lg:grid-cols-${gridCols.lg}`);
        if (gridCols.xl) classes.push(`xl:grid-cols-${gridCols.xl}`);
        if (gridCols['2xl']) classes.push(`2xl:grid-cols-${gridCols['2xl']}`);
        return classes.join(' ');
    };

    const renderDefaultItem = (item: T, index: number) => (
        <div className="rounded-lg border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="space-y-3">
                {columns.slice(0, 4).map((column) => {
                    const value = getNestedValue(item, column.key);
                    return (
                        <div key={column.key} className="flex justify-between text-sm">
                            <span className="font-medium text-muted-foreground">{column.label}:</span>
                            <span className="text-foreground">
                                {column.render ? column.render(value, item, index) : String(value ?? '')}
                            </span>
                        </div>
                    );
                })}
                {actions && (
                    <div className="border-t pt-4" onClick={(e) => e.stopPropagation()}>
                        {actions(item, index)}
                    </div>
                )}
            </div>
        </div>
    );

    const renderEmptyState = () => (
        <div className="col-span-full py-12 text-center">
            {emptyState || (
                <div>
                    <div className="mx-auto h-12 w-12 text-muted-foreground/50">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                    </div>
                    <h3 className="mt-2 text-sm font-medium">{t('no_data', 'لا توجد بيانات')}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{t('no_items', 'لا توجد عناصر لعرضها في الوقت الحالي.')}</p>
                </div>
            )}
        </div>
    );

    const renderLoadingState = () => (
        <div className="col-span-full py-12 text-center">
            <div className="flex gap-2 justify-center items-center">
                <Loader2 className="w-4 h-4 animate-spin sm:h-6 sm:w-6" />
                <span className="text-sm sm:text-base">{t('loading', 'جاري التحميل...')}</span>
            </div>
        </div>
    );

    return (
        <div className="space-y-4 w-full" dir={direction}>
            <div className={`${getGridColsClass()} gap-6`}>
                {isLoading ? (
                    renderLoadingState()
                ) : data.length === 0 ? (
                    renderEmptyState()
                ) : (
                    data.map((item, index) => (
                        <div
                            key={item.id}
                            className={onItemClick ? 'cursor-pointer' : ''}
                            onClick={() => onItemClick?.(item, index)}
                        >
                            {renderItem ? renderItem(item, index) : renderDefaultItem(item, index)}
                        </div>
                    ))
                )}
            </div>

            <PaginationBar
                page={currentPage}
                totalPages={pageCount}
                pageSize={pageSize}
                isLoading={isLoading}
                totalItems={totalItems}
                onPageChange={(page) => {onPageChange?.(page); onPaginationChange?.({page, size: pageSize});}}
                onPageSizeChange={(size) => {onPageSizeChange?.(size); onPaginationChange?.({page: currentPage, size});}}
            />
        </div>
    );
}