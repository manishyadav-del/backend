'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function PagesListPage({ params }) {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const { projectId } = params;

  useEffect(() => {
    fetch(`/api/pages?projectId=${projectId}`)
      .then(res => res.json())
      .then(data => {
        if (data.pages) setPages(data.pages);
        setLoading(false);
      });
  }, [projectId]);

  if (loading) return <div>Loading pages...</div>;

  return (
    <div className="pages-list">
      <div className="breadcrumbs">
        <Link href={`/projects/${projectId}`}>&larr; Back to Project</Link>
      </div>
      <h1>Pages</h1>
      <p>These pages are automatically synced from your frontend repository.</p>

      <table className="data-table">
        <thead>
          <tr>
            <th>Route / Slug</th>
            <th>Title</th>
            <th>Status</th>
            <th>Type</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {pages.map(page => (
            <tr key={page.id}>
              <td><code>{page.slug}</code></td>
              <td>{page.title}</td>
              <td><span className={`badge ${page.status.toLowerCase()}`}>{page.status}</span></td>
              <td>{page.isDynamic ? 'Dynamic' : 'Static'}</td>
              <td>
                <Link href={`/projects/${projectId}/pages/${page.id}`} className="btn-link">
                  Edit
                </Link>
              </td>
            </tr>
          ))}
          {pages.length === 0 && (
            <tr>
              <td colSpan="5" className="text-center">No pages found. Run the sync script on your frontend to populate this list.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
