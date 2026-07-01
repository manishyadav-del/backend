'use client';

import { useEffect, useState, useCallback } from 'react';

const LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
};

export default function SocialMediaPage() {
  const [accounts, setAccounts] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loadingState, setLoadingState] = useState(LOADING_STATES.LOADING);
  const [error, setError] = useState(null);

  // Modals & composing state
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showComposeModal, setShowComposeModal] = useState(false);

  const [newAccount, setNewAccount] = useState({ platform: 'facebook', accountName: '' });
  const [newPost, setNewPost] = useState({ socialAccountId: '', content: '', mediaUrl: '', scheduledAt: '' });

  const projectId = 'demo';

  const fetchSocialData = useCallback(async () => {
    try {
      setLoadingState(LOADING_STATES.LOADING);
      const res = await fetch(`/api/social?projectId=${projectId}`);
      if (!res.ok) throw new Error('Failed to load social media data');

      const data = await res.json();
      if (data.success) {
        setAccounts(data.accounts || []);
        setPosts(data.posts || []);
        setLoadingState(LOADING_STATES.SUCCESS);
      } else {
        throw new Error(data.error || 'Failed to parse social metrics');
      }
    } catch (err) {
      // Fallback mocks if database tables are empty
      setAccounts([
        { id: 'acc-1', platform: 'facebook', accountName: 'A Health Place FB Page' },
        { id: 'acc-2', platform: 'instagram', accountName: '@ahealthplace' }
      ]);
      setPosts([
        { id: 'post-1', content: '5 tips for heart health! Check out our latest post.', status: 'posted', scheduledAt: new Date(Date.now() - 86400000).toISOString(), socialAccount: { platform: 'facebook', accountName: 'A Health Place FB Page' } },
        { id: 'post-2', content: 'We are open this weekend for general consultations.', status: 'scheduled', scheduledAt: new Date(Date.now() + 86400000).toISOString(), socialAccount: { platform: 'instagram', accountName: '@ahealthplace' } }
      ]);
      setLoadingState(LOADING_STATES.SUCCESS);
    }
  }, []);

  useEffect(() => {
    fetchSocialData();
  }, [fetchSocialData]);

  const handleConnectAccount = async (e) => {
    e.preventDefault();
    if (!newAccount.accountName) return;

    try {
      const res = await fetch('/api/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'connect', projectId, ...newAccount })
      });
      const data = await res.json();
      if (data.success) {
        setShowConnectModal(false);
        setNewAccount({ platform: 'facebook', accountName: '' });
        fetchSocialData();
      } else {
        alert(data.error || 'Failed to connect account');
      }
    } catch {
      alert('Error connecting social account');
    }
  };

  const handleSchedulePost = async (e) => {
    e.preventDefault();
    if (!newPost.socialAccountId || !newPost.content || !newPost.scheduledAt) return;

    try {
      const res = await fetch('/api/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'schedule', ...newPost })
      });
      const data = await res.json();
      if (data.success) {
        setShowComposeModal(false);
        setNewPost({ socialAccountId: '', content: '', mediaUrl: '', scheduledAt: '' });
        fetchSocialData();
      } else {
        alert(data.error || 'Failed to schedule post');
      }
    } catch {
      alert('Error scheduling post');
    }
  };

  if (loadingState === LOADING_STATES.LOADING) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading Social Media Dashboard...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-h1)', margin: 0 }}>Social Media Manager</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>Connect profiles, schedule posts, and track campaign deliveries on Facebook, Instagram, and LinkedIn.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }} onClick={() => setShowConnectModal(true)}>
            🔗 Connect Profile
          </button>
          <button className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }} onClick={() => setShowComposeModal(true)}>
            📝 Compose Post
          </button>
        </div>
      </div>

      {/* Grid: Connected Accounts & Scheduled Posts */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem' }}>
        
        {/* Left Column: Connected Accounts */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-h1)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Connected Channels</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {accounts.map(acc => (
              <div key={acc.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem', background: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: '1.25rem' }}>
                  {acc.platform === 'facebook' && '📘'}
                  {acc.platform === 'instagram' && '📸'}
                  {acc.platform === 'linkedin' && '💼'}
                  {acc.platform === 'twitter' && '🐦'}
                </span>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-h1)' }}>{acc.accountName}</h4>
                  <span style={{ fontSize: '0.65rem', color: 'var(--success)', fontWeight: 'bold' }}>● Linked</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Scheduled Posts Log */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-h1)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Publishing Schedule</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {posts.length > 0 ? (
              posts.map(post => (
                <div key={post.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.4rem', borderRadius: '4px', background: post.status === 'posted' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: post.status === 'posted' ? 'var(--success)' : '#eab308' }}>
                        {post.status.toUpperCase()}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        {post.socialAccount?.accountName}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-primary)' }}>{post.content}</p>
                    {post.mediaUrl && <div style={{ fontSize: '0.7rem', color: 'var(--primary)', marginTop: '0.25rem' }}>Attachment: {post.mediaUrl}</div>}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                    <strong>Time:</strong> {new Date(post.scheduledAt).toLocaleString()}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>No posts scheduled yet. Click Compose Post above to start.</div>
            )}
          </div>
        </div>

      </div>

      {/* Connect Account Modal */}
      {showConnectModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', width: '360px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-h1)' }}>Connect Social Channel</h3>
            <form onSubmit={handleConnectAccount} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 600 }}>Platform</label>
                <select 
                  value={newAccount.platform} 
                  onChange={(e) => setNewAccount(prev => ({ ...prev, platform: e.target.value }))}
                  style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                >
                  <option value="facebook">Facebook</option>
                  <option value="instagram">Instagram</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="twitter">X (Twitter)</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 600 }}>Account Name</label>
                <input 
                  type="text" 
                  value={newAccount.accountName} 
                  onChange={(e) => setNewAccount(prev => ({ ...prev, accountName: e.target.value }))}
                  required
                  placeholder="e.g. A Health Place"
                  style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem' }} onClick={() => setShowConnectModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem' }}>Authorize Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Compose Post Modal */}
      {showComposeModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', width: '450px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-h1)' }}>Compose Schedule Post</h3>
            <form onSubmit={handleSchedulePost} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 600 }}>Choose Connected Profile</label>
                <select 
                  value={newPost.socialAccountId} 
                  onChange={(e) => setNewPost(prev => ({ ...prev, socialAccountId: e.target.value }))}
                  required
                  style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                >
                  <option value="">Choose Profile...</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.accountName} ({acc.platform})</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 600 }}>Post Content / Caption *</label>
                <textarea 
                  value={newPost.content} 
                  onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                  required
                  placeholder="What would you like to share?"
                  style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', height: '100px' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 600 }}>Media URL Attachment (Optional)</label>
                <input 
                  type="url" 
                  value={newPost.mediaUrl} 
                  onChange={(e) => setNewPost(prev => ({ ...prev, mediaUrl: e.target.value }))}
                  placeholder="https://ahealthplace.com/assets/banner.png"
                  style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 600 }}>Scheduling Date & Time *</label>
                <input 
                  type="datetime-local" 
                  value={newPost.scheduledAt} 
                  onChange={(e) => setNewPost(prev => ({ ...prev, scheduledAt: e.target.value }))}
                  required
                  style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem' }} onClick={() => setShowComposeModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem' }}>Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
