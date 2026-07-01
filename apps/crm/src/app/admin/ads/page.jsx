'use client';

import { useEffect, useState, useCallback } from 'react';

const LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
};

export default function AdvertisementPage() {
  const [ads, setAds] = useState([]);
  const [loadingState, setLoadingState] = useState(LOADING_STATES.LOADING);
  const [error, setError] = useState(null);

  // Composing and modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAd, setNewAd] = useState({ name: '', type: 'custom_banner', slotId: '', imageUrl: '', targetUrl: '' });

  const projectId = 'demo';

  const fetchAdData = useCallback(async () => {
    try {
      setLoadingState(LOADING_STATES.LOADING);
      const res = await fetch(`/api/ads?projectId=${projectId}`);
      if (!res.ok) throw new Error('Failed to load advertisement settings');

      const data = await res.json();
      if (data.success) {
        setAds(data.ads || []);
        setLoadingState(LOADING_STATES.SUCCESS);
      } else {
        throw new Error(data.error || 'Failed to parse advertisements');
      }
    } catch (err) {
      // Fallback mocks
      setAds([
        { id: 'ad-1', name: 'Google AdSense Sidebar', type: 'adsense', slotId: 'ca-pub-1293812039', status: 'active', analytics: [{ type: 'impression' }, { type: 'impression' }] },
        { id: 'ad-2', name: 'Summer Health Promo Banner', type: 'custom_banner', imageUrl: 'https://ahealthplace.com/promo.png', targetUrl: 'https://ahealthplace.com/blogs/summer', status: 'active', analytics: [{ type: 'impression' }, { type: 'click' }] }
      ]);
      setLoadingState(LOADING_STATES.SUCCESS);
    }
  }, []);

  useEffect(() => {
    fetchAdData();
  }, [fetchAdData]);

  const handleCreateAd = async (e) => {
    e.preventDefault();
    if (!newAd.name || !newAd.type) return;

    try {
      const res = await fetch('/api/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', projectId, ...newAd })
      });
      const data = await res.json();
      if (data.success) {
        setShowCreateModal(false);
        setNewAd({ name: '', type: 'custom_banner', slotId: '', imageUrl: '', targetUrl: '' });
        fetchAdData();
      } else {
        alert(data.error || 'Failed to configure advertisement');
      }
    } catch {
      alert('Error creating advertisement');
    }
  };

  const calculateMetrics = (analytics = []) => {
    const impressions = analytics.filter(a => a.type === 'impression').length;
    const clicks = analytics.filter(a => a.type === 'click').length;
    const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) : '0.00';
    return { impressions, clicks, ctr };
  };

  if (loadingState === LOADING_STATES.LOADING) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading Advertisement Dashboard...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-h1)', margin: 0 }}>Advertisement Management</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>Manage Google AdSense scripts, upload promo banners, and track click-through rates.</p>
        </div>
        <button className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }} onClick={() => setShowCreateModal(true)}>
          ➕ Configure Ad Space
        </button>
      </div>

      {/* Ads List */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', color: 'var(--text-h1)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Active Ad Positions</h3>
        
        {ads.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {ads.map(ad => {
              const { impressions, clicks, ctr } = calculateMetrics(ad.analytics);
              return (
                <div key={ad.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-h1)', fontWeight: 'bold' }}>{ad.name}</h4>
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.1rem 0.35rem', borderRadius: '4px', background: ad.type === 'adsense' ? 'rgba(59,130,246,0.1)' : 'rgba(16,185,129,0.1)', color: ad.type === 'adsense' ? '#3b82f6' : 'var(--success)' }}>
                        {ad.type.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    {ad.type === 'adsense' ? (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}><strong>AdSense Slot:</strong> {ad.slotId}</div>
                    ) : (
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}><strong>Target Link:</strong> <a href={ad.targetUrl} target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>{ad.targetUrl}</a></div>
                    )}
                  </div>
                  
                  {/* Stats columns */}
                  <div style={{ display: 'flex', gap: '2rem', textAlign: 'right' }}>
                    <div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Impressions</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-h1)' }}>{impressions}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Clicks</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-h1)' }}>{clicks}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>CTR</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>{ctr}%</div>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>No ad positions configured yet.</div>
        )}
      </div>

      {/* Configure Ad Modal */}
      {showCreateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', width: '420px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-h1)' }}>Configure Ad Space</h3>
            <form onSubmit={handleCreateAd} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 600 }}>Ad Name *</label>
                <input 
                  type="text" 
                  value={newAd.name} 
                  onChange={(e) => setNewAd(prev => ({ ...prev, name: e.target.value }))}
                  required
                  placeholder="e.g. Header Leaderboard"
                  style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 600 }}>Type</label>
                <select 
                  value={newAd.type} 
                  onChange={(e) => setNewAd(prev => ({ ...prev, type: e.target.value }))}
                  style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                >
                  <option value="custom_banner">Custom Image Banner</option>
                  <option value="adsense">Google AdSense Code</option>
                </select>
              </div>
              {newAd.type === 'adsense' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.72rem', fontWeight: 600 }}>AdSense Slot / Pub ID *</label>
                  <input 
                    type="text" 
                    value={newAd.slotId} 
                    onChange={(e) => setNewAd(prev => ({ ...prev, slotId: e.target.value }))}
                    required
                    placeholder="e.g. ca-pub-98723498"
                    style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  />
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.72rem', fontWeight: 600 }}>Banner Image URL *</label>
                    <input 
                      type="url" 
                      value={newAd.imageUrl} 
                      onChange={(e) => setNewAd(prev => ({ ...prev, imageUrl: e.target.value }))}
                      required
                      placeholder="https://ahealthplace.com/assets/banner.png"
                      style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.72rem', fontWeight: 600 }}>Target Destination Link *</label>
                    <input 
                      type="url" 
                      value={newAd.targetUrl} 
                      onChange={(e) => setNewAd(prev => ({ ...prev, targetUrl: e.target.value }))}
                      required
                      placeholder="https://ahealthplace.com/blogs/news"
                      style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                    />
                  </div>
                </>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem' }} onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem' }}>Save Ad Space</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
