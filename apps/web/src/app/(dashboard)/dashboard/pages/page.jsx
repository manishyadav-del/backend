'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import WebsiteAssignmentTab from '@/components/WebsiteAssignmentTab.jsx';

export default function PagesPage() {
  const [activeTab, setActiveTab] = useState('list'); // list, assignments
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
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-h1)', margin: 0 }}>Pages</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Manage frontend content pages, edit blocks, and assign content layouts to websites.
          </p>
        </div>
        {activeTab === 'list' && (
          <Link href="/dashboard/pages/new" className="btn-primary">+ New Page</Link>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', marginBottom: '1.5rem', gap: '1.5rem' }}>
        <button
          onClick={() => setActiveTab('list')}
          style={{
            background: 'transparent',
            border: 'none',
            padding: '0.75rem 0.25rem',
            color: activeTab === 'list' ? 'var(--primary)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'list' ? 700 : 500,
            fontSize: '0.9rem',
            cursor: 'pointer',
            borderBottom: activeTab === 'list' ? '2px solid var(--primary)' : '2px solid transparent',
            transition: 'var(--transition)'
          }}
        >
          Pages List
        </button>
        <button
          onClick={() => setActiveTab('assignments')}
          style={{
            background: 'transparent',
            border: 'none',
            padding: '0.75rem 0.25rem',
            color: activeTab === 'assignments' ? 'var(--primary)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'assignments' ? 700 : 500,
            fontSize: '0.9rem',
            cursor: 'pointer',
            borderBottom: activeTab === 'assignments' ? '2px solid var(--primary)' : '2px solid transparent',
            transition: 'var(--transition)'
          }}
        >
          Website Assignment
        </button>
      </div>

      {activeTab === 'list' && (
        <>
          {loading ? (
            <div className="loading">Loading pages...</div>
          ) : (
            <div className="pages-list">
              {pages.length === 0 ? (
                <div className="empty-state">
                  <p>No pages yet. Create your first page to get started.</p>
                </div>
              ) : (
                <div className="data-table-container">
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
                </div>
              )}
            </div>
          )}
        </>
      )}

      {activeTab === 'assignments' && (
        <WebsiteAssignmentTab moduleKey="content" />
      )}
    </div>
  );
}