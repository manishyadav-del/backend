'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function PagesPage() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/pages?projectId=demo')
      .then(r => r.json())
      .then(data => {
        setPages(data.pages || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="pages-page">
      <div className="page-header">
        <h1>Pages</h1>
        <Link href="/dashboard/pages/new" className="btn-primary">+ New Page</Link>
      </div>

      {loading ? (
        <div className="loading">Loading pages...</div>
      ) : (
        <div className="pages-list">
          {pages.length === 0 ? (
            <div className="empty-state">
              <p>No pages yet. Create your first page to get started.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Slug</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pages.map(page => (
                  <tr key={page.id}>
                    <td>{page.title}</td>
                    <td><code>{page.slug}</code></td>
                    <td>
                      <span className={`badge badge-${page.status}`}>{page.status}</span>
                    </td>
                    <td>{new Date(page.updatedAt).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Link href={`/dashboard/pages/${page.id}/edit`} className="btn-sm">Edit</Link>
                        <Link href={`/dashboard/pages/${page.id}/versions`} className="btn-sm">Versions</Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}