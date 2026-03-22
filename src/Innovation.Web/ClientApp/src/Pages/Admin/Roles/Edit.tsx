import { type SharedData } from '@/types';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { ArrowLeft } from 'lucide-react';

interface RoleDetail {
    id: number;
    name: string;
    guardName: string;
    permissions: string[];
}

interface Props extends SharedData {
    role: RoleDetail;
}

export default function RolesEdit({ role }: Props) {
    const breadcrumbs = [
        { title: 'Admin', href: '#' },
        { title: 'Roles', href: '/admin/roles' },
        { title: role.name, href: `/admin/roles/${role.id}` },
        { title: 'Edit', href: `/admin/roles/${role.id}/edit` },
    ];

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Role: ${role.name}`} />

            <div className="container mx-auto space-y-6 p-8">
                {/* Header */}
                <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line no-restricted-syntax */}
                    <Link href={`/admin/roles/${role.id}`} className="rounded p-1.5 hover:bg-muted">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Edit: {role.name}</h1>
                        <p className="text-muted-foreground">Update role name and permissions</p>
                    </div>
                </div>

                {/* Placeholder form */}
                <div className="rounded-md border p-6">
                    <p className="text-muted-foreground">Role edit form — coming soon.</p>
                </div>
            </div>
        </AdminLayout>
    );
}
