import http from '@/lib/api-client';
import { admin, api } from '@/routes';
import { type SharedData } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Calendar,
    CheckCircle,
    Edit,
    Flag,
    Globe,
    Mail,
    MessageCircle,
    Phone,
    Star,
    Users,
    Zap,
} from 'lucide-react';
import { useState } from 'react';

interface ChallengeDetailResponse {
    id: number;
    publicUlid: string | null;
    title: { en: string | null; ar: string | null };
    description: { en: string | null; ar: string | null };
    status: string;
    difficulty: string | null;
    participationType: string | null;
    submissionType: string | null;
    maxParticipants: number | null;
    organizer: string | null;
    location: string | null;
    startDate: string | null;
    endDate: string | null;
    submissionDeadline: string | null;
    evaluationStartDate: string | null;
    evaluationEndDate: string | null;
    featured: boolean;
    isPublic: boolean;
    enableComments: boolean;
    contactEmail: string | null;
    contactPhone: string | null;
    createdAt: string;
    updatedAt: string | null;
}

interface Props extends SharedData {
    challenge: ChallengeDetailResponse;
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
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${cls}`}>
            {status}
        </span>
    );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div>
            <dt className="text-sm font-medium text-gray-500">{label}</dt>
            <dd className="mt-1 text-sm text-gray-900">{value || '---'}</dd>
        </div>
    );
}

function formatDate(d: string | null) {
    if (!d) return '---';
    return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function ChallengeShow({ challenge }: Props) {
    const [advancing, setAdvancing] = useState(false);

    async function handleAdvanceStage() {
        if (!confirm('Are you sure you want to advance this challenge to the next stage?')) return;
        setAdvancing(true);
        try {
            await http.post(api.v1.challenges.advance({ id: challenge.id }).url);
            router.reload();
        } catch {
            alert('Failed to advance stage.');
        } finally {
            setAdvancing(false);
        }
    }

    return (
        <>
            <Head title={challenge.title.en || 'Challenge Details'} />

            <div className="min-h-screen bg-gray-50 p-6">
                <div className="mx-auto max-w-4xl">
                    {/* Header */}
                    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <div className="mb-2 flex items-center gap-3">
                                <h1 className="text-2xl font-bold text-gray-900">{challenge.title.en || 'Untitled'}</h1>
                                {challenge.featured && <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />}
                            </div>
                            {challenge.title.ar && (
                                <p className="text-lg text-gray-600" dir="rtl">{challenge.title.ar}</p>
                            )}
                            <div className="mt-2 flex items-center gap-2">
                                <StatusBadge status={challenge.status} />
                                {challenge.difficulty && (
                                    <span className="inline-flex items-center rounded-full border border-gray-300 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                                        {challenge.difficulty}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleAdvanceStage}
                                disabled={advancing || challenge.status === 'Completed' || challenge.status === 'Cancelled'}
                                className="inline-flex items-center gap-1.5 rounded-md bg-amber-500 px-3 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <Zap className="h-4 w-4" />
                                {advancing ? 'Advancing...' : 'Advance Stage'}
                            </button>
                            <Link
                                href={admin.challenges.edit.url({ id: challenge.id })}
                                className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                            >
                                <Edit className="h-4 w-4" />
                                Edit
                            </Link>
                            <Link
                                href={admin.index.url()}
                                className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to List
                            </Link>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Description */}
                        {(challenge.description?.en || challenge.description?.ar) && (
                            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                                <h2 className="mb-3 text-lg font-semibold text-gray-900">Description</h2>
                                {challenge.description?.en && (
                                    <p className="text-sm leading-relaxed text-gray-700">{challenge.description.en}</p>
                                )}
                                {challenge.description?.ar && (
                                    <p className="mt-2 text-sm leading-relaxed text-gray-700" dir="rtl">{challenge.description.ar}</p>
                                )}
                            </div>
                        )}

                        {/* General Info */}
                        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-4 text-lg font-semibold text-gray-900">General Information</h2>
                            <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                                <Field label="Organizer" value={challenge.organizer} />
                                <Field label="Location" value={challenge.location} />
                                <Field label="Public ULID" value={challenge.publicUlid} />
                            </dl>
                        </div>

                        {/* Dates */}
                        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                                <Calendar className="h-5 w-5 text-gray-400" />
                                Dates
                            </h2>
                            <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                                <Field label="Start Date" value={formatDate(challenge.startDate)} />
                                <Field label="End Date" value={formatDate(challenge.endDate)} />
                                <Field label="Submission Deadline" value={formatDate(challenge.submissionDeadline)} />
                                <Field label="Evaluation Start" value={formatDate(challenge.evaluationStartDate)} />
                                <Field label="Evaluation End" value={formatDate(challenge.evaluationEndDate)} />
                                <Field label="Created At" value={formatDate(challenge.createdAt)} />
                            </dl>
                        </div>

                        {/* Configuration */}
                        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                                <Users className="h-5 w-5 text-gray-400" />
                                Configuration
                            </h2>
                            <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
                                <Field label="Difficulty" value={challenge.difficulty} />
                                <Field label="Participation Type" value={challenge.participationType} />
                                <Field label="Submission Type" value={challenge.submissionType} />
                                <Field
                                    label="Max Participants"
                                    value={challenge.maxParticipants != null ? challenge.maxParticipants : '---'}
                                />
                            </dl>
                        </div>

                        {/* Flags & Contact */}
                        <div className="grid gap-6 sm:grid-cols-2">
                            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                                    <Flag className="h-5 w-5 text-gray-400" />
                                    Flags
                                </h2>
                                <ul className="space-y-2">
                                    <li className="flex items-center gap-2 text-sm text-gray-700">
                                        <CheckCircle className={`h-4 w-4 ${challenge.featured ? 'text-green-500' : 'text-gray-300'}`} />
                                        Featured
                                    </li>
                                    <li className="flex items-center gap-2 text-sm text-gray-700">
                                        <Globe className={`h-4 w-4 ${challenge.isPublic ? 'text-green-500' : 'text-gray-300'}`} />
                                        Public
                                    </li>
                                    <li className="flex items-center gap-2 text-sm text-gray-700">
                                        <MessageCircle className={`h-4 w-4 ${challenge.enableComments ? 'text-green-500' : 'text-gray-300'}`} />
                                        Comments Enabled
                                    </li>
                                </ul>
                            </div>

                            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                    Contact
                                </h2>
                                <dl className="space-y-3">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Mail className="h-4 w-4 text-gray-400" />
                                        <span className="text-gray-700">{challenge.contactEmail || '---'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Phone className="h-4 w-4 text-gray-400" />
                                        <span className="text-gray-700">{challenge.contactPhone || '---'}</span>
                                    </div>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
