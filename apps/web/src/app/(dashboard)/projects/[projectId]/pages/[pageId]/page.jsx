'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function PageEditor({ params }) {
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const { projectId, pageId } = params;

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetch(`/api/pages?projectId=${projectId}`)
      .then(res => res.json())
      .then(data => {
        const found = data.pages?.find(p => p.id === pageId);
        if (found) setPage(found);
        setLoading(false);
      });
  }, [projectId, pageId]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      let schemaParsed = page.jsonLdSchema;
      if (typeof page.jsonLdSchema === 'string') {
        schemaParsed = JSON.parse(page.jsonLdSchema);
      }

      const payload = {
        ...page,
        jsonLdSchema: schemaParsed
      };

      const res = await fetch(`/api/pages-by-id/${pageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess('Page saved successfully!');
      } else {
        setError(data.error || 'Failed to save page');
      }
    } catch (err) {
      setError('Invalid JSON or network error.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading editor...</div>;
  if (!page) return <div>Page not found</div>;

  return (
    <div className="page-editor">
      <div className="breadcrumbs">
        <Link href={`/projects/${projectId}/pages`}>&larr; Back to Pages</Link>
      </div>
      
      <div className="header-actions">
        <div>
          <h1>Editing: {page.slug}</h1>
          <p>Status: {page.status}</p>
        </div>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message" style={{color: 'green', marginBottom: '1rem'}}>{success}</div>}

      <div className="editor-grid">
        <div className="main-panel card">
          <h2>Content Blocks</h2>
          <p>Visual block editor will go here.</p>
        </div>
        
        <div className="side-panel">
          <div className="card">
            <h3>SEO Settings</h3>
            <div className="form-group">
              <label>Meta Title</label>
              <input 
                type="text" 
                value={page.metaTitle || ''} 
                onChange={(e) => setPage({...page, metaTitle: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Meta Description</label>
              <textarea 
                value={page.metaDesc || ''}
                onChange={(e) => setPage({...page, metaDesc: e.target.value})}
              ></textarea>
            </div>
          </div>
          
          <div className="card">
            <h3>Structured Data (JSON-LD)</h3>
            <div className="form-group">
              <label>Raw Schema</label>
              <textarea 
                className="code-font" 
                rows="5" 
                value={typeof page.jsonLdSchema === 'string' ? page.jsonLdSchema : JSON.stringify(page.jsonLdSchema || {}, null, 2)}
                onChange={(e) => setPage({...page, jsonLdSchema: e.target.value})}
              ></textarea>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
