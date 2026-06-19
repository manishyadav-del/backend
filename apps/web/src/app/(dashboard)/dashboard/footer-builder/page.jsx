'use client';

import { useEffect, useState, useCallback } from 'react';

const PROJECT_ID = 'default';

export default function FooterBuilderPage() {
  const [columns, setColumns] = useState([]);
  const [copyright, setCopyright] = useState('');
  const [socialLinks, setSocialLinks] = useState([]);
  const [showNewsletter, setShowNewsletter] = useState(true);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadFooter = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/global-settings/footer?projectId=${PROJECT_ID}`);
      const data = await res.json();
      if (data.success && data.data) {
        const config = data.data;
        // Parse columns, handle string array migration to label/href object if needed
        let parsedCols = config.columns || [];
        if (typeof parsedCols === 'number') {
          // Fallback if seeded as just a number of columns
          parsedCols = Array.from({ length: parsedCols }, (_, i) => ({
            title: `Column ${i + 1}`,
            links: [],
          }));
        } else {
          parsedCols = parsedCols.map(col => ({
            title: col.title || '',
            links: (col.links || []).map(link => {
              if (typeof link === 'string') {
                return { label: link, href: '#' };
              }
              return { label: link.label || '', href: link.href || '#' };
            })
          }));
        }

        setColumns(parsedCols);
        setCopyright(config.copyright || '');
        setSocialLinks(config.socialLinks || []);
        setShowNewsletter(config.showNewsletter ?? true);
      }
    } catch {
      setError('Failed to load footer settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFooter();
  }, [loadFooter]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/global-settings/footer', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: PROJECT_ID,
          columns,
          copyright,
          socialLinks,
          showNewsletter,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage('Footer settings saved successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setError(data.error || 'Failed to save settings');
      }
    } catch {
      setError('Connection error. Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  // Column functions
  const handleAddColumn = () => {
    if (columns.length >= 4) {
      setError('Maximum 4 footer columns allowed');
      setTimeout(() => setError(''), 3000);
      return;
    }
    setColumns([...columns, { title: 'New Column', links: [] }]);
  };

  const handleRemoveColumn = (colIndex) => {
    setColumns(columns.filter((_, i) => i !== colIndex));
  };

  const handleColumnTitleChange = (colIndex, value) => {
    setColumns(columns.map((col, i) => i === colIndex ? { ...col, title: value } : col));
  };

  // Link functions inside columns
  const handleAddLink = (colIndex) => {
    setColumns(columns.map((col, i) => {
      if (i === colIndex) {
        return {
          ...col,
          links: [...col.links, { label: '', href: '' }]
        };
      }
      return col;
    }));
  };

  const handleRemoveLink = (colIndex, linkIndex) => {
    setColumns(columns.map((col, i) => {
      if (i === colIndex) {
        return {
          ...col,
          links: col.links.filter((_, j) => j !== linkIndex)
        };
      }
      return col;
    }));
  };

  const handleLinkChange = (colIndex, linkIndex, field, value) => {
    setColumns(columns.map((col, i) => {
      if (i === colIndex) {
        const updatedLinks = col.links.map((link, j) => {
          if (j === linkIndex) {
            return { ...link, [field]: value };
          }
          return link;
        });
        return { ...col, links: updatedLinks };
      }
      return col;
    }));
  };

  // Social Links functions
  const handleAddSocial = () => {
    setSocialLinks([...socialLinks, { platform: 'twitter', url: '' }]);
  };

  const handleRemoveSocial = (index) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== index));
  };

  const handleSocialChange = (index, field, value) => {
    setSocialLinks(socialLinks.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  return (
    <div className="footer-builder-page">
      <form onSubmit={handleSave}>
        <div className="page-header">
          <h1>Footer Builder</h1>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Footer'}
          </button>
        </div>

        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div className="loading">Loading footer settings...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
            {/* Left Column: General & Socials */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="builder-form" style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: 'var(--text-h1)' }}>General Config</h2>
                
                <div className="form-group">
                  <label>Copyright Text</label>
                  <input 
                    type="text" 
                    value={copyright} 
                    onChange={(e) => setCopyright(e.target.value)} 
                    placeholder="© 2026 Your Company. All rights reserved."
                    required
                  />
                </div>

                <div className="form-group checkbox" style={{ marginTop: '1.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={showNewsletter} 
                      onChange={(e) => setShowNewsletter(e.target.checked)} 
                    />
                    Show Newsletter Subscription Form
                  </label>
                </div>
              </div>

              {/* Social Links Panel */}
              <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h2 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--text-h1)' }}>Social Links</h2>
                  <button type="button" className="btn-sm" onClick={handleAddSocial}>+ Add Link</button>
                </div>

                {socialLinks.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
                    No social links added. Click "+ Add Link" to create one.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {socialLinks.map((item, index) => (
                      <div key={index} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <select 
                          value={item.platform} 
                          onChange={(e) => handleSocialChange(index, 'platform', e.target.value)}
                          style={{ width: '130px', padding: '0.5rem' }}
                        >
                          <option value="twitter">Twitter / X</option>
                          <option value="linkedin">LinkedIn</option>
                          <option value="facebook">Facebook</option>
                          <option value="instagram">Instagram</option>
                          <option value="youtube">YouTube</option>
                          <option value="github">GitHub</option>
                        </select>
                        
                        <input 
                          type="url" 
                          value={item.url} 
                          onChange={(e) => handleSocialChange(index, 'url', e.target.value)}
                          placeholder="https://..."
                          required
                          style={{ flex: 1, padding: '0.5rem' }}
                        />

                        <button 
                          type="button" 
                          className="btn-sm btn-danger" 
                          style={{ padding: '0.5rem 0.75rem' }}
                          onClick={() => handleRemoveSocial(index)}
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Columns & Links */}
            <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--text-h1)' }}>Footer Columns</h2>
                <button type="button" className="btn-sm" onClick={handleAddColumn} disabled={columns.length >= 4}>
                  + Add Column
                </button>
              </div>

              {columns.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
                  No footer columns yet. Click "+ Add Column" to start.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {columns.map((col, colIndex) => (
                    <div 
                      key={colIndex} 
                      style={{ 
                        background: 'rgba(255,255,255,0.02)', 
                        padding: '1.25rem', 
                        borderRadius: 'var(--radius-md)', 
                        border: '1px solid var(--border-light)' 
                      }}
                    >
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '1rem' }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>
                            Column Title
                          </label>
                          <input 
                            type="text" 
                            value={col.title} 
                            onChange={(e) => handleColumnTitleChange(colIndex, e.target.value)}
                            placeholder="e.g. Products"
                            required
                            style={{ padding: '0.5rem' }}
                          />
                        </div>
                        <button 
                          type="button" 
                          className="btn-sm btn-danger" 
                          style={{ padding: '0.5rem 0.75rem', marginTop: '1.25rem' }}
                          onClick={() => handleRemoveColumn(colIndex)}
                          title="Delete Column"
                        >
                          🗑️
                        </button>
                      </div>

                      <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Links</span>
                          <button type="button" className="btn-sm" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleAddLink(colIndex)}>
                            + Add Link
                          </button>
                        </div>

                        {col.links.length === 0 ? (
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem 0' }}>
                            No links in this column.
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {col.links.map((link, linkIndex) => (
                              <div key={linkIndex} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <input 
                                  type="text" 
                                  value={link.label} 
                                  onChange={(e) => handleLinkChange(colIndex, linkIndex, 'label', e.target.value)}
                                  placeholder="Text (e.g. About)"
                                  required
                                  style={{ flex: 1, padding: '0.4rem', fontSize: '0.85rem' }}
                                />
                                <input 
                                  type="text" 
                                  value={link.href} 
                                  onChange={(e) => handleLinkChange(colIndex, linkIndex, 'href', e.target.value)}
                                  placeholder="URL (e.g. /about)"
                                  required
                                  style={{ flex: 1, padding: '0.4rem', fontSize: '0.85rem' }}
                                />
                                <button 
                                  type="button" 
                                  className="btn-sm btn-danger" 
                                  style={{ padding: '0.4rem 0.6rem' }}
                                  onClick={() => handleRemoveLink(colIndex, linkIndex)}
                                >
                                  🗑️
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </form>
    </div>
  );
}