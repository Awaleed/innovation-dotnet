import { type SharedData } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Save, X } from 'lucide-react';
import { useState } from 'react';

interface FormState {
    titleEn: string;
    titleAr: string;
    descriptionEn: string;
    descriptionAr: string;
    status: string;
    difficulty: string;
    participationType: string;
    maxParticipants: string;
    startDate: string;
    endDate: string;
    featured: boolean;
    isPublic: boolean;
    contactEmail: string;
    contactPhone: string;
}

const initial: FormState = {
    titleEn: '',
    titleAr: '',
    descriptionEn: '',
    descriptionAr: '',
    status: 'Draft',
    difficulty: 'Beginner',
    participationType: 'Individual',
    maxParticipants: '',
    startDate: '',
    endDate: '',
    featured: false,
    isPublic: true,
    contactEmail: '',
    contactPhone: '',
};

const labelCls = 'block text-sm font-medium text-gray-700 mb-1';
const inputCls =
    'w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';
const selectCls = inputCls;

export default function ChallengeCreate(_props: SharedData) {
    const [form, setForm] = useState<FormState>(initial);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<string | null>(null);

    function set<K extends keyof FormState>(key: K, value: FormState[K]) {
        setForm((prev) => ({ ...prev, [key]: value }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        setErrors(null);

        const body = {
            title: { en: form.titleEn, ar: form.titleAr },
            description: { en: form.descriptionEn, ar: form.descriptionAr },
            status: form.status,
            difficulty: form.difficulty,
            participationType: form.participationType,
            maxParticipants: form.maxParticipants ? Number(form.maxParticipants) : null,
            startDate: form.startDate || null,
            endDate: form.endDate || null,
            featured: form.featured,
            isPublic: form.isPublic,
            contactEmail: form.contactEmail || null,
            contactPhone: form.contactPhone || null,
        };

        try {
            const res = await fetch('/api/v1/challenges', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || `HTTP ${res.status}`);
            }
            router.visit('/admin/challenges');
        } catch (err: unknown) {
            setErrors(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <>
            <Head title="Create Challenge" />

            <div className="min-h-screen bg-gray-50 p-6">
                <div className="mx-auto max-w-3xl">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900">Create Challenge</h1>
                        <p className="mt-1 text-sm text-gray-500">Fill in the details below to create a new challenge.</p>
                    </div>

                    {errors && (
                        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {errors}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                        {/* Titles */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className={labelCls}>Title (EN)</label>
                                <input
                                    type="text"
                                    className={inputCls}
                                    value={form.titleEn}
                                    onChange={(e) => set('titleEn', e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className={labelCls}>Title (AR)</label>
                                <input
                                    type="text"
                                    className={inputCls}
                                    dir="rtl"
                                    value={form.titleAr}
                                    onChange={(e) => set('titleAr', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Descriptions */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className={labelCls}>Description (EN)</label>
                                <textarea
                                    className={inputCls}
                                    rows={3}
                                    value={form.descriptionEn}
                                    onChange={(e) => set('descriptionEn', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className={labelCls}>Description (AR)</label>
                                <textarea
                                    className={inputCls}
                                    rows={3}
                                    dir="rtl"
                                    value={form.descriptionAr}
                                    onChange={(e) => set('descriptionAr', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Dropdowns row */}
                        <div className="grid gap-4 sm:grid-cols-3">
                            <div>
                                <label className={labelCls}>Status</label>
                                <select className={selectCls} value={form.status} onChange={(e) => set('status', e.target.value)}>
                                    <option value="Draft">Draft</option>
                                    <option value="Upcoming">Upcoming</option>
                                    <option value="Open">Open</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelCls}>Difficulty</label>
                                <select className={selectCls} value={form.difficulty} onChange={(e) => set('difficulty', e.target.value)}>
                                    <option value="Beginner">Beginner</option>
                                    <option value="Intermediate">Intermediate</option>
                                    <option value="Advanced">Advanced</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelCls}>Participation Type</label>
                                <select className={selectCls} value={form.participationType} onChange={(e) => set('participationType', e.target.value)}>
                                    <option value="Individual">Individual</option>
                                    <option value="Team">Team</option>
                                    <option value="Both">Both</option>
                                </select>
                            </div>
                        </div>

                        {/* Max participants */}
                        <div className="max-w-xs">
                            <label className={labelCls}>Max Participants</label>
                            <input
                                type="number"
                                min={0}
                                className={inputCls}
                                value={form.maxParticipants}
                                onChange={(e) => set('maxParticipants', e.target.value)}
                            />
                        </div>

                        {/* Dates */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className={labelCls}>Start Date</label>
                                <input
                                    type="date"
                                    className={inputCls}
                                    value={form.startDate}
                                    onChange={(e) => set('startDate', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className={labelCls}>End Date</label>
                                <input
                                    type="date"
                                    className={inputCls}
                                    value={form.endDate}
                                    onChange={(e) => set('endDate', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Checkboxes */}
                        <div className="flex items-center gap-6">
                            <label className="flex items-center gap-2 text-sm text-gray-700">
                                <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    checked={form.featured}
                                    onChange={(e) => set('featured', e.target.checked)}
                                />
                                Featured
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-700">
                                <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    checked={form.isPublic}
                                    onChange={(e) => set('isPublic', e.target.checked)}
                                />
                                Public
                            </label>
                        </div>

                        {/* Contact */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className={labelCls}>Contact Email</label>
                                <input
                                    type="email"
                                    className={inputCls}
                                    value={form.contactEmail}
                                    onChange={(e) => set('contactEmail', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className={labelCls}>Contact Phone</label>
                                <input
                                    type="tel"
                                    className={inputCls}
                                    value={form.contactPhone}
                                    onChange={(e) => set('contactPhone', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4">
                            <Link
                                href="/admin/challenges"
                                className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                <X className="h-4 w-4" />
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                            >
                                <Save className="h-4 w-4" />
                                {submitting ? 'Creating...' : 'Create Challenge'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
