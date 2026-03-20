import { Head, Link, usePage, router } from '@inertiajs/react';
import { type SharedData } from '../types';
import { LayoutDashboard, Trophy, Lightbulb, Users, BarChart3, Settings, LogOut, ChevronRight } from 'lucide-react';

const navItems = [
    { label: 'Challenges', href: '/admin/challenges', icon: Trophy, description: 'Create and manage innovation challenges', ready: true },
    { label: 'Ideas', href: '#', icon: Lightbulb, description: 'Review submitted ideas', ready: false },
    { label: 'Users', href: '#', icon: Users, description: 'Manage platform users', ready: false },
    { label: 'Reports', href: '#', icon: BarChart3, description: 'View analytics and reports', ready: false },
    { label: 'Settings', href: '#', icon: Settings, description: 'Platform configuration', ready: false },
];

export default function Dashboard() {
    const { auth } = usePage<SharedData>().props;
    const user = auth?.user;

    return (
        <div className="min-h-screen bg-gray-50">
            <Head title="Dashboard" />

            {/* Top bar */}
            <header className="border-b border-gray-200 bg-white">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
                            <LayoutDashboard className="h-5 w-5 text-white" />
                        </div>
                        <h1 className="text-lg font-semibold text-gray-900">Innovation Platform</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-end">
                            <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
                            <p className="text-xs text-gray-500">{user?.email}</p>
                        </div>
                        <button
                            onClick={() => router.post('/logout')}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 hover:text-red-600"
                        >
                            <LogOut className="h-3.5 w-3.5" />
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-6 py-8">
                {/* Welcome */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name || 'User'}</h2>
                    <p className="mt-1 text-gray-500">Manage your innovation platform from here.</p>
                </div>

                {/* Navigation cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        return item.ready ? (
                            <Link
                                key={item.label}
                                href={item.href}
                                className="group flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
                            >
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100">
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold text-gray-900">{item.label}</h3>
                                        <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-500" />
                                    </div>
                                    <p className="mt-1 text-sm text-gray-500">{item.description}</p>
                                </div>
                            </Link>
                        ) : (
                            <div
                                key={item.label}
                                className="flex items-start gap-4 rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-5 opacity-60"
                            >
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                                    <Icon className="h-5 w-5" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold text-gray-500">{item.label}</h3>
                                        <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-medium text-gray-500">Coming Soon</span>
                                    </div>
                                    <p className="mt-1 text-sm text-gray-400">{item.description}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </main>
        </div>
    );
}
