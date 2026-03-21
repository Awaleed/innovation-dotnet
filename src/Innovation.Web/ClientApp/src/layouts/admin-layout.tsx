import { type ReactNode } from 'react';

export interface BreadcrumbItem {
    title: string;
    href: string;
}

interface AdminLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    return <>{children}</>;
}
