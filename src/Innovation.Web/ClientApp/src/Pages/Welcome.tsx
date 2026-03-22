import { login, register } from '../routes';

export default function Welcome() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        backgroundColor: '#f8fafc',
        color: '#1e293b',
      }}
    >
      <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Innovation Platform</h1>
      <p style={{ fontSize: '1.1rem', color: '#64748b', marginBottom: '2rem' }}>
        Welcome to the Innovation Management System
      </p>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <a
          href={login.url()}
          style={{
            padding: '0.75rem 2rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            borderRadius: '0.5rem',
            textDecoration: 'none',
            fontWeight: 500,
          }}
        >
          Login
        </a>
        <a
          href={register.url()}
          style={{
            padding: '0.75rem 2rem',
            backgroundColor: 'white',
            color: '#3b82f6',
            borderRadius: '0.5rem',
            textDecoration: 'none',
            fontWeight: 500,
            border: '1px solid #3b82f6',
          }}
        >
          Register
        </a>
      </div>
    </div>
  );
}
