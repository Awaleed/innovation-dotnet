import type { IChallengeListResponse } from '@/types/generated';
import type { PaginatedResponse } from '@/hooks/use-api-pagination';
import http from '@/lib/api-client';
import { admin } from '@/routes';
import { type SharedData } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Eye, Edit, Trash2, Plus, ChevronLeft, ChevronRight, Star, Search, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Props extends SharedData {
    challenges: PaginatedResponse<IChallengeListResponse> | null;
}

const statusColors: Record<string, string> = {
    Draft: 'bg-gray-100 text-gray-700',
    Upcoming: 'bg-blue-100 text-blue-700',
    Open: 'bg-green-100 text-green-700',
    Closed: 'bg-yellow-100 text-yellow-700',
    Judging: 'bg-purple-100 text-purple-700',
    Voting: 'bg-indigo-100 text-indigo-700',
    Completed: 'bg-emerald-100 text-emerald-800',
    Cancelled: 'bg-red-100 text-red-700',
};

function StatusBadge({ status }: { status: string }) {
    const cls = statusColors[status] ?? 'bg-gray-100 text-gray-700';
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
            {status}
        </span>
    );
}

export default function ChallengesIndex({ challenges }: Props) {
    const { t } = useTranslation();
    const [deleting, setDeleting] = useState<number | null>(null);
    const [searchInput, setSearchInput] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const items = challenges?.items ?? [];
    const page = challenges?.page ?? 1;
    const totalPages = challenges?.totalPages ?? 1;
    const totalCount = challenges?.totalCount ?? 0;

    async function handleDelete(id: number) {
        if (!confirm(t('common:confirm_delete', 'Are you sure you want to delete this?'))) return;
        setDeleting(id);
        try {
            await http.delete(admin.challenges.destroy.url({ id }));
            router.reload();
        } catch {
            alert('Failed to delete challenge.');
        } finally {
            setDeleting(null);
        }
    }

    function goToPage(p: number) {
        const params = new URLSearchParams(window.location.search);
        params.set('page', String(p));
        router.visit(admin.challenges.index.url(), { data: Object.fromEntries(params) });
    }

    function handleSearch() {
        const data: Record<string, string> = { page: '1' };
        const filters: string[] = [];
        if (searchInput) filters.push(`title=*${searchInput}`);
        if (statusFilter) filters.push(`status=${statusFilter}`);
        if (filters.length) data.filter = filters.join(',');
        router.visit(admin.challenges.index.url(), { data });
    }

    function clearFilters() {
        setSearchInput('');
        setStatusFilter('');
        router.visit(admin.challenges.index.url());
    }

    return (
        <>
            <Head title={t('navigation:challenges', 'Challenges')} />

            <div className="min-h-screen bg-gray-50 p-6">
                <div className="mx-auto max-w-7xl">
                    {/* Header */}
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                {t('navigation:challenges', 'Challenges')}
                            </h1>
                            <p className="mt-1 text-sm text-gray-500">
                                {totalCount} {t('common:total', 'total')}
                            </p>
                        </div>
                        <Link
                            href={admin.challenges.create.url()}
                            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                        >
                            <Plus className="h-4 w-4" />
                            {t('common:create', 'New Challenge')}
                        </Link>
                    </div>

                    {/* Filters */}
                    <div className="mb-4 flex items-center gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                placeholder={t('common:search', 'Search...')}
                                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                            <option value="">{t('common:all_statuses', 'All Statuses')}</option>
                            {Object.keys(statusColors).map((s) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                        <button
                            onClick={handleSearch}
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                        >
                            <Search className="h-4 w-4" />
                        </button>
                        {(searchInput || statusFilter) && (
                            <button
                                onClick={clearFilters}
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    {/* Table */}
                    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        {t('models:challenge.title', 'Title')}
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        {t('models:challenge.status', 'Status')}
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        {t('models:challenge.difficulty', 'Difficulty')}
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        {t('models:challenge.start_date', 'Start Date')}
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        {t('models:challenge.end_date', 'End Date')}
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                        {t('common:actions', 'Actions')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {items.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-500">
                                            {t('common:no_results', 'No results found.')}
                                        </td>
                                    </tr>
                                )}
                                {items.map((c) => (
                                    <tr key={c.id} className="hover:bg-gray-50">
                                        <td className="max-w-[280px] truncate px-4 py-3 text-sm font-medium text-gray-900">
                                            <div className="flex items-center gap-1.5">
                                                {c.featured && (
                                                    <Star className="h-3.5 w-3.5 shrink-0 fill-yellow-400 text-yellow-400" />
                                                )}
                                                <span className="truncate">{c.title || '---'}</span>
                                            </div>
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm">
                                            <StatusBadge status={c.status} />
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                                            {c.difficulty || '---'}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                                            {c.startDate ? new Date(c.startDate).toLocaleDateString() : '---'}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                                            {c.endDate ? new Date(c.endDate).toLocaleDateString() : '---'}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                                            <div className="flex items-center justify-end gap-1">
                                                <Link
                                                    href={admin.challenges.show.url({ id: c.id })}
                                                    className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-indigo-600"
                                                    title={t('common:view', 'View')}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Link>
                                                <Link
                                                    href={admin.challenges.edit.url({ id: c.id })}
                                                    className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-amber-600"
                                                    title={t('common:edit', 'Edit')}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(c.id)}
                                                    disabled={deleting === c.id}
                                                    className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600 disabled:opacity-50"
                                                    title={t('common:delete', 'Delete')}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-3">
                                <p className="text-sm text-gray-500">
                                    {t('common:page_of', 'Page {{page}} of {{total}}', { page, total: totalPages })}
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => goToPage(page - 1)}
                                        disabled={!challenges?.hasPreviousPage}
                                        className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        {t('common:previous', 'Previous')}
                                    </button>
                                    <button
                                        onClick={() => goToPage(page + 1)}
                                        disabled={!challenges?.hasNextPage}
                                        className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {t('common:next', 'Next')}
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
