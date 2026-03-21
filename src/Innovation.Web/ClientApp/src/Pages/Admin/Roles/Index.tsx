import { type SharedData } from '@/types';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { Plus, Shield, Users, Eye, Edit, Trash2 } from 'lucide-react';

interface RoleListItem {
    id: number;
    name: string;
    permissionCount: number;
    userCount: number;
}

interface Props extends SharedData {
    roles: RoleListItem[] | null;
}

export default function RolesIndex({ roles }: Props) {
    const breadcrumbs = [
        { title: 'Admin', href: '#' },
        { title: 'Roles', href: '/admin/roles' },
    ];

    return (
        <AdminLayout breadcrumbs={breadcrumbs}>
            <Head title="Roles" />

            <div className="container mx-auto space-y-6 p-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Roles</h1>
                        <p className="text-muted-foreground">Manage user roles and their permissions</p>
                    </div>
                    <Link
                        href="/admin/roles/create"
                        className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                        <Plus className="h-4 w-4" />
                        Create Role
                    </Link>
                </div>

                {/* Table */}
                <div className="rounded-md border">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b bg-muted/50">
                                <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
                                <th className="px-4 py-3 text-left text-sm font-medium">Permissions</th>
                                <th className="px-4 py-3 text-left text-sm font-medium">Users</th>
                                <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {roles?.map((role) => (
                                <tr key={role.id} className="border-b">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <Shield className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-medium">{role.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-muted-foreground">
                                        {role.permissionCount} permissions
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                            <Users className="h-3 w-3" />
                                            {role.userCount}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Link
                                                href={`/admin/roles/${role.id}`}
                                                className="rounded p-1.5 hover:bg-muted"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Link>
                                            <Link
                                                href={`/admin/roles/${role.id}/edit`}
                                                className="rounded p-1.5 hover:bg-muted"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {(!roles || roles.length === 0) && (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                                        No roles found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}
