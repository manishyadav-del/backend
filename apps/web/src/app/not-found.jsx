import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      textAlign: 'center',
      fontFamily: 'sans-serif',
      padding: '2rem',
      background: '#f9fafb',
      color: '#1f2937'
    }}>
      <h1 style={{ fontSize: '6rem', fontWeight: 800, margin: 0, color: '#10b981' }}>404</h1>
      <h2 style={{ fontSize: '1.875rem', fontWeight: 700, marginTop: '1rem', marginBottom: '0.5rem' }}>Page Not Found</h2>
      <p style={{ color: '#6b7280', marginBottom: '2rem', maxWidth: '400px' }}>
        The page you are looking for does not exist or has been moved.
      </p>
      <Link href="/" style={{
        padding: '0.75rem 1.5rem',
        background: '#10b981',
        color: '#ffffff',
        textDecoration: 'none',
        borderRadius: '8px',
        fontWeight: 600,
        boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.1)'
      }}>
        Go back home
      </Link>
    </div>
  );
}
