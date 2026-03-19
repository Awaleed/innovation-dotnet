import { usePage, router } from '@inertiajs/react';
import type { DashboardProps } from '../types';

export default function Dashboard() {
    const { auth } = usePage<DashboardProps>().props;
    const user = auth?.user;

    async function handleLogout() {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.visit('/login');
    }

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.title}>Dashboard</h1>
                <button onClick={handleLogout} style={styles.logoutBtn}>
                    Logout
                </button>
            </div>
            <div style={styles.card}>
                <h2 style={styles.greeting}>
                    Welcome, {user?.name || 'User'}!
                </h2>
                <p style={styles.email}>{user?.email}</p>
                <p style={styles.info}>
                    You are logged in to the Innovation Platform.
                </p>
            </div>
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    container: {
        minHeight: '100vh', backgroundColor: '#f8fafc',
        fontFamily: 'system-ui, -apple-system, sans-serif', padding: '2rem',
    },
    header: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        maxWidth: '800px', margin: '0 auto 2rem',
    },
    title: { fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' },
    logoutBtn: {
        padding: '0.5rem 1rem', backgroundColor: '#ef4444', color: 'white',
        border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 500,
    },
    card: {
        backgroundColor: 'white', padding: '2rem', borderRadius: '0.75rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)', maxWidth: '800px', margin: '0 auto',
    },
    greeting: { fontSize: '1.25rem', fontWeight: 600, color: '#1e293b', marginBottom: '0.25rem' },
    email: { color: '#64748b', marginBottom: '1rem' },
    info: { color: '#475569' },
};
