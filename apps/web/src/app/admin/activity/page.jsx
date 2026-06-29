'use client';

import { useEffect, useState } from 'react';

export default function ActivityPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetch(`/api/activity-logs?page=${page}&limit=20`)
      .then(r => r.json())
      .then(data => {
        setLogs(data.logs || []);
        setTotalPages(data.pagination?.pages || 1);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [page]);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  return (
    <div className="activity-page">
      <div className="page-header">
        <h1>Activity Log</h1>
      </div>

      {loading ? (
        <div className="loading">Loading activity...</div>
      ) : logs.length === 0 ? (
        <div className="empty-state">No activity logs found.</div>
      ) : (
        <div className="activity-list">
          {logs.map(log => (
            <div key={log.id} className="activity-item">
              <div className="activity-icon">📋</div>
              <div className="activity-content">
                <div className="activity-action">{log.action}</div>
                <div className="activity-entity">
                  {log.entity}{log.entityId ? ` #${log.entityId}` : ''}
                </div>
                {log.details && <div className="activity-details">{log.details}</div>}
                <div className="activity-user">
                  {log.user?.name || log.user?.email || 'Unknown user'}
                </div>
              </div>
              <div className="activity-time">{formatDate(log.createdAt)}</div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </button>
          <span>Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}