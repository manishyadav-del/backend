'use client';

import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

export default function ComponentsManagerPage() {
  const [websites, setWebsites] = useState([]);
  const [selectedWebsiteId, setSelectedWebsiteId] = useState('');
  const [components, setComponents] = useState([]);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [compsLoading, setCompsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [socketStatus, setSocketStatus] = useState('disconnected');
  const [previewMode, setPreviewMode] = useState('desktop'); // desktop, tablet, mobile
  const [editorData, setEditorData] = useState({});
  const [previewPath, setPreviewPath] = useState('/');
  const socketRef = useRef(null);
  const iframeRef = useRef(null);

  useEffect(() => {
    fetchWebsites();
    initSocket();
    return () => { if (socketRef.current) socketRef.current.disconnect(); };
  }, []);

  useEffect(() => {
    if (selectedWebsiteId) fetchComponents(selectedWebsiteId);
    else setComponents([]);
  }, [selectedWebsiteId]);

  const initSocket = async () => {
    try {
      await fetch('/api/socket').catch(() => {});
      const socket = io({ path: '/api/socket', reconnectionDelay: 2000 });
      socketRef.current = socket;
      socket.on('connect', () => {
        setSocketStatus('connected');
        socket.emit('join-website', 'monitor');
      });
      socket.on('disconnect', () => setSocketStatus('disconnected'));
      socket.on('component:update', (data) => {
        setComponents(prev => prev.map(c => c.id === data.id ? { ...c, data: JSON.stringify(data.data), status: data.status } : c));
        if (selectedComponent?.id === data.id) {
          setSelectedComponent(prev => prev ? { ...prev, data: JSON.stringify(data.data), status: data.status } : null);
        }
      });
    } catch { setSocketStatus('disconnected'); }
  };

  const fetchWebsites = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/websites');
      const json = await res.json();
      if (json.success) {
        setWebsites(json.data || []);
        if (json.data?.length > 0) setSelectedWebsiteId(json.data[0].id);
      } else setError(json.error || 'Failed to load websites');
    } catch { setError('Error loading websites.'); }
    finally { setLoading(false); }
  };

  const fetchComponents = async (websiteId) => {
    try {
      setCompsLoading(true);
      const res = await fetch(`/api/components?websiteId=${websiteId}`);
      const json = await res.json();
      if (json.success) {
        setComponents(json.data || []);
        if (json.data?.length > 0) handleSelectComponent(json.data[0]);
        else setSelectedComponent(null);
      } else setError(json.error || 'Failed to load components');
    } catch { setError('Error loading components.'); }
    finally { setCompsLoading(false); }
  };

  const handleSelectComponent = (comp) => {
    setSelectedComponent(comp);
    let parsed = {};
    try {
      parsed = comp.data ? JSON.parse(comp.data) : {};
    } catch {
      parsed = {};
    }
    setEditorData(parsed);
    if (comp.route) {
      setPreviewPath(comp.route);
    }
  };

  const handleInputChange = (field, value) => {
    setEditorData(prev => ({ ...prev, [field]: value }));
  };

  const handleListItemChange = (field, index, key, value) => {
    const list = [...(editorData[field] || [])];
    list[index] = { ...list[index], [key]: value };
    setEditorData(prev => ({ ...prev, [field]: list }));
  };

  const handleAddListItem = (field, defaultObj) => {
    const list = [...(editorData[field] || [])];
    list.push(defaultObj);
    setEditorData(prev => ({ ...prev, [field]: list }));
  };

  const handleRemoveListItem = (field, index) => {
    const list = [...(editorData[field] || [])];
    list.splice(index, 1);
    setEditorData(prev => ({ ...prev, [field]: list }));
  };

  const handleSave = async () => {
    if (!selectedComponent) return;
    try {
      setSaving(true);
      const res = await fetch(`/api/components/${selectedComponent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: editorData,
          status: selectedComponent.status,
          sortOrder: selectedComponent.sortOrder
        })
      });
      const json = await res.json();
      if (json.success) {
        alert('Component changes saved & propagated instantly via WebSockets!');
        setComponents(prev => prev.map(c => c.id === selectedComponent.id ? { ...c, data: JSON.stringify(editorData) } : c));
        
        if (iframeRef.current) {
          setTimeout(() => {
            try {
              iframeRef.current.src = iframeRef.current.src;
            } catch (e) {}
          }, 800);
        }
      } else alert(json.error || 'Failed to save component');
    } catch (err) { alert('Error: ' + err.message); }
    finally { setSaving(false); }
  };

  const selectedWebsite = websites.find(w => w.id === selectedWebsiteId);
  const inp = { width: '100%', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-strong)', background: 'var(--bg-base)', color: 'var(--text-primary)', fontSize: '0.875rem' };

  return (
    <div style={{ padding: '1.5rem', background: 'var(--bg-base)', minHeight: '85vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-h1)', margin: 0 }}>Component Manager</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Visual Props Builder & discovery editor. Discovered SDK sections reload instantly on save.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: socketStatus === 'connected' ? '#10b981' : '#6b7280' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: socketStatus === 'connected' ? '#10b981' : '#6b7280', display: 'inline-block' }} />
            {socketStatus === 'connected' ? 'Live Link Connected' : 'Offline'}
          </span>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading connected sites...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1.5rem' }}>
          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Sites list */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '1.25rem' }}>
              <h2 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Websites</h2>
              <select
                value={selectedWebsiteId}
                onChange={(e) => setSelectedWebsiteId(e.target.value)}
                style={{ ...inp, width: '100%' }}
              >
                {websites.map(site => (
                  <option key={site.id} value={site.id}>{site.name}</option>
                ))}
              </select>
            </div>

            {/* Discovered Components */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', flex: 1, minHeight: '400px' }}>
              <h2 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Discovered Registry</h2>
              {compsLoading ? (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Loading registry...</div>
              ) : components.length === 0 ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No components discovered. Scan directory from SDK on boot.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {components.map(comp => (
                    <button
                      key={comp.id}
                      onClick={() => handleSelectComponent(comp)}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left', padding: '0.6rem 0.8rem',
                        background: selectedComponent?.id === comp.id ? 'var(--primary-light)' : 'transparent',
                        color: selectedComponent?.id === comp.id ? 'var(--primary)' : 'var(--text-primary)',
                        border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '0.85rem',
                        fontWeight: selectedComponent?.id === comp.id ? 700 : 400, transition: 'all 0.15s'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>🧩 {comp.name}</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.7, padding: '0.1rem 0.3rem', background: 'var(--bg-base)', borderRadius: '3px' }}>
                          {comp.componentType}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Route: {comp.route}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Main Configurator Area */}
          {selectedComponent ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem' }}>
              {/* Properties Editor */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', background: 'var(--primary-light)', color: 'var(--primary)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 800 }}>
                      {selectedComponent.componentType}
                    </span>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-h1)', margin: '0.35rem 0 0' }}>{selectedComponent.name} Props Builder</h2>
                    <code style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{selectedComponent.filePath}</code>
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{ padding: '0.6rem 1.5rem', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.7 : 1, boxShadow: '0 2px 4px rgba(16,185,129,0.2)' }}
                  >
                    {saving ? 'Publishing...' : '💾 Publish & Refresh'}
                  </button>
                </div>

                {/* Editor inputs dynamically based on fields */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Basic Text Inputs */}
                  {editorData.title !== undefined && (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', fontWeight: 600 }}>Title Text</label>
                      <input type="text" value={editorData.title} onChange={e => handleInputChange('title', e.target.value)} style={inp} />
                    </div>
                  )}

                  {editorData.subtitle !== undefined && (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', fontWeight: 600 }}>Subtitle/Caption</label>
                      <input type="text" value={editorData.subtitle} onChange={e => handleInputChange('subtitle', e.target.value)} style={inp} />
                    </div>
                  )}

                  {editorData.description !== undefined && (
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', fontWeight: 600 }}>Description Text</label>
                      <textarea rows={3} value={editorData.description} onChange={e => handleInputChange('description', e.target.value)} style={{ ...inp, resize: 'vertical' }} />
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    {editorData.buttonText !== undefined && (
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', fontWeight: 600 }}>Button Label</label>
                        <input type="text" value={editorData.buttonText} onChange={e => handleInputChange('buttonText', e.target.value)} style={inp} />
                      </div>
                    )}
                    {editorData.backgroundColor !== undefined && (
                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem', fontWeight: 600 }}>Background Color</label>
                        <input type="text" placeholder="#ffffff" value={editorData.backgroundColor} onChange={e => handleInputChange('backgroundColor', e.target.value)} style={inp} />
                      </div>
                    )}
                  </div>

                  {/* Testimonials List Block */}
                  {editorData.testimonials !== undefined && (
                    <div style={{ marginTop: '0.75rem', padding: '1rem', background: 'var(--bg-base)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>Testimonials List</h4>
                        <button type="button" onClick={() => handleAddListItem('testimonials', { quote: 'New Quote', author: 'Name, Role', rating: 5 })} style={{ border: 'none', background: 'var(--primary)', color: '#fff', fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer' }}>+ Add Item</button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {editorData.testimonials.map((t, idx) => (
                          <div key={idx} style={{ padding: '0.75rem', background: 'var(--bg-card)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', position: 'relative' }}>
                            <button type="button" onClick={() => handleRemoveListItem('testimonials', idx)} style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: '0.9rem' }}>✕</button>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                              <input type="text" placeholder="Author" value={t.author} onChange={e => handleListItemChange('testimonials', idx, 'author', e.target.value)} style={{ ...inp, padding: '0.35rem' }} />
                              <textarea rows={2} placeholder="Quote" value={t.quote} onChange={e => handleListItemChange('testimonials', idx, 'quote', e.target.value)} style={{ ...inp, padding: '0.35rem', resize: 'vertical' }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* FAQs List Block */}
                  {editorData.faqs !== undefined && (
                    <div style={{ marginTop: '0.75rem', padding: '1rem', background: 'var(--bg-base)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>FAQ Items</h4>
                        <button type="button" onClick={() => handleAddListItem('faqs', { question: 'Question', answer: 'Answer' })} style={{ border: 'none', background: 'var(--primary)', color: '#fff', fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer' }}>+ Add FAQ</button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {editorData.faqs.map((f, idx) => (
                          <div key={idx} style={{ padding: '0.75rem', background: 'var(--bg-card)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', position: 'relative' }}>
                            <button type="button" onClick={() => handleRemoveListItem('faqs', idx)} style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: '0.9rem' }}>✕</button>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                              <input type="text" placeholder="Question" value={f.question} onChange={e => handleListItemChange('faqs', idx, 'question', e.target.value)} style={{ ...inp, padding: '0.35rem' }} />
                              <textarea rows={2} placeholder="Answer" value={f.answer} onChange={e => handleListItemChange('faqs', idx, 'answer', e.target.value)} style={{ ...inp, padding: '0.35rem', resize: 'vertical' }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Features List Block */}
                  {editorData.features !== undefined && (
                    <div style={{ marginTop: '0.75rem', padding: '1rem', background: 'var(--bg-base)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>Features Items</h4>
                        <button type="button" onClick={() => handleAddListItem('features', { title: 'Feature', description: 'Desc' })} style={{ border: 'none', background: 'var(--primary)', color: '#fff', fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer' }}>+ Add Feature</button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {editorData.features.map((feat, idx) => (
                          <div key={idx} style={{ padding: '0.75rem', background: 'var(--bg-card)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-md)', position: 'relative' }}>
                            <button type="button" onClick={() => handleRemoveListItem('features', idx)} style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: '0.9rem' }}>✕</button>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                              <input type="text" placeholder="Feature Title" value={feat.title} onChange={e => handleListItemChange('features', idx, 'title', e.target.value)} style={{ ...inp, padding: '0.35rem' }} />
                              <textarea rows={2} placeholder="Feature Description" value={feat.description} onChange={e => handleListItemChange('features', idx, 'description', e.target.value)} style={{ ...inp, padding: '0.35rem', resize: 'vertical' }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {Object.keys(editorData).length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                      🧩 No configurable variables detected inside this component code file. Add properties like title, subtitle or description inside the React functional parameter brackets.
                    </div>
                  )}
                </div>
              </div>

              {/* Live Preview System */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '1rem' }}>
                  <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Component Preview</h3>
                  
                  {/* Route Selector */}
                  <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem', fontWeight: 600 }}>Page Path Route</label>
                      <input 
                        type="text" 
                        value={previewPath} 
                        onChange={(e) => setPreviewPath(e.target.value)} 
                        placeholder="/"
                        style={inp}
                      />
                    </div>
                    <button 
                      type="button" 
                      onClick={() => {
                        if (iframeRef.current) iframeRef.current.src = selectedWebsite ? `${selectedWebsite.domain.startsWith('http') ? selectedWebsite.domain : 'http://' + selectedWebsite.domain}${previewPath}` : '';
                      }}
                      style={{ height: '36px', marginTop: '17px', padding: '0 0.75rem', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-base)', color: 'var(--text-primary)', cursor: 'pointer' }}
                    >
                      🔄 Reload
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '1rem' }}>
                    {['desktop', 'tablet', 'mobile'].map(mode => (
                      <button
                        key={mode}
                        onClick={() => setPreviewMode(mode)}
                        style={{
                          flex: 1, padding: '0.3rem', fontSize: '0.7rem', textTransform: 'capitalize',
                          background: previewMode === mode ? 'var(--primary)' : 'var(--bg-base)',
                          color: previewMode === mode ? '#fff' : 'var(--text-primary)',
                          border: '1px solid ' + (previewMode === mode ? 'var(--primary)' : 'var(--border-light)'),
                          borderRadius: '4px', cursor: 'pointer'
                        }}
                      >
                        {mode === 'desktop' ? '🖥️ Desk' : mode === 'tablet' ? '📟 Tab' : '📱 Mob'}
                      </button>
                    ))}
                  </div>

                  {/* Simulator Canvas Frame */}
                  <div style={{
                    width: '100%',
                    height: '350px',
                    background: '#15151a',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid var(--border-light)'
                  }}>
                    {selectedWebsite ? (
                      <iframe 
                        ref={iframeRef}
                        src={`${selectedWebsite.domain.startsWith('http') ? selectedWebsite.domain : 'http://' + selectedWebsite.domain}${previewPath}${previewPath.includes('?') ? '&' : '?'}isolateComponent=${selectedComponent.name}`}
                        style={{
                          width: previewMode === 'desktop' ? '100%' : previewMode === 'tablet' ? '768px' : '375px',
                          height: '100%',
                          background: '#fff',
                          border: 'none',
                          transition: 'width 0.25s ease-out'
                        }}
                      />
                    ) : (
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No website connected</div>
                    )}
                  </div>
                </div>

                {/* SDK quick instructions */}
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '1rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  <h4 style={{ margin: '0 0 0.5rem', fontWeight: 700 }}>💡 SDK Prop Binding</h4>
                  Wrap your React components on the frontend using our SDK component manager wrapper:
                  <pre style={{ padding: '0.5rem', background: 'var(--bg-base)', border: '1px solid var(--border-strong)', borderRadius: '4px', overflowX: 'auto', marginTop: '0.5rem', fontSize: '0.7rem', fontFamily: 'monospace' }}>
                    {`<GlobalComponent\n  componentId="${selectedComponent.name}"\n  component={${selectedComponent.name}}\n/>`}
                  </pre>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <h3>No Discovered Components</h3>
              Select a connected website, start your Next.js application, and initialize our SDK. Discovered components will automatically register here!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
