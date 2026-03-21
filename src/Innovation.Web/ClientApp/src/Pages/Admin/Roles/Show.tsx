import { type SharedData } from '@/types';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { ArrowLeft, Edit, Shield } from 'lucide-react';

interface RoleDetail {
    id: number;
    name: string;
    guardName: string;
    permissions: string[];
}

interface Props extends SharedData {
    role: RoleDetail;
}

export default function RolesShow({ role }: Props) {
    const breadcrumbs = [
        { title: 'Admin', href: '#' },
        { title: 'Roles', href: '/admin/roles' },
        { title: role.name, href: `/admin/roles/${role.id}` },
    ];

    // Group permissions by prefix
    const grouped = role.permissions.reduce<Record<string, string[]>>((acc, perm) => {
        const prefix = perm.includes(':') ? perm.substring(0, perm.indexOf(':')) : 'other';
        if (!acc[prefix]) acc[prefix] = [];
        acc[prefix].push(perm);
        return acc;
    }, {});

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={`Role: ${role.name}`} />

            <div className="container mx-auto space-y-6 p-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/admin/roles" className="rounded p-1.5 hover:bg-muted">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <Shield className="h-5 w-5 text-muted-foreground" />
                                <h1 className="text-3xl font-bold tracking-tight">{role.name}</h1>
                            </div>
                            <p className="text-sm text-muted-foreground">Guard: {role.guardName}</p>
                        </div>
                    </div>
                    <Link
                        href={`/admin/roles/${role.id}/edit`}
                        className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                        <Edit className="h-4 w-4" />
                        Edit Role
                    </Link>
                </div>

                {/* Permissions */}
                <div className="rounded-md border p-6">
                    <h2 className="mb-4 text-lg font-semibold">
                        Permissions ({role.permissions.length})
                    </h2>
                    <div className="space-y-4">
                        {Object.entries(grouped)
                            .sort(([a], [b]) => a.localeCompare(b))
                            .map(([prefix, perms]) => (
                                <div key={prefix}>
                                    <h3 className="mb-2 text-sm font-medium uppercase text-muted-foreground">
                                        {prefix}
                                    </h3>
                                    <div className="flex flex-wrap gap-1.5">
                                        {perms.sort().map((perm) => (
                                            <span
                                                key={perm}
                                                className="rounded-md bg-muted px-2 py-1 text-xs font-mono"
                                            >
                                                {perm}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
