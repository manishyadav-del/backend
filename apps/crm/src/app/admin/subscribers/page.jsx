'use client';

import { useEffect, useState, useCallback } from 'react';

const LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
};

export default function SubscribersPage() {
  const [subscribers, setSubscribers] = useState([]);
  const [lists, setLists] = useState([]);
  const [loadingState, setLoadingState] = useState(LOADING_STATES.LOADING);
  const [error, setError] = useState(null);

  // Tabs: 'subscribers' or 'lists'
  const [activeTab, setActiveTab] = useState('subscribers');

  // Modals & Forms
  const [showAddSubModal, setShowAddSubModal] = useState(false);
  const [showAddListModal, setShowAddListModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const [newSub, setNewSub] = useState({ email: '', name: '', tags: '', listIds: [] });
  const [newList, setNewList] = useState({ name: '', description: '' });
  const [importText, setImportText] = useState(''); // Email, Name list

  const [subscribing, setSubscribing] = useState(false);

  const projectId = 'demo';

  const fetchData = useCallback(async () => {
    try {
      setLoadingState(LOADING_STATES.LOADING);
      const [subsRes, listsRes] = await Promise.all([
        fetch(`/api/subscribers?projectId=${projectId}`),
        fetch(`/api/subscriber-lists?projectId=${projectId}`)
      ]);

      if (!subsRes.ok || !listsRes.ok) throw new Error('Failed to fetch subscribers or lists');

      const subsData = await subsRes.json();
      const listsData = await listsRes.json();

      if (subsData.success && listsData.success) {
        setSubscribers(subsData.subscribers || []);
        setLists(listsData.lists || []);
        setLoadingState(LOADING_STATES.SUCCESS);
      } else {
        throw new Error(subsData.error || listsData.error || 'Failed to parse subscribers data');
      }
    } catch (err) {
      setError(err.message);
      setLoadingState(LOADING_STATES.ERROR);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddSubscriber = async (e) => {
    e.preventDefault();
    if (!newSub.email) return;

    setSubscribing(true);
    try {
      const res = await fetch('/api/subscribers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          email: newSub.email,
          name: newSub.name,
          tags: newSub.tags,
        })
      });

      const data = await res.json();
      if (data.success) {
        // If list IDs were selected, associate subscriber with lists
        if (newSub.listIds.length > 0) {
          await fetch(`/api/subscribers/${data.subscriber.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              listIds: newSub.listIds
            })
          });
        }
        setShowAddSubModal(false);
        setNewSub({ email: '', name: '', tags: '', listIds: [] });
        fetchData();
      } else {
        alert(data.error || 'Failed to add subscriber');
      }
    } catch {
      alert('Error creating subscriber');
    } finally {
      setSubscribing(false);
    }
  };

  const handleAddList = async (e) => {
    e.preventDefault();
    if (!newList.name) return;

    try {
      const res = await fetch('/api/subscriber-lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          name: newList.name,
          description: newList.description
        })
      });

      const data = await res.json();
      if (data.success) {
        setShowAddListModal(false);
        setNewList({ name: '', description: '' });
        fetchData();
      } else {
        alert(data.error || 'Failed to create list');
      }
    } catch {
      alert('Error creating list');
    }
  };

  const handleImportSubscribers = async (e) => {
    e.preventDefault();
    if (!importText) return;

    // Parse email list (comma-separated or line-separated)
    const lines = importText.split(/[\n,]+/).map(line => line.trim()).filter(Boolean);
    let imported = 0;

    for (const line of lines) {
      // Basic match for email, or "Name <email>" format
      let email = '';
      let name = '';

      if (line.includes('<') && line.includes('>')) {
        const parts = line.split('<');
        name = parts[0].trim();
        email = parts[1].replace('>', '').trim();
      } else {
        email = line;
      }

      if (email.includes('@')) {
        try {
          await fetch('/api/subscribers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectId, email, name })
          });
          imported++;
        } catch (err) {
          console.error('Failed to import line: ' + line, err);
        }
      }
    }

    alert(`Successfully processed ${imported} subscriber profiles!`);
    setShowImportModal(false);
    setImportText('');
    fetchData();
  };

  const handleDeleteSubscriber = async (id) => {
    if (!confirm('Are you sure you want to delete this subscriber?')) return;

    try {
      const res = await fetch(`/api/subscribers/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        alert(data.error || 'Failed to delete subscriber');
      }
    } catch {
      alert('Connection error deleting subscriber');
    }
  };

  if (loadingState === LOADING_STATES.LOADING) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading subscriber profiles...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-h1)', margin: 0 }}>Subscribers & Audience</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>Manage lists, subscriber profiles, segmentation tags, and CSV lists.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }} onClick={() => setShowImportModal(true)}>
            📥 Bulk Import
          </button>
          <button className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }} onClick={() => activeTab === 'subscribers' ? setShowAddSubModal(true) : setShowAddListModal(true)}>
            ➕ Create {activeTab === 'subscribers' ? 'Subscriber' : 'List'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', gap: '1.5rem' }}>
        <button 
          onClick={() => setActiveTab('subscribers')} 
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === 'subscribers' ? 'var(--primary)' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            paddingBottom: '0.5rem',
            borderBottom: activeTab === 'subscribers' ? '2px solid var(--primary)' : '2px solid transparent'
          }}
        >
          👤 All Subscribers ({subscribers.length})
        </button>
        <button 
          onClick={() => setActiveTab('lists')} 
          style={{
            background: 'none',
            border: 'none',
            color: activeTab === 'lists' ? 'var(--primary)' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            paddingBottom: '0.5rem',
            borderBottom: activeTab === 'lists' ? '2px solid var(--primary)' : '2px solid transparent'
          }}
        >
          📂 Lists & Segments ({lists.length})
        </button>
      </div>

      {/* Content */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
        {activeTab === 'subscribers' ? (
          subscribers.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.5rem' }}>Name</th>
                    <th style={{ padding: '0.5rem' }}>Email Address</th>
                    <th style={{ padding: '0.5rem' }}>Mailing Lists</th>
                    <th style={{ padding: '0.5rem' }}>Status</th>
                    <th style={{ padding: '0.5rem' }}>Tags</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map((sub) => (
                    <tr key={sub.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: 'bold' }}>{sub.name || '—'}</td>
                      <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-primary)' }}>{sub.email}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        {sub.lists && sub.lists.length > 0 ? (
                          <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                            {sub.lists.map(m => (
                              <span key={m.id} style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', padding: '0.1rem 0.35rem', borderRadius: '4px', fontSize: '0.68rem' }}>
                                {m.list?.name}
                              </span>
                            ))}
                          </div>
                        ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>No list</span>}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: 'bold',
                          padding: '0.15rem 0.4rem',
                          borderRadius: '4px',
                          background: sub.status === 'active' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                          color: sub.status === 'active' ? 'var(--success)' : 'var(--danger)'
                        }}>
                          {sub.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        {sub.tags ? (
                          <div style={{ display: 'flex', gap: '0.25rem' }}>
                            {sub.tags.split(',').map(tag => (
                              <span key={tag} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', padding: '0.1rem 0.35rem', borderRadius: '4px', fontSize: '0.68rem' }}>{tag.trim()}</span>
                            ))}
                          </div>
                        ) : '—'}
                      </td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>
                        <button style={{ background: 'none', border: 'none', color: 'var(--danger)', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.75rem' }} onClick={() => handleDeleteSubscriber(sub.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No subscribers found. Click Create Subscriber to add one.</div>
          )
        ) : (
          lists.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {lists.map(list => (
                <div key={list.id} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', padding: '1.25rem', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-h1)', fontWeight: 'bold' }}>{list.name}</h3>
                    <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', fontWeight: 'bold', borderRadius: '4px' }}>
                      {list._count?.subscribers || 0} PROFILES
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{list.description || 'No description provided'}</p>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No subscriber segments found. Click Create List to provision one.</div>
          )
        )}
      </div>

      {/* Add Subscriber Modal */}
      {showAddSubModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', width: '420px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-h1)' }}>Add Subscriber Profile</h3>
            <form onSubmit={handleAddSubscriber} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 600 }}>Email Address *</label>
                <input 
                  type="email" 
                  value={newSub.email} 
                  onChange={(e) => setNewSub(prev => ({ ...prev, email: e.target.value }))}
                  required
                  style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 600 }}>Name</label>
                <input 
                  type="text" 
                  value={newSub.name} 
                  onChange={(e) => setNewSub(prev => ({ ...prev, name: e.target.value }))}
                  style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 600 }}>Tags (comma-separated)</label>
                <input 
                  type="text" 
                  value={newSub.tags} 
                  onChange={(e) => setNewSub(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="newsletter, patient-leads"
                  style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 600 }}>Select Mailing List</label>
                <select 
                  multiple
                  value={newSub.listIds}
                  onChange={(e) => setNewSub(prev => ({ ...prev, listIds: Array.from(e.target.selectedOptions, option => option.value) }))}
                  style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', height: '80px' }}
                >
                  {lists.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem' }} onClick={() => setShowAddSubModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem' }} disabled={subscribing}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add List Modal */}
      {showAddListModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', width: '400px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-h1)' }}>Create Mailing List</h3>
            <form onSubmit={handleAddList} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 600 }}>List Name *</label>
                <input 
                  type="text" 
                  value={newList.name} 
                  onChange={(e) => setNewList(prev => ({ ...prev, name: e.target.value }))}
                  required
                  placeholder="e.g. Weekly Health Tips"
                  style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 600 }}>Description</label>
                <textarea 
                  value={newList.description} 
                  onChange={(e) => setNewList(prev => ({ ...prev, description: e.target.value }))}
                  style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', height: '60px' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem' }} onClick={() => setShowAddListModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem' }}>Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showImportModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', width: '500px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-h1)' }}>Bulk Import Subscriber Profiles</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', margin: 0 }}>Paste your email list below. Support formatting: one email per line, or <code>Name &lt;email&gt;</code> format.</p>
            <form onSubmit={handleImportSubscribers} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <textarea 
                value={importText} 
                onChange={(e) => setImportText(e.target.value)}
                placeholder={`john@example.com\nJane Doe <jane@example.com>\nrobert@example.com`}
                required
                style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', height: '180px', fontFamily: 'monospace', fontSize: '0.75rem' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem' }} onClick={() => setShowImportModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem' }}>Start Import</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
