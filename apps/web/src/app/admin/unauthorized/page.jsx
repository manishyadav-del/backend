'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function UnauthorizedPage() {
  const [role, setRole] = useState('viewer');

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) setRole(data.user.role);
      })
      .catch(() => {});
  }, []);

  const homeUrl = role === 'admin' ? '/admin/dashboard' : '/admin/user-dashboard';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', padding: '2rem' }}>
      <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🛡️</div>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-h1)', marginBottom: '0.75rem' }}>Access Denied</h1>
      <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', marginBottom: '2rem', lineHeight: '1.6' }}>
        You do not have the required permissions to access this dashboard module. Please contact your system administrator if you believe this is an error.
      </p>
      <Link href={homeUrl} className="btn-primary" style={{ textDecoration: 'none' }}>
        Go to Home
      </Link>
    </div>
  );
}
