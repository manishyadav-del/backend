'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import WebsiteAssignmentTab from '@/components/WebsiteAssignmentTab.jsx';

export default function FooterBuilderPage() {
  const [activeTab, setActiveTab] = useState('editor'); // editor, assignments
  const [columns, setColumns] = useState([]);
  const [copyright, setCopyright] = useState('© 2026 A HEALTH PLACE - Managed by DO IT FOR ME LLC. All Rights Reserved.');
  const [socialLinks, setSocialLinks] = useState([]);
  const [showNewsletter, setShowNewsletter] = useState(true);
  
  // Custom enhanced states
  const [logo, setLogo] = useState('');
  const [description, setDescription] = useState('');
  const [barcodeImage, setBarcodeImage] = useState('');
  const [barcodeLink, setBarcodeLink] = useState('');
  const [contactTitle, setContactTitle] = useState('CONTACT');
  const [contactEmail, setContactEmail] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [barcodeUploading, setBarcodeUploading] = useState(false);

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLogoUploading(true);
    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('projectId', selectedWebsiteId || 'default');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setLogo(data.url);
      } else {
        alert(data.error || 'Failed to upload logo');
      }
    } catch {
      alert('Upload error');
    } finally {
      setLogoUploading(false);
    }
  };

  const handleBarcodeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setBarcodeUploading(true);
    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('projectId', selectedWebsiteId || 'default');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setBarcodeImage(data.url);
      } else {
        alert(data.error || 'Failed to upload barcode');
      }
    } catch {
      alert('Upload error');
    } finally {
      setBarcodeUploading(false);
    }
  };
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Simulator & Websites Preview states
  const [websites, setWebsites] = useState([]);
  const [selectedWebsiteId, setSelectedWebsiteId] = useState('');
  const [previewMode, setPreviewMode] = useState('desktop'); // desktop, tablet, mobile
  const [previewPath, setPreviewPath] = useState('/#footer');
  const [socketStatus, setSocketStatus] = useState('disconnected');
  const socketRef = useRef(null);
  const iframeRef = useRef(null);

  const loadFooter = useCallback(async (projectId) => {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/global-settings/footer?projectId=${projectId}`);
      const data = await res.json();
      if (data.success && data.data && Object.keys(data.data).length > 0) {
        const config = data.data;
        let parsedCols = config.columns || [];
        if (typeof parsedCols === 'number') {
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
        setCopyright('© 2026 A HEALTH PLACE - Managed by DO IT FOR ME LLC. All Rights Reserved.');
        setSocialLinks(config.socialLinks || []);
        setShowNewsletter(true);
        
        setLogo(config.logo || '');
        setDescription(config.description || '');
        setBarcodeImage(config.barcodeImage || '');
        setBarcodeLink(config.barcodeLink || '');
        setContactTitle(config.contactTitle || 'CONTACT');
        setContactEmail(config.contactEmail || '');
      } else {
        // Reset to default settings if no custom footer exists
        setColumns([]);
        setCopyright('© 2026 A HEALTH PLACE - Managed by DO IT FOR ME LLC. All Rights Reserved.');
        setSocialLinks([]);
        setShowNewsletter(true);
        setLogo('');
        setDescription('');
        setBarcodeImage('');
        setBarcodeLink('');
        setContactTitle('CONTACT');
        setContactEmail('');
      }
    } catch {
      setError('Failed to load footer settings');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchWebsites = async () => {
    try {
      const res = await fetch('/api/websites');
      const json = await res.json();
      if (json.success) {
        setWebsites(json.data || []);
        if (json.data?.length > 0) {
          setSelectedWebsiteId(json.data[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching websites:', err);
    }
  };

  useEffect(() => {
    fetchWebsites();

    const initSocket = async () => {
      try {
        await fetch('/api/socket').catch(() => {});
        const socket = io({ path: '/api/socket', reconnectionDelay: 2000 });
        socketRef.current = socket;
        socket.on('connect', () => {
          setSocketStatus('connected');
        });
        socket.on('disconnect', () => setSocketStatus('disconnected'));
      } catch {
        setSocketStatus('disconnected');
      }
    };
    initSocket();

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  useEffect(() => {
    if (selectedWebsiteId) {
      loadFooter(selectedWebsiteId);
    }
  }, [selectedWebsiteId, loadFooter]);

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!selectedWebsiteId) {
      setError('No website selected');
      return;
    }
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const res = await fetch('/api/global-settings/footer', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: selectedWebsiteId,
          columns,
          copyright,
          socialLinks,
          showNewsletter,
          logo,
          description,
          barcodeImage,
          barcodeLink,
          contactTitle,
          contactEmail,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage('Footer settings published & synced live!');
        setTimeout(() => setMessage(''), 3000);

        if (iframeRef.current) {
          setTimeout(() => {
            try {
              iframeRef.current.src = iframeRef.current.src;
            } catch (e) {}
          }, 800);
        }
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

  const selectedWebsite = websites.find(w => w.id === selectedWebsiteId);
  const getIframeUrl = () => {
    if (!selectedWebsite) return '';
    let domain = selectedWebsite.domain;
    if (!domain.startsWith('http://') && !domain.startsWith('https://')) {
      domain = 'http://' + domain;
    }
    const path = previewPath.includes('?') ? `${previewPath}&isolateComponent=Footer` : `${previewPath}?isolateComponent=Footer`;
    return `${domain}${path}`;
  };
  const iframeUrl = getIframeUrl();

  const inp = { 
    width: '100%', 
    padding: '0.6rem 0.8rem', 
    borderRadius: 'var(--radius-md)', 
    border: '1px solid var(--border-strong)', 
    background: 'var(--bg-base)', 
    color: 'var(--text-primary)', 
    fontSize: '0.875rem' 
  };

  return (
    <div style={{ padding: '1.5rem', background: 'var(--bg-base)', minHeight: '85vh' }}>
      {/* Page Title & Status Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-h1)', margin: 0 }}>Footer Builder</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Configure copyright, social accounts, column menus, and newsletter triggers.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: socketStatus === 'connected' ? '#10b981' : '#6b7280' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: socketStatus === 'connected' ? '#10b981' : '#6b7280', display: 'inline-block' }} />
            {socketStatus === 'connected' ? 'Live Link Connected' : 'Offline Mode'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', marginBottom: '1.5rem', gap: '1.5rem' }}>
        <button
          onClick={() => setActiveTab('editor')}
          style={{
            background: 'transparent',
            border: 'none',
            padding: '0.75rem 0.25rem',
            color: activeTab === 'editor' ? 'var(--primary)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'editor' ? 700 : 500,
            fontSize: '0.9rem',
            cursor: 'pointer',
            borderBottom: activeTab === 'editor' ? '2px solid var(--primary)' : '2px solid transparent',
            transition: 'var(--transition)'
          }}
        >
          Footer Editor Workspace
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

      {activeTab === 'editor' && (
        <div>
          {message && <div style={{ padding: '0.75rem 1rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.875rem' }}>{message}</div>}
          {error && <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>}

          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading settings...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 500px', gap: '1.5rem', alignItems: 'start' }}>
              
              {/* Left Column: Editor Config Forms */}
              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Changes publish immediately to all websites.</span>
                  <button type="submit" className="btn-primary" disabled={saving} style={{ padding: '0.6rem 1.5rem', fontWeight: 700 }}>
                    {saving ? 'Publishing...' : '💾 Save & Publish'}
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                  
                  {/* Brand & About Info */}
                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.25rem', color: 'var(--text-h1)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      🏢 Brand & About Info
                    </h2>
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>Footer Logo URL</label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input 
                          type="text" 
                          value={logo} 
                          onChange={(e) => setLogo(e.target.value)} 
                          placeholder="e.g. /Logo-Main.png or https://..."
                          style={{ ...inp, flex: 1 }}
                        />
                        <input
                          type="file"
                          id="footer-logo-file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          style={{ display: 'none' }}
                        />
                        <button
                          type="button"
                          className="btn-sm"
                          style={{ height: '40px', display: 'flex', alignItems: 'center' }}
                          onClick={() => document.getElementById('footer-logo-file').click()}
                          disabled={logoUploading}
                        >
                          {logoUploading ? 'Uploading...' : '📁 Upload'}
                        </button>
                      </div>
                    </div>
                    <div className="form-group">
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>Footer About Description</label>
                      <textarea 
                        value={description} 
                        onChange={(e) => setDescription(e.target.value)} 
                        placeholder="A brief description of your organization for the footer."
                        rows={3}
                        style={{ ...inp, resize: 'vertical', fontFamily: 'inherit' }}
                      />
                    </div>
                  </div>

                  {/* Barcode Settings */}
                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.25rem', color: 'var(--text-h1)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      🔤 Barcode Verification Settings
                    </h2>
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                       <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>Barcode Image URL</label>
                       <div style={{ display: 'flex', gap: '0.5rem' }}>
                         <input 
                           type="text" 
                           value={barcodeImage} 
                           onChange={(e) => setBarcodeImage(e.target.value)} 
                           placeholder="e.g. /AHP-Web.jpg or https://..."
                           style={{ ...inp, flex: 1 }}
                         />
                         <input
                           type="file"
                           id="footer-barcode-file"
                           accept="image/*"
                           onChange={handleBarcodeUpload}
                           style={{ display: 'none' }}
                         />
                         <button
                           type="button"
                           className="btn-sm"
                           style={{ height: '40px', display: 'flex', alignItems: 'center' }}
                           onClick={() => document.getElementById('footer-barcode-file').click()}
                           disabled={barcodeUploading}
                         >
                           {barcodeUploading ? 'Uploading...' : '📁 Upload'}
                         </button>
                       </div>
                     </div>
                    <div className="form-group">
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>Barcode Target Link URL</label>
                      <input 
                        type="text" 
                        value={barcodeLink} 
                        onChange={(e) => setBarcodeLink(e.target.value)} 
                        placeholder="e.g. https://portal.issn.org/resource/ISSN/3066-5000"
                        style={inp}
                      />
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.25rem', color: 'var(--text-h1)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      📞 Footer Contact Details
                    </h2>
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>Contact Section Title</label>
                      <input 
                        type="text" 
                        value={contactTitle} 
                        onChange={(e) => setContactTitle(e.target.value)} 
                        placeholder="e.g. CONTACT"
                        style={inp}
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>Contact Email Address</label>
                      <input 
                        type="email" 
                        value={contactEmail} 
                        onChange={(e) => setContactEmail(e.target.value)} 
                        placeholder="e.g. ahealthplace@gmail.com"
                        style={inp}
                      />
                    </div>
                  </div>

                  {/* General Config */}
                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.25rem', color: 'var(--text-h1)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      ⚙️ General Settings
                    </h2>
                    
                    <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>Copyright Text</label>
                      <input 
                        type="text" 
                        value={copyright} 
                        onChange={(e) => setCopyright(e.target.value)} 
                        placeholder="e.g. © 2026 Your Company. All rights reserved."
                        required
                        disabled
                        style={{ ...inp, opacity: 0.6, cursor: 'not-allowed' }}
                      />
                    </div>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'not-allowed', fontSize: '0.85rem', color: 'var(--text-primary)', opacity: 0.6 }}>
                      <input 
                        type="checkbox" 
                        checked={showNewsletter} 
                        onChange={(e) => setShowNewsletter(e.target.checked)} 
                        disabled
                        style={{ cursor: 'not-allowed' }}
                      />
                      Show Newsletter Subscription Form
                    </label>
                  </div>

                  {/* Social Accounts Links */}
                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                      <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-h1)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        📱 Social Links Profile Accounts
                      </h2>
                      <button type="button" className="btn-sm" onClick={handleAddSocial}>+ Add Account</button>
                    </div>

                    {socialLinks.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        No social profiles added yet. Click "+ Add Account" to display icons.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {socialLinks.map((item, index) => (
                          <div key={index} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <select 
                              value={item.platform} 
                              onChange={(e) => handleSocialChange(index, 'platform', e.target.value)}
                              style={{ ...inp, width: '140px' }}
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
                              placeholder="Profile Link (e.g. https://linkedin.com/...)"
                              required
                              style={{ ...inp, flex: 1 }}
                            />

                            <button 
                              type="button" 
                              className="btn-sm btn-danger" 
                              style={{ padding: '0.6rem 0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              onClick={() => handleRemoveSocial(index)}
                            >
                              🗑️
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Columns List */}
                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                      <h2 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-h1)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        📊 Footer Navigation Columns
                      </h2>
                      <button 
                        type="button" 
                        className="btn-sm" 
                        onClick={handleAddColumn} 
                        disabled={columns.length >= 4}
                      >
                        + Add Column
                      </button>
                    </div>

                    {columns.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        No footer columns designed yet. Add custom columns (max 4).
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {columns.map((col, colIndex) => (
                          <div 
                            key={colIndex} 
                            style={{ 
                              background: 'rgba(255,255,255,0.01)', 
                              padding: '1.25rem', 
                              borderRadius: 'var(--radius-lg)', 
                              border: '1px solid var(--border-light)' 
                            }}
                          >
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', marginBottom: '1rem' }}>
                              <div style={{ flex: 1 }}>
                                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>Column Title Header</label>
                                <input 
                                  type="text" 
                                  value={col.title} 
                                  onChange={(e) => handleColumnTitleChange(colIndex, e.target.value)}
                                  placeholder="e.g. Navigation Quick Links"
                                  required
                                  style={{ ...inp, padding: '0.4rem 0.6rem' }}
                                />
                              </div>
                              <button 
                                type="button" 
                                className="btn-sm btn-danger" 
                                style={{ padding: '0.5rem 0.75rem', height: '36px' }}
                                onClick={() => handleRemoveColumn(colIndex)}
                              >
                                🗑️ Delete Column
                              </button>
                            </div>

                            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '0.75rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Column Link Rows</span>
                                <button type="button" className="btn-sm" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }} onClick={() => handleAddLink(colIndex)}>
                                  + Add Row
                                </button>
                              </div>

                              {col.links.length === 0 ? (
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem 0' }}>
                                  No rows added inside this column.
                                </div>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                  {col.links.map((link, linkIndex) => (
                                    <div key={linkIndex} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                      <input 
                                        type="text" 
                                        value={link.label} 
                                        onChange={(e) => handleLinkChange(colIndex, linkIndex, 'label', e.target.value)}
                                        placeholder="Link Label (e.g. Blog)"
                                        required
                                        style={{ ...inp, padding: '0.35rem 0.5rem', fontSize: '0.8rem', flex: 1 }}
                                      />
                                      <input 
                                        type="text" 
                                        value={link.href} 
                                        onChange={(e) => handleLinkChange(colIndex, linkIndex, 'href', e.target.value)}
                                        placeholder="Link URL (e.g. /blog)"
                                        required
                                        style={{ ...inp, padding: '0.35rem 0.5rem', fontSize: '0.8rem', flex: 1 }}
                                      />
                                      <button 
                                        type="button" 
                                        className="btn-sm btn-danger" 
                                        style={{ padding: '0.4rem 0.6rem' }}
                                        onClick={() => handleRemoveLink(colIndex, linkIndex)}
                                      >
                                        ✕
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
              </form>

              {/* Right Column: Live Interactive Visual Mockup Preview */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'sticky', top: '1.5rem' }}>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
                  <h3 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-h1)', margin: '0 0 1rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>✨ Real-Time Visual Preview</span>
                  </h3>
                  
                  {/* Select website for contextual assets */}
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', fontWeight: 600 }}>Active Workspace Website</label>
                    <select
                      value={selectedWebsiteId}
                      onChange={(e) => setSelectedWebsiteId(e.target.value)}
                      style={inp}
                    >
                      {websites.map(site => (
                        <option key={site.id} value={site.id}>{site.name} ({site.domain})</option>
                      ))}
                    </select>
                  </div>

                  {/* Desktop / Mobile switcher for visual scaling */}
                  <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '1rem' }}>
                    {['desktop', 'mobile'].map(mode => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setPreviewMode(mode)}
                        style={{
                          flex: 1, padding: '0.4rem', fontSize: '0.75rem', textTransform: 'capitalize',
                          background: previewMode === mode ? 'var(--primary)' : 'var(--bg-base)',
                          color: previewMode === mode ? '#fff' : 'var(--text-primary)',
                          border: '1px solid ' + (previewMode === mode ? 'var(--primary)' : 'var(--border-light)'),
                          borderRadius: '4px', cursor: 'pointer', transition: 'all 0.15s'
                        }}
                      >
                        {mode === 'desktop' ? '🖥️ Desktop View' : '📱 Mobile View'}
                      </button>
                    ))}
                  </div>

                  {/* Browser Window Mockup */}
                  <div style={{
                    width: '100%',
                    background: '#0d1117',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-strong)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: 'var(--shadow-lg)'
                  }}>
                    {/* Mock Browser Top bar */}
                    <div style={{ background: '#161b22', padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid var(--border-light)' }}>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff5f56', display: 'inline-block' }}></span>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ffbd2e', display: 'inline-block' }}></span>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#27c93f', display: 'inline-block' }}></span>
                      </div>
                      <div style={{ flex: 1, background: '#0d1117', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.65rem', color: '#8b949e', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {selectedWebsite ? selectedWebsite.domain : 'localhost:3001'}{previewPath}
                      </div>
                    </div>

                    {/* Dummy Content Spacer */}
                    <div style={{ background: '#ffffff', padding: '1.5rem', minHeight: '60px', opacity: 0.15 }}>
                      <div style={{ width: '30%', height: 10, background: '#cbd5e1', marginBottom: 8 }}></div>
                      <div style={{ width: '60%', height: 6, background: '#e2e8f0' }}></div>
                    </div>

                    {/* Mock Footer Body */}
                    <div style={{
                      background: '#0f172a',
                      color: '#f8fafc',
                      padding: previewMode === 'mobile' ? '1.5rem 1rem' : '2.5rem 2rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2rem',
                      borderTop: '1px solid #1e293b'
                    }}>
                      
                      {/* Footer Top Grid */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: previewMode === 'mobile' ? '1fr' : '1.5fr repeat(auto-fit, minmax(100px, 1fr)) 1.25fr',
                        gap: '1.5rem',
                        fontSize: '0.8rem'
                      }}>
                        
                        {/* Column 1: Info & Logo */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {logo ? (
                            <img src={logo} alt="Footer Logo" style={{ height: '32px', maxWidth: '120px', objectFit: 'contain' }} />
                          ) : (
                            <span style={{ fontWeight: 'bold', fontSize: '1rem', color: '#0ea5e9' }}>
                              {selectedWebsite ? selectedWebsite.name : 'Health Website'}
                            </span>
                          )}
                          <p style={{ color: '#94a3b8', lineHeight: 1.5, margin: 0, fontSize: '0.75rem' }}>
                            {description || 'Empowering families with quality health resources, guidelines, and expert coverage advice.'}
                          </p>
                          
                          {/* Barcode Mock */}
                          {barcodeImage && (
                            <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <img src={barcodeImage} alt="Mock Barcode" style={{ width: '70px', height: '40px', objectFit: 'contain', background: '#fff', padding: '2px', borderRadius: '4px' }} />
                              <span style={{ fontSize: '0.65rem', color: '#64748b' }}>Scan to Verify</span>
                            </div>
                          )}
                        </div>

                        {/* Navigation Columns Loop */}
                        {columns.map((col, idx) => (
                          <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <h4 style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#ffffff', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              {col.title || `Menu Block`}
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', listStyle: 'none', padding: 0, margin: 0 }}>
                              {col.links?.map((link, lIdx) => (
                                <span key={lIdx} style={{ color: '#94a3b8', fontSize: '0.75rem', cursor: 'pointer' }}>
                                  {link.label || 'Link'}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}

                        {/* Column Contact Info */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          <h4 style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#ffffff', margin: 0, textTransform: 'uppercase' }}>
                            {contactTitle || 'CONTACT'}
                          </h4>
                          <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                            {contactEmail || 'info@ahealthplace.com'}
                          </span>
                        </div>

                        {/* Newsletter block (static preview) */}
                        {showNewsletter && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <h4 style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#ffffff', margin: 0 }}>NEWSLETTER</h4>
                            <div style={{ display: 'flex', gap: '0.25rem' }}>
                              <input type="email" placeholder="Your email" disabled style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '4px', padding: '0.25rem 0.5rem', fontSize: '0.7rem', width: '100%', color: '#94a3b8' }} />
                              <button type="button" disabled style={{ background: '#0ea5e9', border: 'none', borderRadius: '4px', padding: '0.25rem 0.5rem', color: '#fff', fontSize: '0.7rem' }}>Ok</button>
                            </div>
                          </div>
                        )}

                      </div>

                      {/* Footer Bottom Copyright */}
                      <div style={{
                        borderTop: '1px solid #1e293b',
                        paddingTop: '1rem',
                        display: 'flex',
                        flexDirection: previewMode === 'mobile' ? 'column' : 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.7rem',
                        color: '#64748b'
                      }}>
                        <span style={{ textAlign: 'center' }}>{copyright}</span>
                      </div>

                    </div>
                  </div>

                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.75rem', textAlign: 'center', lineHeight: '1.3' }}>
                    💡 Tip: The preview responds immediately as you type. Click <strong>Save & Publish</strong> to write changes to your website pages.
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      )}

      {activeTab === 'assignments' && (
        <WebsiteAssignmentTab moduleKey="builder" />
      )}
    </div>
  );
}