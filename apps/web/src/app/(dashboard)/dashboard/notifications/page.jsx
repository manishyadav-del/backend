'use client';

import { useEffect, useState } from 'react';
import { notificationsApi } from '@/lib/api.js';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      await loadNotifications();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this notification?')) return;
    try {
      await notificationsApi.delete(id);
      await loadNotifications();
    } catch (err) {
      setError(err.message);
    }
  };

  const getTypeIcon = (type) => {
    const icons = {
      lead: '💼',
      form: '📋',
      blog: '📝',
      system: '🔔',
    };
    return icons[type] || '🔔';
  };

  const getTimeAgo = (dateStr) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return diffMins + ' min ago';
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return diffHours + ' hour' + (diffHours > 1 ? 's' : '') + ' ago';
    const diffDays = Math.floor(diffHours / 24);
    return diffDays + ' day' + (diffDays > 1 ? 's' : '') + ' ago';
  };

  return (
    <div className="notifications-page">
      <div className="page-header">
        <h1>Notifications</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading">Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div className="empty-state">
          <p>No notifications yet.</p>
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map(notif => (
            <div key={notif.id} className={'notification-card ' + (notif.isRead ? 'read' : 'unread')}>
              <div className="notif-icon">{getTypeIcon(notif.type)}</div>
              <div className="notif-content">
                <div className="notif-title">{notif.title}</div>
                {notif.message && <div className="notif-message">{notif.message}</div>}
                <div className="notif-time">{getTimeAgo(notif.createdAt)}</div>
              </div>
              <div className="notif-actions">
                {!notif.isRead && (
                  <button onClick={() => handleMarkRead(notif.id)} className="btn-sm">Mark Read</button>
                )}
                <button onClick={() => handleDelete(notif.id)} className="btn-sm btn-danger">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}