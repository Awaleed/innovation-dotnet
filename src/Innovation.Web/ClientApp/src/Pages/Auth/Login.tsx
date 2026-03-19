import { useState, FormEvent } from 'react';
import { router } from '@inertiajs/react';
import { dashboard, register as registerRoute } from '../../routes';
import { login as apiLogin } from '../../routes/api/auth';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const route = apiLogin();
            const res = await fetch(route.url, {
                method: route.method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (res.ok) {
                // Cookie is set by the server — just navigate
                router.visit(dashboard.url());
            } else {
                const data = await res.json();
                setError(data.detail || 'Invalid email or password.');
            }
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h1 style={styles.title}>Login</h1>
                <p style={styles.subtitle}>Sign in to your account</p>

                {error && <div style={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div style={styles.field}>
                        <label style={styles.label}>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            style={styles.input}
                            required
                        />
                    </div>

                    <div style={styles.field}>
                        <label style={styles.label}>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            style={styles.input}
                            required
                        />
                    </div>

                    <button type="submit" disabled={loading} style={styles.button}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <p style={styles.linkText}>
                    Don't have an account?{' '}
                    <a href={registerRoute.url()} style={styles.link}>Register</a>
                </p>
            </div>
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    container: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        fontFamily: 'system-ui, -apple-system, sans-serif',
    },
    card: {
        backgroundColor: 'white',
        padding: '2.5rem',
        borderRadius: '0.75rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '400px',
    },
    title: { fontSize: '1.75rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.25rem' },
    subtitle: { color: '#64748b', marginBottom: '1.5rem' },
    error: {
        backgroundColor: '#fef2f2', color: '#dc2626', padding: '0.75rem',
        borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem',
    },
    field: { marginBottom: '1rem' },
    label: { display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: '0.25rem' },
    input: {
        width: '100%', padding: '0.625rem 0.75rem', border: '1px solid #d1d5db',
        borderRadius: '0.5rem', fontSize: '1rem', boxSizing: 'border-box',
    },
    button: {
        width: '100%', padding: '0.75rem', backgroundColor: '#3b82f6', color: 'white',
        border: 'none', borderRadius: '0.5rem', fontSize: '1rem', fontWeight: 500,
        cursor: 'pointer', marginTop: '0.5rem',
    },
    linkText: { textAlign: 'center', marginTop: '1.5rem', color: '#64748b', fontSize: '0.875rem' },
    link: { color: '#3b82f6', textDecoration: 'none' },
};
