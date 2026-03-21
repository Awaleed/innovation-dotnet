import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from "@tanstack/react-table";
import { useDirection } from "@radix-ui/react-direction";
import { useTranslation } from 'react-i18next';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { PaginationBar } from '@/components/ui/pagination';

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    onRowClick?: (row: TData) => void;
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

export function DataTable<TData, TValue>({
    columns,
    data = [], // Provide default empty array
    onRowClick,
    pageCount = 1,
    currentPage = 1,
    onPageChange,
    pageSize = 10,
    onPageSizeChange,
    isLoading = false,
    onPaginationChange,
    totalItems ,
}: DataTableProps<TData, TValue>) {
    const direction = useDirection();
    const { t } = useTranslation('ui/data-table');

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        manualPagination: true,
        pageCount,
    });

    return (
        <div className="space-y-4 w-full" dir={direction}>
            <div
                className="overflow-hidden rounded-md border bg-card border-border/50"
            >
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => {
                                        return (
                                            <TableHead key={header.id} className="whitespace-nowrap font-heading">
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                            </TableHead>
                                        );
                                    })}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="h-24 text-center font-sans">
                                        <div className="flex gap-2 justify-center items-center">
                                            <Loader2 className="w-4 h-4 animate-spin sm:h-6 sm:w-6" />
                                            <span className="text-sm sm:text-base">{t('loading', 'جاري التحميل...')}</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row) => (
                                    <TableRow
                                        key={row.id}
                                        data-state={row.getIsSelected() && "selected"}
                                        className={onRowClick ? "cursor-pointer hover:bg-primary/5" : ""}
                                        onClick={() => onRowClick?.(row.original)}
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id} className="whitespace-nowrap font-sans">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="h-24 text-center font-sans">
                                        <span className="text-sm sm:text-base text-muted-foreground">{t('no_results', 'لا توجد نتائج.')}</span>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
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
