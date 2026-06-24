'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('user');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          router.push('/home');
        } else {
          setCheckingAuth(false);
        }
      } catch {
        setCheckingAuth(false);
      }
    }
    checkAuth();
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName,
          email,
          password,
          role,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        router.push('/login?registered=true');
      } else {
        setError(data.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError('Connection error. Please check your internet and try again.');
    }

    setLoading(false);
  };

  if (checkingAuth) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-base)',
        color: 'var(--text-muted)',
        gap: '1rem',
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid var(--border-strong)',
          borderTopColor: 'var(--primary)',
          borderRadius: '50%',
          animation: 'login-spin 0.8s linear infinite',
        }} />
        <p>Loading...</p>
        <style>{`
          @keyframes login-spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="auth-orb auth-orb-1" />
      <div className="auth-orb auth-orb-2" />
      <div className="login-card">
        <div className="brand">
          <div className="brand-icon">⚡</div>
          <h1>Global Backend</h1>
          <p className="subtitle">Create your account</p>
        </div>

        {error && (
          <div className="login-error">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="fullName">Full Name</label>
            <input
              type="text"
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
              required
              autoFocus
              autoComplete="name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a strong password"
                required
                minLength={8}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '👁' : '👁‍🗨'}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="role">I want to</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius)',
                color: 'var(--text-primary)',
                fontSize: '0.9375rem',
                outline: 'none',
                transition: 'var(--transition)',
              }}
            >
              <option value="user">Browse and read content (User)</option>
              <option value="client">View content and contact authors (Client)</option>
              <option value="content_creator">Create and manage posts (Content Creator)</option>
              <option value="author">Write and edit articles (Author)</option>
              <option value="contributor">Submit content for approval (Contributor)</option>
            </select>
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner" />
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </button>

          <div className="login-footer">
            <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Already have an account? <a href="/login" className="forgot-link">Sign in</a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}