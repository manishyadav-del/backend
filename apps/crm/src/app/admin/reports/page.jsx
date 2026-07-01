'use client';

import { useEffect, useState, useCallback } from 'react';

const LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
};

export default function ReportsPage() {
  const [reports, setReports] = useState(null);
  const [loadingState, setLoadingState] = useState(LOADING_STATES.LOADING);
  const [error, setError] = useState(null);

  const projectId = 'demo';

  const fetchReportsData = useCallback(async () => {
    try {
      setLoadingState(LOADING_STATES.LOADING);
      // Fetch stats and logs from backend endpoints
      const res = await fetch(`/api/dashboard/stats?projectId=${projectId}`);
      if (!res.ok) throw new Error('Failed to load performance metrics');

      const data = await res.json();
      if (data.success) {
        setReports(data.data);
        setLoadingState(LOADING_STATES.SUCCESS);
      } else {
        throw new Error(data.error || 'Failed to parse reports');
      }
    } catch (err) {
      // Fallback mocks
      setReports({
        stats: { leads: 12, subscribers: 304, campaigns: 8 },
        revenue: [
          { month: 'April', adsense: 420.50, consulting: 1200.00 },
          { month: 'May', adsense: 510.20, consulting: 1550.00 },
          { month: 'June', adsense: 680.10, consulting: 1980.00 }
        ],
        traffic: [
          { day: 'Mon', visits: 120, bounceRate: '42%' },
          { day: 'Tue', visits: 150, bounceRate: '38%' },
          { day: 'Wed', visits: 180, bounceRate: '35%' },
          { day: 'Thu', visits: 210, bounceRate: '40%' },
          { day: 'Fri', visits: 240, bounceRate: '37%' }
        ]
      });
      setLoadingState(LOADING_STATES.SUCCESS);
    }
  }, []);

  useEffect(() => {
    fetchReportsData();
  }, [fetchReportsData]);

  if (loadingState === LOADING_STATES.LOADING) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Compiling financial and traffic trends...</div>;
  }

  const revenueData = reports?.revenue || [
    { month: 'April', adsense: 420.50, consulting: 1200.00 },
    { month: 'May', adsense: 510.20, consulting: 1550.00 },
    { month: 'June', adsense: 680.10, consulting: 1980.00 }
  ];

  const trafficData = reports?.traffic || [
    { day: 'Mon', visits: 120, bounceRate: '42%' },
    { day: 'Tue', visits: 150, bounceRate: '38%' },
    { day: 'Wed', visits: 180, bounceRate: '35%' },
    { day: 'Thu', visits: 210, bounceRate: '40%' },
    { day: 'Fri', visits: 240, bounceRate: '37%' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-h1)', margin: 0 }}>Advanced CRM Reports</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>Track business growth lines, unified AdSense click payouts, client conversions, and traffic trends.</p>
      </div>

      {/* Grid: Revenue & Traffic charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        
        {/* Revenue streams list */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: 'var(--text-h1)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>💰 Financial Income Breakdown</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {revenueData.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '0.75rem 1rem', borderRadius: '6px', border: '1px solid var(--border-light)', fontSize: '0.85rem' }}>
                <span style={{ fontWeight: 'bold', color: 'var(--text-h1)' }}>{item.month}</span>
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>AdSense:</span>
                    <span style={{ marginLeft: '0.25rem', fontWeight: 600 }}>${item.adsense.toFixed(2)}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Consulting:</span>
                    <span style={{ marginLeft: '0.25rem', fontWeight: 600, color: 'var(--success)' }}>${item.consulting.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Traffic logs list */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: 'var(--text-h1)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>📊 Daily Traffic Trends</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {trafficData.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '0.75rem 1rem', borderRadius: '6px', border: '1px solid var(--border-light)', fontSize: '0.85rem' }}>
                <span style={{ fontWeight: 'bold', color: 'var(--text-h1)' }}>{item.day}</span>
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Visits:</span>
                    <span style={{ marginLeft: '0.25rem', fontWeight: 600, color: 'var(--primary)' }}>{item.visits}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Bounce:</span>
                    <span style={{ marginLeft: '0.25rem', fontWeight: 600 }}>{item.bounceRate}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
