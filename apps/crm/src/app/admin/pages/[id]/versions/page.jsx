'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function PageVersionsPage() {
  const params = useParams();
  const pageId = params.id;
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rollbacking, setRollbacking] = useState(false);

  const projectId = 'demo';

  useEffect(() => {
    if (pageId) {
      loadVersions();
    }
  }, [pageId]);

  async function loadVersions() {
    try {
      const res = await fetch(`/api/pages/${pageId}/versions?projectId=${projectId}`);
      const data = await res.json();
      setVersions(data.versions || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load versions:', error);
      setLoading(false);
    }
  }

  const handleRollback = async (versionId) => {
    if (!confirm('Are you sure you want to rollback to this version? A backup of the current state will be created.')) {
      return;
    }

    setRollbacking(true);
    try {
      const res = await fetch(`/api/pages/${pageId}/versions/${versionId}/rollback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          changeLog: `Rolled back to version ${versionId}`
        })
      });

      if (res.ok) {
        alert('Successfully rolled back to selected version');
        loadVersions();
      } else {
        alert('Failed to rollback');
      }
    } catch (error) {
      console.error('Rollback error:', error);
      alert('Failed to rollback');
    } finally {
      setRollbacking(false);
    }
  };

  const handleViewVersion = async (versionId) => {
    try {
      const res = await fetch(`/api/pages/${pageId}/versions/${versionId}?projectId=${projectId}`);
      const data = await res.json();
      const version = data.version;
      
      // Show version details in a simple alert for now
      alert(`Version ${version.version}\n\nTitle: ${version.title}\nSlug: ${version.slug}\nChange Log: ${version.changeLog || 'No description'}\nCreated: ${new Date(version.createdAt).toLocaleString()}`);
    } catch (error) {
      console.error('Failed to load version:', error);
    }
  };

  if (loading) {
    return <div className="loading">Loading version history...</div>;
  }

  return (
    <div className="versions-page">
      <div className="page-header">
        <div>
          <h1>Version History</h1>
          <p className="page-subtitle">View and manage page versions</p>
        </div>
        <a href={`/admin/pages/${pageId}/edit`} className="btn-primary">
          ← Back to Editor
        </a>
      </div>

      {versions.length === 0 ? (
        <div className="empty-state">
          <p>No version history yet. Versions are created automatically when you publish or make significant changes.</p>
        </div>
      ) : (
        <div className="versions-list">
          <div className="versions-header">
            <div className="version-col-version">Version</div>
            <div className="version-col-title">Title</div>
            <div className="version-col-changes">Changes</div>
            <div className="version-col-date">Date</div>
            <div className="version-col-actions">Actions</div>
          </div>

          {versions.map((version, index) => (
            <div key={version.id} className={`version-item ${index === 0 ? 'latest' : ''}`}>
              <div className="version-col-version">
                <span className="version-badge">v{version.version}</span>
                {index === 0 && <span className="latest-badge">Latest</span>}
              </div>
              
              <div className="version-col-title">
                <strong>{version.title}</strong>
                <br />
                <code className="version-slug">{version.slug}</code>
              </div>
              
              <div className="version-col-changes">
                {version.changeLog || 'No description'}
              </div>
              
              <div className="version-col-date">
                {new Date(version.createdAt).toLocaleDateString()}
                <br />
                <span className="version-time">
                  {new Date(version.createdAt).toLocaleTimeString()}
                </span>
              </div>
              
              <div className="version-col-actions">
                <button
                  onClick={() => handleViewVersion(version.id)}
                  className="btn-sm btn-secondary"
                >
                  View
                </button>
                {index !== 0 && (
                  <button
                    onClick={() => handleRollback(version.id)}
                    disabled={rollbacking}
                    className="btn-sm btn-primary"
                  >
                    {rollbacking ? 'Rolling back...' : 'Rollback'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .versions-page {
          padding: 24px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 32px;
          padding-bottom: 24px;
          border-bottom: 1px solid #e5e7eb;
        }

        .page-header h1 {
          margin: 0 0 8px;
          font-size: 28px;
          font-weight: 700;
        }

        .page-subtitle {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .empty-state p {
          color: #6b7280;
          font-size: 16px;
        }

        .versions-list {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          overflow: hidden;
        }

        .versions-header {
          display: grid;
          grid-template-columns: 120px 1fr 2fr 150px 200px;
          gap: 16px;
          padding: 16px 24px;
          background: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
          font-weight: 600;
          font-size: 13px;
          color: #6b7280;
          text-transform: uppercase;
        }

        .version-item {
          display: grid;
          grid-template-columns: 120px 1fr 2fr 150px 200px;
          gap: 16px;
          padding: 20px 24px;
          border-bottom: 1px solid #e5e7eb;
          align-items: center;
        }

        .version-item:last-child {
          border-bottom: none;
        }

        .version-item.latest {
          background: #f0f9ff;
        }

        .version-badge {
          display: inline-block;
          padding: 4px 10px;
          background: #3b82f6;
          color: white;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }

        .latest-badge {
          display: inline-block;
          margin-left: 8px;
          padding: 2px 8px;
          background: #10b981;
          color: white;
          border-radius: 10px;
          font-size: 11px;
          font-weight: 500;
        }

        .version-slug {
          color: #6b7280;
          font-size: 12px;
        }

        .version-time {
          color: #9ca3af;
          font-size: 12px;
        }

        .version-col-actions {
          display: flex;
          gap: 8px;
        }

        .btn-sm {
          padding: 6px 12px;
          font-size: 13px;
          border-radius: 6px;
          text-decoration: none;
          display: inline-block;
          border: 1px solid #d1d5db;
          background: white;
          color: #374151;
          cursor: pointer;
        }

        .btn-sm:hover {
          background: #f3f4f6;
        }

        .btn-sm.btn-primary {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        .btn-sm.btn-primary:hover {
          background: #2563eb;
        }

        .btn-sm.btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .loading {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          font-size: 16px;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
}
