'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

const LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [lists, setLists] = useState([]);
  const [loadingState, setLoadingState] = useState(LOADING_STATES.LOADING);
  const [error, setError] = useState(null);

  // Modals & Panels
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sendingId, setSendingId] = useState(null);

  const [newCampaign, setNewCampaign] = useState({
    name: '',
    subject: '',
    body: '',
    listId: '',
    scheduledAt: ''
  });

  const projectId = 'demo';

  const fetchData = useCallback(async () => {
    try {
      setLoadingState(LOADING_STATES.LOADING);
      const [campRes, listsRes] = await Promise.all([
        fetch(`/api/campaigns?projectId=${projectId}`),
        fetch(`/api/subscriber-lists?projectId=${projectId}`)
      ]);

      if (!campRes.ok || !listsRes.ok) throw new Error('Failed to fetch campaigns or lists');

      const campData = await campRes.json();
      const listsData = await listsRes.json();

      if (campData.success && listsData.success) {
        setCampaigns(campData.campaigns || []);
        setLists(listsData.lists || []);
        setLoadingState(LOADING_STATES.SUCCESS);
      } else {
        throw new Error(campData.error || listsData.error || 'Failed to load campaigns');
      }
    } catch (err) {
      setError(err.message);
      setLoadingState(LOADING_STATES.ERROR);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    if (!newCampaign.name || !newCampaign.subject || !newCampaign.body) return;

    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          ...newCampaign
        })
      });

      const data = await res.json();
      if (data.success) {
        setShowCreateModal(false);
        setNewCampaign({ name: '', subject: '', body: '', listId: '', scheduledAt: '' });
        fetchData();
      } else {
        alert(data.error || 'Failed to create campaign');
      }
    } catch {
      alert('Error creating campaign');
    }
  };

  const handleSendCampaign = async (campaignId) => {
    if (!confirm('Are you ready to dispatch this campaign to all active list subscribers?')) return;

    setSendingId(campaignId);
    try {
      const res = await fetch('/api/campaigns/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId })
      });

      const data = await res.json();
      if (data.success) {
        alert(data.message || 'Campaign sent successfully!');
        fetchData();
      } else {
        alert(data.error || 'Failed to dispatch campaign');
      }
    } catch {
      alert('Network error dispatching campaign');
    } finally {
      setSendingId(null);
    }
  };

  if (loadingState === LOADING_STATES.LOADING) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading campaigns...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-h1)', margin: 0 }}>Email Campaigns</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>Design, schedule, and track performance of patient and lead outreach newsletters.</p>
        </div>
        <button className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }} onClick={() => setShowCreateModal(true)}>
          ➕ New Campaign
        </button>
      </div>

      {/* Campaigns list */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
        {campaigns.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {campaigns.map(camp => (
              <div key={camp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <h3 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-h1)', fontWeight: 'bold' }}>{camp.name}</h3>
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: 'bold',
                      padding: '0.1rem 0.35rem',
                      borderRadius: '4px',
                      background: camp.status === 'sent' ? 'rgba(16,185,129,0.1)' : camp.status === 'sending' ? 'rgba(59,130,246,0.1)' : 'rgba(107,114,128,0.1)',
                      color: camp.status === 'sent' ? 'var(--success)' : camp.status === 'sending' ? '#3b82f6' : 'var(--text-muted)'
                    }}>
                      {camp.status.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    <strong>Subject:</strong> {camp.subject}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Target List: <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{camp.list?.name || 'Unassigned'}</span>
                    {camp.sentAt && ` · Dispatched: ${new Date(camp.sentAt).toLocaleString()}`}
                  </div>
                </div>

                <div>
                  {camp.status === 'draft' && (
                    <button 
                      className="btn-primary" 
                      style={{ fontSize: '0.72rem', padding: '0.35rem 0.75rem' }} 
                      disabled={sendingId === camp.id}
                      onClick={() => handleSendCampaign(camp.id)}
                    >
                      {sendingId === camp.id ? 'Sending...' : '🚀 Dispatch Now'}
                    </button>
                  )}
                  {camp.status === 'sent' && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--success)', fontWeight: 'bold' }}>✓ Completed</span>
                  )}
                  {camp.status === 'sending' && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 'bold' }}>⚡ Sending...</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No campaigns set up yet. Click New Campaign to create your first newsletter!</div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', width: '600px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-h1)' }}>Draft New Email Campaign</h3>
            <form onSubmit={handleCreateCampaign} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 600 }}>Campaign Name *</label>
                <input 
                  type="text" 
                  value={newCampaign.name} 
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, name: e.target.value }))}
                  required
                  placeholder="e.g. July Health Newsletter"
                  style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 600 }}>Email Subject *</label>
                <input 
                  type="text" 
                  value={newCampaign.subject} 
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, subject: e.target.value }))}
                  required
                  placeholder="e.g. 5 Easy Habits for Better Heart Health"
                  style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 600 }}>Target Subscriber List</label>
                <select 
                  value={newCampaign.listId} 
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, listId: e.target.value }))}
                  style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                >
                  <option value="">Choose List...</option>
                  {lists.map(l => (
                    <option key={l.id} value={l.id}>{l.name} ({l._count?.subscribers || 0} sub)</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 600 }}>Email HTML Content (Body) *</label>
                <textarea 
                  value={newCampaign.body} 
                  onChange={(e) => setNewCampaign(prev => ({ ...prev, body: e.target.value }))}
                  required
                  placeholder="Write your newsletter HTML here..."
                  style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', height: '180px', fontFamily: 'monospace', fontSize: '0.75rem' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem' }} onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem' }}>Save Campaign</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
