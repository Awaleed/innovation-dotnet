import { type SharedData } from '@/types';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';
import { ArrowLeft } from 'lucide-react';

type Props = SharedData;

export default function RolesCreate(_props: Props) {
  const breadcrumbs = [
    { title: 'Admin', href: '#' },
    { title: 'Roles', href: '/admin/roles' },
    { title: 'Create', href: '/admin/roles/create' },
  ];

  return (
    <AdminLayout breadcrumbs={breadcrumbs}>
      <Head title="Create Role" />

      <div className="container mx-auto space-y-6 p-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line no-restricted-syntax */}
          <Link href="/admin/roles" className="rounded p-1.5 hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create Role</h1>
            <p className="text-muted-foreground">Define a new role and assign permissions</p>
          </div>
        </div>

        {/* Placeholder form */}
        <div className="rounded-md border p-6">
          <p className="text-muted-foreground">Role creation form — coming soon.</p>
        </div>
      </div>
    </AdminLayout>
  );
}
