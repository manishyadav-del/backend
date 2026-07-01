'use client';

import { useEffect, useState, useCallback } from 'react';

const LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
};

export default function PushNotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loadingState, setLoadingState] = useState(LOADING_STATES.LOADING);
  const [error, setError] = useState(null);

  // Modals & composing state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [dispatchingId, setDispatchingId] = useState(null);

  const [newPush, setNewPush] = useState({
    title: '',
    message: '',
    url: '',
    scheduledAt: ''
  });

  const projectId = 'demo';

  const fetchPushNotifications = useCallback(async () => {
    try {
      setLoadingState(LOADING_STATES.LOADING);
      const res = await fetch(`/api/push?projectId=${projectId}`);
      if (!res.ok) throw new Error('Failed to load push notifications');
      
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications || []);
        setLoadingState(LOADING_STATES.SUCCESS);
      } else {
        throw new Error(data.error || 'Failed to parse push data');
      }
    } catch (err) {
      setError(err.message);
      setLoadingState(LOADING_STATES.ERROR);
    }
  }, []);

  useEffect(() => {
    fetchPushNotifications();
  }, [fetchPushNotifications]);

  const handleCreatePush = async (e) => {
    e.preventDefault();
    if (!newPush.title || !newPush.message) return;

    try {
      const res = await fetch('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, ...newPush })
      });

      const data = await res.json();
      if (data.success) {
        setShowCreateModal(false);
        setNewPush({ title: '', message: '', url: '', scheduledAt: '' });
        fetchPushNotifications();
      } else {
        alert(data.error || 'Failed to draft push notification');
      }
    } catch {
      alert('Error creating push notification');
    }
  };

  const handleSendPush = async (notificationId) => {
    if (!confirm('Are you sure you want to broadcast this push notification to all subscribed devices immediately?')) return;

    setDispatchingId(notificationId);
    try {
      const res = await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId })
      });

      const data = await res.json();
      if (data.success) {
        alert(`Successfully sent! Recipients: ${data.recipients || 0}`);
        fetchPushNotifications();
      } else {
        alert(data.error || 'Failed to dispatch push notification via OneSignal');
      }
    } catch {
      alert('Network error communicating with OneSignal dispatcher');
    } finally {
      setDispatchingId(null);
    }
  };

  if (loadingState === LOADING_STATES.LOADING) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading push campaigns...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-h1)', margin: 0 }}>Push Notifications</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>Manage instant updates and browser notifications pushed via OneSignal.</p>
        </div>
        <button className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }} onClick={() => setShowCreateModal(true)}>
          ➕ New Push Notification
        </button>
      </div>

      {/* Grid of notifications */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
        {notifications.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {notifications.map(push => (
              <div key={push.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <h3 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-h1)', fontWeight: 'bold' }}>{push.title}</h3>
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: 'bold',
                      padding: '0.1rem 0.35rem',
                      borderRadius: '4px',
                      background: push.status === 'sent' ? 'rgba(16,185,129,0.1)' : push.status === 'failed' ? 'rgba(239,68,68,0.1)' : 'rgba(107,114,128,0.1)',
                      color: push.status === 'sent' ? 'var(--success)' : push.status === 'failed' ? 'var(--danger)' : 'var(--text-muted)'
                    }}>
                      {push.status.toUpperCase()}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{push.message}</p>
                  
                  {push.url && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--primary)', marginTop: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      Redirect: <a href={push.url} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline', color: 'inherit' }}>{push.url}</a>
                    </div>
                  )}

                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    {push.sentAt ? `Broad-casted: ${new Date(push.sentAt).toLocaleString()} · Audience: ${push.sentCount} devices` : 'Status: Draft / Scheduled'}
                  </div>
                </div>

                <div style={{ marginLeft: '1rem' }}>
                  {push.status === 'draft' && (
                    <button 
                      className="btn-primary" 
                      style={{ fontSize: '0.72rem', padding: '0.35rem 0.75rem' }} 
                      disabled={dispatchingId === push.id}
                      onClick={() => handleSendPush(push.id)}
                    >
                      {dispatchingId === push.id ? 'Sending...' : '🔔 Broadcast Now'}
                    </button>
                  )}
                  {push.status === 'sent' && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--success)', fontWeight: 'bold' }}>✓ Broadcasted</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No push campaigns sent yet. Click New Push Notification above to start drafting.</div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', width: '480px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-h1)' }}>Compose Push Notification</h3>
            <form onSubmit={handleCreatePush} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 600 }}>Heading Title *</label>
                <input 
                  type="text" 
                  value={newPush.title} 
                  onChange={(e) => setNewPush(prev => ({ ...prev, title: e.target.value }))}
                  required
                  placeholder="e.g. New Health Tips Released!"
                  style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 600 }}>Message Content *</label>
                <textarea 
                  value={newPush.message} 
                  onChange={(e) => setNewPush(prev => ({ ...prev, message: e.target.value }))}
                  required
                  placeholder="e.g. Learn how to optimize your sleep and habits in our latest medical bulletin."
                  style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', height: '60px' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 600 }}>Destination URL (Optional redirection)</label>
                <input 
                  type="url" 
                  value={newPush.url} 
                  onChange={(e) => setNewPush(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="e.g. https://ahealthplace.com/blogs/sleep"
                  style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem' }} onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem' }}>Save Draft</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
