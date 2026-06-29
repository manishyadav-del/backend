'use client';

import { useEffect, useState } from 'react';
import { notificationsApi } from '@/lib/api.js';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actioning, setActioning] = useState(false);

  const projectId = 'demo';

  useEffect(() => {
    loadNotifications();
  }, []);

  async function loadNotifications() {
    try {
      setLoading(true);
      const data = await notificationsApi.getAll(projectId);
      setNotifications(data.notifications || []);
      setError(null);
    } catch (err) {
      setError('Failed to load notifications');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }

  const handleMarkRead = async (id) => {
    try {
      await notificationsApi.update(id, { isRead: true });
      // Update local state directly for speed
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const handleMarkAllRead = async () => {
    setActioning(true);
    try {
      const unreadList = notifications.filter(n => !n.isRead);
      await Promise.all(unreadList.map(n => notificationsApi.update(n.id, { isRead: true })));
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      setError('Failed to mark all as read');
    } finally {
      setActioning(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this notification?')) return;
    try {
      await notificationsApi.delete(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const getTypeStyle = (type) => {
    const styles = {
      lead: { icon: '💼', bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: 'rgba(16, 185, 129, 0.2)' },
      form: { icon: '📋', bg: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', border: 'rgba(139, 92, 246, 0.2)' },
      blog: { icon: '📝', bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.2)' },
      system: { icon: '🔔', bg: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9', border: 'rgba(14, 165, 233, 0.2)' },
    };
    return styles[type] || { icon: '🔔', bg: 'rgba(100, 116, 139, 0.1)', color: '#64748b', border: 'rgba(100, 116, 139, 0.2)' };
  };

  const getTimeAgo = (dateStr) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return diffMins + 'm ago';
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return diffHours + 'h ago';
    const diffDays = Math.floor(diffHours / 24);
    return diffDays + 'd ago';
  };

  // Filter list
  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'read') return n.isRead;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div style={{ padding: '1.5rem', background: 'var(--bg-base)', minHeight: '85vh' }}>
      
      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-h1)', margin: 0, letterSpacing: '-0.02em' }}>Notifications</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Stay updated with contact form submissions, content registry sync status, and system alerts.
          </p>
        </div>
        
        {unreadCount > 0 && (
          <button 
            onClick={handleMarkAllRead} 
            disabled={actioning}
            className="btn-sm" 
            style={{ padding: '0.5rem 1rem', background: 'var(--bg-card)', border: '1px solid var(--border-light)', color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer', transition: 'all 0.15s' }}
          >
            ✔️ Mark All Read
          </button>
        )}
      </div>

      {error && (
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.85rem' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Tabs / Filters bar */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
        {['all', 'unread', 'read'].map(type => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            style={{
              padding: '0.45rem 1rem',
              fontSize: '0.8rem',
              fontWeight: filter === type ? 'bold' : 'normal',
              background: filter === type ? 'var(--primary)' : 'transparent',
              color: filter === type ? '#ffffff' : 'var(--text-secondary)',
              border: 'none',
              borderRadius: '9999px',
              cursor: 'pointer',
              textTransform: 'capitalize',
              transition: 'all 0.2s'
            }}
          >
            {type} {type === 'unread' && unreadCount > 0 && `(${unreadCount})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
          <div className="loading" style={{ fontSize: '0.9rem' }}>Loading alerts log...</div>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-lg)',
          padding: '4rem 2rem',
          textAlign: 'center',
          color: 'var(--text-muted)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔔</div>
          <h3 style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--text-primary)', margin: '0 0 0.25rem' }}>All Clear!</h3>
          <p style={{ fontSize: '0.8rem', margin: 0 }}>No notifications found matching this status.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredNotifications.map(notif => {
            const typeInfo = getTypeStyle(notif.type);
            return (
              <div 
                key={notif.id} 
                style={{ 
                  background: notif.isRead ? 'rgba(255,255,255,0.01)' : 'var(--bg-card)', 
                  border: '1px solid ' + (notif.isRead ? 'var(--border-light)' : 'var(--border-strong)'),
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.25rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  transition: 'all 0.2s',
                  position: 'relative',
                  opacity: notif.isRead ? 0.75 : 1
                }}
              >
                {/* Visual Icon indicator */}
                <div style={{ 
                  background: typeInfo.bg, 
                  color: typeInfo.color,
                  border: `1px solid ${typeInfo.border}`,
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem',
                  flexShrink: 0
                }}>
                  {typeInfo.icon}
                </div>

                {/* Text Body */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <h4 style={{ 
                      fontSize: '0.875rem', 
                      fontWeight: notif.isRead ? 600 : 800, 
                      color: 'var(--text-primary)', 
                      margin: 0,
                      lineHeight: '1.2'
                    }}>
                      {notif.title}
                    </h4>
                    {!notif.isRead && (
                      <span style={{ 
                        background: '#0ea5e9', 
                        color: '#fff', 
                        fontSize: '0.65rem', 
                        fontWeight: 'bold', 
                        padding: '0.1rem 0.4rem', 
                        borderRadius: '9999px' 
                      }}>
                        NEW
                      </span>
                    )}
                  </div>
                  {notif.message && (
                    <p style={{ 
                      color: 'var(--text-secondary)', 
                      fontSize: '0.8rem', 
                      margin: '0.35rem 0 0', 
                      lineHeight: '1.4',
                      wordBreak: 'break-word'
                    }}>
                      {notif.message}
                    </p>
                  )}
                  
                  {/* Footer metadata */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.5rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    <span>⏱️</span>
                    <span>{getTimeAgo(notif.createdAt)}</span>
                    <span>•</span>
                    <span style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>{notif.type || 'system'}</span>
                  </div>
                </div>

                {/* Actions area */}
                <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', flexShrink: 0 }}>
                  {!notif.isRead && (
                    <button 
                      onClick={() => handleMarkRead(notif.id)} 
                      className="btn-sm"
                      style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: '4px' }}
                      title="Mark as Read"
                    >
                      ✔️ Read
                    </button>
                  )}
                  <button 
                    onClick={() => handleDelete(notif.id)} 
                    className="btn-sm btn-danger"
                    style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', cursor: 'pointer', borderRadius: '4px' }}
                    title="Delete Notification"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}