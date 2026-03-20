import { type SharedData } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Eye, Edit, Trash2, Plus, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { useState } from 'react';

interface ChallengeItem {
    id: number;
    publicUlid: string | null;
    title: { en: string | null; ar: string | null };
    status: string;
    difficulty: string | null;
    startDate: string | null;
    endDate: string | null;
    featured: boolean;
    createdAt: string;
}

interface PaginatedChallenges {
    items: ChallengeItem[];
    pageIndex: number;
    totalPages: number;
    totalCount: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
}

interface Props extends SharedData {
    challenges: PaginatedChallenges;
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
    const [deleting, setDeleting] = useState<number | null>(null);

    async function handleDelete(id: number) {
        if (!confirm('Are you sure you want to delete this challenge?')) return;
        setDeleting(id);
        try {
            await fetch(`/api/v1/challenges/${id}`, { method: 'DELETE' });
            router.reload();
        } catch {
            alert('Failed to delete challenge.');
        } finally {
            setDeleting(null);
        }
    }

    function goToPage(page: number) {
        router.visit(`/admin/challenges?page=${page}`);
    }

    return (
        <>
            <Head title="Challenges" />

            <div className="min-h-screen bg-gray-50 p-6">
                <div className="mx-auto max-w-7xl">
                    {/* Header */}
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Challenges</h1>
                            <p className="mt-1 text-sm text-gray-500">
                                {challenges.totalCount} challenge{challenges.totalCount !== 1 ? 's' : ''} total
                            </p>
                        </div>
                        <Link
                            href="/admin/challenges/create"
                            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                        >
                            <Plus className="h-4 w-4" />
                            New Challenge
                        </Link>
                    </div>

                    {/* Table */}
                    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Title (EN)</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Title (AR)</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Difficulty</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Start Date</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">End Date</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {challenges.items.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-500">
                                            No challenges found.
                                        </td>
                                    </tr>
                                )}
                                {challenges.items.map((c) => (
                                    <tr key={c.id} className="hover:bg-gray-50">
                                        <td className="max-w-[200px] truncate px-4 py-3 text-sm font-medium text-gray-900" title={c.title.en || ''}>
                                            <div className="flex items-center gap-1.5">
                                                {c.featured && <Star className="h-3.5 w-3.5 shrink-0 fill-yellow-400 text-yellow-400" />}
                                                <span className="truncate">{c.title.en || '---'}</span>
                                            </div>
                                        </td>
                                        <td className="max-w-[200px] truncate px-4 py-3 text-sm text-gray-600" dir="rtl" title={c.title.ar || ''}>
                                            {c.title.ar || '---'}
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
                                                    href={`/admin/challenges/${c.id}`}
                                                    className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-indigo-600"
                                                    title="View"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Link>
                                                <Link
                                                    href={`/admin/challenges/${c.id}/edit`}
                                                    className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-amber-600"
                                                    title="Edit"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(c.id)}
                                                    disabled={deleting === c.id}
                                                    className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600 disabled:opacity-50"
                                                    title="Delete"
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
                        {challenges.totalPages > 1 && (
                            <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-3">
                                <p className="text-sm text-gray-500">
                                    Page {challenges.pageIndex} of {challenges.totalPages}
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => goToPage(challenges.pageIndex - 1)}
                                        disabled={!challenges.hasPreviousPage}
                                        className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => goToPage(challenges.pageIndex + 1)}
                                        disabled={!challenges.hasNextPage}
                                        className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        Next
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
