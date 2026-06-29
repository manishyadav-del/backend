'use client';

import { useEffect, useState } from 'react';
import { backupApi } from '@/lib/api.js';

export default function BackupPage() {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);

  const projectId = 'demo';

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    try {
      setLoading(true);
      const data = await backupApi.getAll(projectId);
      setBackups(data.backups || []);
      setError(null);
    } catch (err) {
      setError('Failed to load backups');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    setCreating(true);
    setError(null);
    try {
      await backupApi.create({
        projectId,
        type: 'full',
        status: 'completed',
        size: 0,
      });
      await loadBackups();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this backup?')) return;
    try {
      await backupApi.delete(id);
      await loadBackups();
    } catch (err) {
      setError(err.message);
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '-';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="backup-page">
      <div className="page-header">
        <h1>Backup & Restore</h1>
        <button className="btn-primary" onClick={handleCreateBackup} disabled={creating}>
          {creating ? 'Creating...' : '+ Create Backup'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading">Loading backups...</div>
      ) : backups.length === 0 ? (
        <div className="empty-state">
          <p>No backups yet. Create your first backup to get started.</p>
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Size</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {backups.map(backup => (
              <tr key={backup.id}>
                <td><span className="badge">{backup.type}</span></td>
                <td>{formatSize(backup.size)}</td>
                <td><span className={'badge badge-' + backup.status}>{backup.status}</span></td>
                <td>{new Date(backup.createdAt).toLocaleString()}</td>
                <td>
                  <a href={`/api/backup/${backup.id}/download`} download className="btn-sm btn-secondary" style={{ marginRight: '0.5rem', display: 'inline-block', textDecoration: 'none', textAlign: 'center' }}>
                    Download
                  </a>
                  <button className="btn-sm btn-danger" onClick={() => handleDelete(backup.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}