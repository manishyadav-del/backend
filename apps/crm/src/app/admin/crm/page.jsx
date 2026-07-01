'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

const LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
};

export default function CrmDashboard() {
  const [data, setData] = useState(null);
  const [loadingState, setLoadingState] = useState(LOADING_STATES.LOADING);
  const [error, setError] = useState(null);

  const fetchCrmData = useCallback(async () => {
    try {
      setLoadingState(LOADING_STATES.LOADING);
      const res = await fetch('/api/dashboard/stats');
      if (!res.ok) throw new Error('Failed to fetch CRM stats');
      
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        setLoadingState(LOADING_STATES.SUCCESS);
      } else {
        throw new Error(json.error || 'Failed to load CRM data');
      }
    } catch (err) {
      setError(err.message);
      setLoadingState(LOADING_STATES.ERROR);
    }
  }, []);

  useEffect(() => {
    fetchCrmData();
  }, [fetchCrmData]);

  if (loadingState === LOADING_STATES.LOADING) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        Loading Marketing CRM Insights...
      </div>
    );
  }

  if (loadingState === LOADING_STATES.ERROR) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--danger)' }}>
        <h3>Failed to Load CRM</h3>
        <p>{error}</p>
        <button onClick={fetchCrmData} className="btn-primary" style={{ marginTop: '1rem' }}>Retry</button>
      </div>
    );
  }

  const { stats, recentLeads, recentSubmissions } = data;

  return (
    <div className="crm-dashboard" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-h1)', margin: 0 }}>Marketing CRM Overview</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>
            Manage client leads, form submissions, contacts, and email communication.
          </p>
        </div>
        <Link href="/admin/cta" className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
          📢 Manage CTAs & Leads
        </Link>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total CRM Leads</span>
            <span>💼</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 850, color: 'var(--text-h1)' }}>{stats.leads || 0}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Active prospective clients captured</div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Form Submissions</span>
            <span>📋</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 850, color: 'var(--text-h1)' }}>{recentSubmissions?.length || 0}</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Recent contact request submissions</div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Active Campaigns</span>
            <span>✉️</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 850, color: 'var(--text-h1)' }}>1</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Connected SMTP dispatch configurations</div>
        </div>
      </div>

      {/* Leads and Form submissions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Recent Leads */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, margin: 0 }}>Recent Leads</h3>
            <Link href="/admin/leads" style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>View All &rarr;</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recentLeads && recentLeads.length > 0 ? (
              recentLeads.slice(0, 5).map(lead => (
                <div key={lead.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-light)', fontSize: '0.8rem' }}>
                  <div>
                    <strong style={{ color: 'var(--text-h1)' }}>{lead.name}</strong>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.72rem' }}>{lead.email}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.72rem', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>{lead.service || 'General'}</span>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem', marginTop: '0.2rem' }}>{lead.date}</div>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', padding: '1.5rem' }}>No leads recorded yet.</p>
            )}
          </div>
        </div>

        {/* Form Submissions */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, margin: 0 }}>Form Submissions</h3>
            <Link href="/admin/contacts" style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>View All &rarr;</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recentSubmissions && recentSubmissions.length > 0 ? (
              recentSubmissions.slice(0, 5).map(sub => (
                <div key={sub.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-light)', fontSize: '0.8rem' }}>
                  <div>
                    <strong style={{ color: 'var(--text-h1)' }}>{sub.name}</strong>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.72rem' }}>{sub.email}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.72rem', background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>Contact Form</span>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem', marginTop: '0.2rem' }}>{sub.date}</div>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', padding: '1.5rem' }}>No submissions recorded yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
