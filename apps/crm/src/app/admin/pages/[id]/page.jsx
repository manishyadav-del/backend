'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import './page.css';

/* ── helpers ─────────────────────────────────────────────── */
function parseSafe(raw) {
  if (raw == null) return {};
  if (typeof raw === 'object') return raw;
  try { return JSON.parse(raw) || {}; } catch { return {}; }
}

function getDefaultContent(type) {
  const map = {
    hero: { heading: 'Welcome to Our Website', subheading: 'Build amazing experiences', description: 'Create stunning pages with our visual builder.', buttonText: 'Get Started', buttonUrl: '#', buttonText2: 'Learn More', buttonUrl2: '#', backgroundImage: '', overlayColor: '#000000', overlayOpacity: 0.5, textAlign: 'center' },
    about: { heading: 'About Us', content: 'We are a leading company dedicated to excellence and innovation.', image: '', imageAlt: 'About us', imagePosition: 'right' },
    services: { heading: 'Our Services', subheading: 'What we offer', items: [{ title: 'Service 1', description: 'Description of this service.', icon: '🚀', link: '#' }, { title: 'Service 2', description: 'Description of this service.', icon: '💡', link: '#' }, { title: 'Service 3', description: 'Description of this service.', icon: '⭐', link: '#' }] },
    features: { heading: 'Why Choose Us', subheading: 'Our key advantages', items: [{ title: 'Fast & Reliable', description: 'Lightning-fast performance.', icon: '⚡' }, { title: 'Secure', description: 'Enterprise-grade security.', icon: '🔒' }, { title: 'Trusted', description: '99.9% uptime guaranteed.', icon: '✅' }] },
    cta: { heading: 'Ready to Get Started?', description: 'Join thousands of satisfied customers today.', buttonText: 'Contact Us', buttonUrl: '#contact', buttonText2: 'Learn More', buttonUrl2: '#', bgColor: '#4f46e5', backgroundImage: '' },
    testimonials: { heading: 'What Our Clients Say', items: [{ name: 'John Doe', role: 'CEO, Acme Inc.', content: 'Amazing service! Highly recommend to everyone.', image: '', rating: 5 }, { name: 'Jane Smith', role: 'Marketing Director', content: 'Transformed our business completely.', image: '', rating: 5 }] },
    faq: { heading: 'Frequently Asked Questions', subheading: 'Got questions? We have answers.', items: [{ question: 'What services do you offer?', answer: 'We offer a wide range of services tailored to your needs.' }, { question: 'How do I get started?', answer: 'Simply contact us and we will guide you through.' }] },
    gallery: { heading: 'Our Gallery', columns: 3, items: [{ image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600', alt: 'Medical team', caption: 'Expert Team' }, { image: 'https://images.unsplash.com/photo-1551076805-e1869033e561?w=600', alt: 'Medical facility', caption: 'State of the Art Facility' }] },
    contact: { heading: 'Contact Us', description: 'Get in touch with us today.', email: 'info@example.com', phone: '+1 (234) 567-890', address: '123 Healthcare Ave, Medical City', showForm: true },
    statistics: { heading: 'Our Achievements', subheading: 'Numbers that speak for themselves', items: [{ number: '10,000+', label: 'Patients Served', icon: '👥' }, { number: '98%', label: 'Satisfaction Rate', icon: '⭐' }, { number: '50+', label: 'Expert Doctors', icon: '🏥' }, { number: '15+', label: 'Years Experience', icon: '📅' }] },
    team: { heading: 'Our Team', subheading: 'Meet the experts', items: [{ name: 'Dr. John Smith', role: 'Chief Medical Officer', bio: 'Board-certified with 20+ years experience.', image: '' }] },
    banner: { heading: 'Important Notice', description: 'This is an important announcement.', type: 'info', link: '', linkText: 'Learn More' },
    custom: { html: '<div style="padding:3rem 2rem;text-align:center"><h2 style="color:#1e293b">Custom Section</h2><p style="color:#64748b">Edit this HTML in the properties panel on the right.</p></div>' },
    spacer: { height: 50 },
    divider: { style: 'solid', color: '#e2e8f0', thickness: 1, width: '100%' },
  };
  return map[type] || {};
}

const SECTION_TYPES = [
  { type: 'hero',         name: 'Hero Banner',  icon: '🎯', description: 'Full-width hero with heading, CTA buttons & background' },
  { type: 'about',        name: 'About Us',     icon: 'ℹ️',  description: 'Text + image section for company info' },
  { type: 'services',     name: 'Services',     icon: '🛠️',  description: 'Service cards in a responsive grid' },
  { type: 'features',     name: 'Features',     icon: '⭐',  description: 'Feature highlights with icons' },
  { type: 'cta',          name: 'Call to Action',icon: '📢', description: 'Bold CTA with buttons and background' },
  { type: 'testimonials', name: 'Testimonials', icon: '💬',  description: 'Client reviews with star ratings' },
  { type: 'faq',          name: 'FAQ',          icon: '❓',  description: 'Expandable frequently asked questions' },
  { type: 'gallery',      name: 'Gallery',      icon: '🖼️',  description: 'Image grid with captions' },
  { type: 'contact',      name: 'Contact',      icon: '📧',  description: 'Contact info and optional form' },
  { type: 'statistics',   name: 'Statistics',   icon: '📊',  description: 'Key metrics and achievement numbers' },
  { type: 'team',         name: 'Team',         icon: '👥',  description: 'Team member cards with photos & bios' },
  { type: 'banner',       name: 'Banner',       icon: '📣',  description: 'Announcement or alert banner' },
  { type: 'spacer',       name: 'Spacer',       icon: '↕️',  description: 'Empty space to separate sections' },
  { type: 'divider',      name: 'Divider',      icon: '➖',  description: 'Horizontal line divider' },
  { type: 'custom',       name: 'Custom HTML',  icon: '🔧',  description: 'Write your own HTML code' },
];

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE BUILDER
 Tribo
══════════════════════════════════════════════════════════════ */
export default function PageBuilderPage() {
  const params = useParams();
  const pageId = params.id;

  const [page, setPage] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [leftTab, setLeftTab] = useState('outline'); // 'outline' or 'widgets'
  const [selectedId, setSelectedId] = useState(null);
  const [previewDevice, setPreviewDevice] = useState('desktop');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showSectionLibrary, setShowSectionLibrary] = useState(false);
  const [showPageSettings, setShowPageSettings] = useState(false);
  const [insertAfterIndex, setInsertAfterIndex] = useState(null);

  const [draggingId, setDraggingId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  const autoSaveRef = useRef(null);

  /* ── load ─────────────────────────────────────────────── */
  useEffect(() => { if (pageId) loadPage(); }, [pageId]);

  async function loadPage() {
    try {
      const res = await fetch(`/api/pages/${pageId}`);
      const data = await res.json();
      if (data.page) {
        setPage(data.page);
        const secs = (data.page.sections_rel || []).sort((a, b) => a.sortOrder - b.sortOrder);
        setSections(secs);
        setHistory([secs]);
        setHistoryIndex(0);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  /* ── toast ─────────────────────────────────────────────── */
  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  /* ── history ─────────────────────────────────────────────── */
  function recordHistory(newSecs) {
    setHistory(prev => {
      const trimmed = prev.slice(0, historyIndex + 1);
      const next = [...trimmed, JSON.parse(JSON.stringify(newSecs))];
      setHistoryIndex(next.length - 1);
      return next;
    });
  }

  function undo() {
    if (historyIndex <= 0) return;
    const ni = historyIndex - 1;
    setHistoryIndex(ni);
    setSections(JSON.parse(JSON.stringify(history[ni])));
    setHasUnsavedChanges(true);
  }

  // Renders a value as HTML, decoding entities if present
  function html(value) {
    if (!value) return null;
    let str = String(value);
    
    // Always decode HTML entities if present (e.g. &lt;, &gt;, &nbsp;)
    if (str.includes('&lt;') || str.includes('&gt;') || str.includes('&amp;') || str.includes('&nbsp;')) {
      if (typeof window !== 'undefined') {
        const txt = document.createElement('textarea');
        txt.innerHTML = str;
        str = txt.value;
      }
    }
    
    return <span dangerouslySetInnerHTML={{ __html: str }} />;
  }

  function redo() {
    if (historyIndex >= history.length - 1) return;
    const ni = historyIndex + 1;
    setHistoryIndex(ni);
    setSections(JSON.parse(JSON.stringify(history[ni])));
    setHasUnsavedChanges(true);
  }

  /* ── section mutations ───────────────────────────────────── */
  function commitSections(newSecs) {
    setSections(newSecs);
    setHasUnsavedChanges(true);
    recordHistory(newSecs);
  }

  const handleSectionUpdate = useCallback((sectionId, updates) => {
    setSections(prev => {
      const next = prev.map(s => s.id === sectionId ? { ...s, ...updates } : s);
      setHasUnsavedChanges(true);
      clearTimeout(autoSaveRef.current);
      autoSaveRef.current = setTimeout(() => recordHistory(next), 600);
      return next;
    });
  }, []);

  async function handleAddSection(type, afterIdx = null) {
    try {
      const insertAfter = (afterIdx !== null && sections[afterIdx]) ? sections[afterIdx].id : null;
      const res = await fetch(`/api/pages/${pageId}/sections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, content: getDefaultContent(type), insertAfter }),
      });
      const data = await res.json();
      if (data.section) {
        const newSecs = [...sections, data.section].sort((a, b) => a.sortOrder - b.sortOrder);
        commitSections(newSecs);
        setSelectedId(data.section.id);
        setShowSectionLibrary(false);
        showToast(`${type} section added ✓`);
      }
    } catch { showToast('Failed to add section', 'error'); }
  }

  async function handleDeleteSection(sectionId) {
    if (!confirm('Delete this section?')) return;
    const newSecs = sections.filter(s => s.id !== sectionId);
    commitSections(newSecs);
    if (selectedId === sectionId) setSelectedId(null);
    try {
      await fetch(`/api/pages/${pageId}/sections/${sectionId}`, { method: 'DELETE' });
      showToast('Section deleted');
    } catch { /* optimistic */ }
  }

  async function handleToggleVisibility(sectionId) {
    const sec = sections.find(s => s.id === sectionId);
    if (!sec) return;
    const newSecs = sections.map(s => s.id === sectionId ? { ...s, isVisible: !s.isVisible } : s);
    commitSections(newSecs);
    try {
      await fetch(`/api/pages/${pageId}/sections/${sectionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVisible: !sec.isVisible }),
      });
    } catch { /* optimistic */ }
  }

  async function handleDuplicateSection(sectionId) {
    const sec = sections.find(s => s.id === sectionId);
    if (!sec) return;
    try {
      const res = await fetch(`/api/pages/${pageId}/sections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: sec.type, content: parseSafe(sec.content), insertAfter: sectionId }),
      });
      const data = await res.json();
      if (data.section) {
        const newSecs = [...sections, data.section].sort((a, b) => a.sortOrder - b.sortOrder);
        commitSections(newSecs);
        showToast('Section duplicated');
      }
    } catch { showToast('Failed to duplicate', 'error'); }
  }

  /* ── drag ─────────────────────────────────────────────── */
  function onDragStart(e, id) { setDraggingId(id); e.dataTransfer.effectAllowed = 'move'; }
  function onDragOver(e, id) { e.preventDefault(); setDragOverId(id); }
  async function onDrop(e, targetId) {
    e.preventDefault();
    if (draggingId === targetId) { setDraggingId(null); setDragOverId(null); return; }
    const visible = sections.filter(s => !s.isDeleted);
    const fromIdx = visible.findIndex(s => s.id === draggingId);
    const toIdx = visible.findIndex(s => s.id === targetId);
    const reordered = [...visible];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    const newSecs = reordered.map((s, i) => ({ ...s, sortOrder: i }));
    commitSections(newSecs);
    setDraggingId(null); setDragOverId(null);
  }

  /* ── save / publish ─────────────────────────────────────── */
  async function saveDraft(silent = false) {
    setSaving(true);
    try {
      await fetch(`/api/pages/${pageId}/drafts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections, changeLog: 'Draft saved' }),
      });
      setHasUnsavedChanges(false);
      setLastSaved(new Date());
      if (!silent) showToast('Draft saved ✓');
    } catch { if (!silent) showToast('Save failed', 'error'); }
    finally { setSaving(false); }
  }

  async function handlePublish() {
    if (!confirm('Publish this page? It will be live to all visitors.')) return;
    setSaving(true);
    try {
      await saveDraft(true);
      const res = await fetch(`/api/pages/${pageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'published', changeLog: 'Published' }),
      });
      if (res.ok) { setPage(p => ({ ...p, status: 'published' })); showToast('Page published! 🚀'); }
    } catch { showToast('Publish failed', 'error'); }
    finally { setSaving(false); }
  }

  async function handleUnpublish() {
    if (!confirm('Unpublish this page?')) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/pages/${pageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'draft' }),
      });
      if (res.ok) { setPage(p => ({ ...p, status: 'draft' })); showToast('Page unpublished'); }
    } catch { showToast('Failed', 'error'); }
    finally { setSaving(false); }
  }

  /* ── render ─────────────────────────────────────────────── */
  if (loading) return (
    <div className="pb-loading">
      <div className="pb-spinner" />
      <p>Loading Page Builder…</p>
    </div>
  );
  if (!page) return <div className="pb-error">Page not found</div>;

  const activeSections = sections.filter(s => !s.isDeleted).sort((a, b) => a.sortOrder - b.sortOrder);
  const selectedSection = activeSections.find(s => s.id === selectedId) || null;

  return (
    <div className="pb-root">

      {/* ── TOPBAR ─────────────────────────────────────────── */}
      <header className="pb-topbar">
        <div className="pb-topbar-left">
          <button onClick={() => window.history.back()} className="pb-btn-back">← Back</button>
          <div className="pb-page-info">
            <span className="pb-page-title">{page.title}</span>
            <span className={`pb-status-badge pb-status-${page.status}`}>{page.status}</span>
          </div>
          {hasUnsavedChanges && <span className="pb-unsaved">● Unsaved</span>}
          {lastSaved && <span className="pb-last-saved">Saved {lastSaved.toLocaleTimeString()}</span>}
        </div>

        <div className="pb-topbar-center">
          <button onClick={undo} disabled={historyIndex <= 0} className="pb-btn-tool" title="Undo">↩ Undo</button>
          <span className="pb-divider" />
          <button onClick={redo} disabled={historyIndex >= history.length - 1} className="pb-btn-tool" title="Redo">↪ Redo</button>
          <span className="pb-divider" />
          <div className="pb-device-btns">
            {[['desktop','🖥️'],['tablet','📱'],['mobile','📲']].map(([d, icon]) => (
              <button key={d} className={`pb-device-btn ${previewDevice === d ? 'active' : ''}`} onClick={() => setPreviewDevice(d)} title={d}>
                {icon}
              </button>
            ))}
          </div>
        </div>

        <div className="pb-topbar-right">
          <button onClick={() => setShowPreviewModal(true)} className="pb-btn-secondary">👁 Preview</button>
          <button onClick={() => saveDraft()} disabled={saving} className="pb-btn-secondary">
            {saving ? '⏳ Saving…' : '💾 Save Draft'}
          </button>
          <button onClick={() => setShowPageSettings(true)} className="pb-btn-secondary">⚙ Settings</button>
          {page.status === 'published'
            ? <button onClick={handleUnpublish} disabled={saving} className="pb-btn-warning">Unpublish</button>
            : <button onClick={handlePublish} disabled={saving} className="pb-btn-primary">🚀 Publish</button>
          }
        </div>
      </header>

      {/* ── MAIN 3-PANEL ─────────────────────────────────── */}
      <div className="pb-main">

        {/* LEFT SIDEBAR */}
        <aside className="pb-sidebar-left">
          <div className="pb-left-tabs">
            <button className={leftTab === 'outline' ? 'active' : ''} onClick={() => setLeftTab('outline')}>📁 Layout</button>
            <button className={leftTab === 'widgets' ? 'active' : ''} onClick={() => setLeftTab('widgets')}>➕ Elements</button>
          </div>

          {leftTab === 'outline' ? (
            <>
              <div className="pb-sidebar-head">
                <span className="pb-sidebar-label">Sections ({activeSections.length})</span>
                <button className="pb-btn-add" onClick={() => { setInsertAfterIndex(null); setLeftTab('widgets'); }}>+ Add</button>
              </div>
              <div className="pb-sections-list" onDragOver={e => e.preventDefault()}>
                {activeSections.length === 0 && (
                  <div className="pb-sections-empty">
                    <span>🧩</span>
                    <p>No sections yet</p>
                    <button onClick={() => setLeftTab('widgets')} className="pb-btn-add">Add First Section</button>
                  </div>
                )}
                {activeSections.map((sec, idx) => (
                  <div
                    key={sec.id}
                    className={[
                      'pb-section-item',
                      selectedId === sec.id ? 'selected' : '',
                      !sec.isVisible ? 'hidden' : '',
                      draggingId === sec.id ? 'dragging' : '',
                      dragOverId === sec.id ? 'drag-over' : '',
                    ].filter(Boolean).join(' ')}
                    onClick={() => setSelectedId(sec.id)}
                    draggable
                    onDragStart={e => onDragStart(e, sec.id)}
                    onDragOver={e => onDragOver(e, sec.id)}
                    onDrop={e => onDrop(e, sec.id)}
                    onDragEnd={() => { setDraggingId(null); setDragOverId(null); }}
                  >
                    <div className="pb-section-item-row">
                      <span className="pb-drag-handle">⋮⋮</span>
                      <span className="pb-section-type-tag">{SECTION_TYPES.find(s=>s.type===sec.type)?.icon || '📄'} {sec.type}</span>
                      {!sec.isVisible && <span className="pb-hidden-badge">Hidden</span>}
                    </div>
                    <div className="pb-section-actions">
                      <button onClick={e => { e.stopPropagation(); setInsertAfterIndex(idx); setLeftTab('widgets'); }} className="pb-action-btn" title="Insert after">+</button>
                      <button onClick={e => { e.stopPropagation(); handleDuplicateSection(sec.id); }} className="pb-action-btn" title="Duplicate">⧉</button>
                      <button onClick={e => { e.stopPropagation(); handleToggleVisibility(sec.id); }} className="pb-action-btn" title={sec.isVisible ? 'Hide' : 'Show'}>
                        {sec.isVisible ? '👁' : '🙈'}
                      </button>
                      <button onClick={e => { e.stopPropagation(); handleDeleteSection(sec.id); }} className="pb-action-btn danger" title="Delete">🗑</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="pb-widgets-list">
              <div className="pb-widgets-header">
                <h3>Drag or Click to Add</h3>
              </div>
              <div className="pb-widgets-grid">
                {SECTION_TYPES.map(w => (
                  <div 
                    key={w.type} 
                    className="pb-widget-card" 
                    onClick={() => handleAddSection(w.type, insertAfterIndex)}
                    title={w.description}
                  >
                    <span className="pb-widget-icon">{w.icon}</span>
                    <span className="pb-widget-name">{w.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* CENTER CANVAS — LIVE PREVIEW */}
        <main className="pb-canvas-area">
          <div className="pb-canvas-inner">
            <div className={`pb-canvas-frame pb-device-${previewDevice}`}>
              {activeSections.length === 0 ? (
                <div className="pb-canvas-empty">
                  <div className="pb-canvas-empty-icon">🎨</div>
                  <h3>Start Building Your Page</h3>
                  <p>Click "Add Section" to begin adding content to this page</p>
                  <button className="pb-btn-primary" onClick={() => setShowSectionLibrary(true)}>+ Add First Section</button>
                </div>
              ) : (
                activeSections.map(sec => (
                  <CanvasSection
                    key={sec.id}
                    section={sec}
                    isSelected={selectedId === sec.id}
                    onSelect={() => setSelectedId(sec.id)}
                    onUpdate={updates => handleSectionUpdate(sec.id, updates)}
                    htmlHelper={html}
                  />
                ))
              )}
            </div>
          </div>
        </main>

        {/* RIGHT SIDEBAR — PROPERTIES */}
        <aside className="pb-sidebar-right">
          {selectedSection ? (
            <PropertiesPanel
              key={selectedSection.id}
              section={selectedSection}
              onUpdate={updates => handleSectionUpdate(selectedSection.id, updates)}
              onClose={() => setSelectedId(null)}
              onDelete={() => handleDeleteSection(selectedSection.id)}
              onDuplicate={() => handleDuplicateSection(selectedSection.id)}
              onToggleVisibility={() => handleToggleVisibility(selectedSection.id)}
            />
          ) : (
            <div className="pb-no-selection">
              <div className="pb-no-sel-icon">✏️</div>
              <p>Click a section on the canvas to edit its content and style</p>
            </div>
          )}
        </aside>
      </div>

      {/* ── MODALS ─────────────────────────────────────────── */}
      {showSectionLibrary && (
        <SectionLibraryModal
          onSelect={type => handleAddSection(type, insertAfterIndex)}
          onClose={() => setShowSectionLibrary(false)}
        />
      )}
      {showPreviewModal && (
        <PreviewModal page={page} sections={activeSections} onClose={() => setShowPreviewModal(false)} htmlHelper={html} />
      )}
      {showPageSettings && (
        <PageSettingsModal
          page={page} pageId={pageId}
          onClose={() => setShowPageSettings(false)}
          onUpdate={updates => setPage(p => ({ ...p, ...updates }))}
          showToast={showToast}
        />
      )}

      {/* ── TOAST ─────────────────────────────────────────── */}
      {toast && <div className={`pb-toast pb-toast-${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   CANVAS SECTION WRAPPER
══════════════════════════════════════════════════════════════ */
function CanvasSection({ section, isSelected, onSelect, onUpdate, htmlHelper }) {
  const content = parseSafe(section.content);
  const settings = parseSafe(section.settings);

  const style = {
    backgroundColor: settings.backgroundColor || undefined,
    paddingTop: settings.paddingTop != null ? `${settings.paddingTop}px` : undefined,
    paddingBottom: settings.paddingBottom != null ? `${settings.paddingBottom}px` : undefined,
    marginTop: settings.marginTop != null ? `${settings.marginTop}px` : undefined,
    marginBottom: settings.marginBottom != null ? `${settings.marginBottom}px` : undefined,
    borderColor: settings.borderWidth ? settings.borderColor || '#e2e8f0' : undefined,
    borderStyle: settings.borderWidth ? 'solid' : undefined,
    borderWidth: settings.borderWidth != null ? `${settings.borderWidth}px` : undefined,
    borderRadius: settings.borderRadius != null ? `${settings.borderRadius}px` : undefined,
  };

  return (
    <div
      className={`cs-wrapper ${isSelected ? 'cs-selected' : ''} ${!section.isVisible ? 'cs-hidden' : ''}`}
      style={style}
      onClick={onSelect}
    >
      {isSelected && (
        <div className="cs-label">
          <span>{section.type}</span>
          {!section.isVisible && <span className="cs-hidden-tag">Hidden</span>}
        </div>
      )}
      <SectionView
        type={section.type}
        content={content}
        editable
        onUpdate={newContent => onUpdate({ content: newContent })}
        htmlHelper={htmlHelper}
      />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SECTION VIEW — renders each section type (used in canvas + preview)
══════════════════════════════════════════════════════════════ */
function SectionView({ type, content, editable = false, onUpdate, htmlHelper }) {
  function field(key) {
    return editable ? {
      contentEditable: true,
      suppressContentEditableWarning: true,
      onBlur: e => onUpdate && onUpdate({ ...content, [key]: e.target.textContent }),
    } : {};
  }

  const html = htmlHelper;

  switch (type) {
    case 'spacer': return (
      <div style={{ height: `${content.height || 50}px` }} />
    );

    case 'divider': return (
      <div style={{ padding: '20px 0', display: 'flex', justifyContent: 'center', width: '100%' }}>
        <hr style={{
          border: 'none',
          borderTop: `${content.thickness || 1}px ${content.style || 'solid'} ${content.color || '#e2e8f0'}`,
          width: content.width || '100%',
          margin: 0
        }} />
      </div>
    );

    case 'hero': return (
      <div className="sv-hero" style={{
        backgroundImage: content.backgroundImage
          ? `url(${content.backgroundImage})`
          : 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)',
        backgroundSize: 'cover', backgroundPosition: 'center',
        textAlign: content.textAlign || 'center',
      }}>
        <div className="sv-hero-overlay" style={{ background: content.overlayColor || '#000', opacity: content.overlayOpacity ?? 0.5 }} />
        <div className="sv-hero-content">
          <h1 {...field('heading')}>{content.heading || 'Hero Heading'}</h1>
          <p className="sv-hero-sub" {...field('subheading')}>{content.subheading}</p>
          {content.description && <p className="sv-hero-desc" {...field('description')}>{content.description}</p>}
          <div className="sv-btns">
            {content.buttonText && <a href={content.buttonUrl || '#'} className="sv-btn sv-btn-white" onClick={e=>e.preventDefault()}>{content.buttonText}</a>}
            {content.buttonText2 && <a href={content.buttonUrl2 || '#'} className="sv-btn sv-btn-outline" onClick={e=>e.preventDefault()}>{content.buttonText2}</a>}
          </div>
        </div>
      </div>
    );

    case 'about': return (
      <div className="sv-about">
        <div className={`sv-about-grid ${content.imagePosition === 'left' ? 'img-left' : ''}`}>
          <div className="sv-about-text">
            <h2 {...field('heading')}>{content.heading || 'About Us'}</h2>
            <div className="sv-about-body">{html(content.content)}</div>
          </div>
          {content.image
            ? <img src={content.image} alt={content.imageAlt || 'About'} className="sv-about-img" />
            : <div className="sv-about-img-placeholder">🖼️<span>Add image in properties</span></div>
          }
        </div>
      </div>
    );

    case 'services': return (
      <div className="sv-section">
        <div className="sv-section-hd">
          <h2 {...field('heading')}>{content.heading || 'Our Services'}</h2>
          {content.subheading && <p {...field('subheading')}>{content.subheading}</p>}
        </div>
        <div className="sv-grid sv-grid-3">
          {(content.items || []).map((item, i) => (
            <div key={i} className="sv-card">
              <div className="sv-card-icon">{item.icon || '⭐'}</div>
              <h3>{item.title}</h3>
              <p>{html(item.description)}</p>
              {item.link && <a href={item.link} className="sv-card-link" onClick={e=>e.preventDefault()}>Learn More →</a>}
            </div>
          ))}
        </div>
      </div>
    );

    case 'features': return (
      <div className="sv-section sv-section-alt">
        <div className="sv-section-hd">
          <h2 {...field('heading')}>{content.heading || 'Features'}</h2>
          {content.subheading && <p>{html(content.subheading)}</p>}
        </div>
        <div className="sv-grid sv-grid-3">
          {(content.items || []).map((item, i) => (
            <div key={i} className="sv-feature">
              <div className="sv-feature-icon">{item.icon || '✓'}</div>
              <h3>{item.title}</h3>
              <p>{html(item.description)}</p>
            </div>
          ))}
        </div>
      </div>
    );

    case 'cta': return (
      <div className="sv-cta" style={{
        background: content.backgroundImage
          ? `url(${content.backgroundImage}) center/cover`
          : (content.bgColor || '#4f46e5'),
      }}>
        <div className="sv-cta-overlay" />
        <div className="sv-cta-content">
          <h2 {...field('heading')}>{content.heading}</h2>
          <p>{html(content.description)}</p>
          <div className="sv-btns">
            {content.buttonText && <a href={content.buttonUrl || '#'} className="sv-btn sv-btn-white" onClick={e=>e.preventDefault()}>{content.buttonText}</a>}
            {content.buttonText2 && <a href={content.buttonUrl2 || '#'} className="sv-btn sv-btn-outline" onClick={e=>e.preventDefault()}>{content.buttonText2}</a>}
          </div>
        </div>
      </div>
    );

    case 'testimonials': return (
      <div className="sv-section">
        <div className="sv-section-hd">
          <h2 {...field('heading')}>{content.heading}</h2>
        </div>
        <div className="sv-grid sv-grid-2">
          {(content.items || []).map((item, i) => (
            <div key={i} className="sv-testimonial">
              <div className="sv-stars">{'★'.repeat(Math.min(item.rating || 5, 5))}</div>
              <p className="sv-testimonial-text">"{html(item.content)}"</p>
              <div className="sv-testimonial-author">
                {item.image
                  ? <img src={item.image} alt={item.name} className="sv-avatar" />
                  : <div className="sv-avatar-placeholder">{(item.name||'?')[0]}</div>
                }
                <div>
                  <strong>{item.name}</strong>
                  <span>{item.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );

    case 'faq': return (
      <div className="sv-section sv-section-alt">
        <div className="sv-section-hd">
          <h2 {...field('heading')}>{content.heading}</h2>
          {content.subheading && <p>{content.subheading}</p>}
        </div>
        <div className="sv-faq-list">
          {(content.items || []).map((item, i) => <FAQAccordion key={i} item={item} />)}
        </div>
      </div>
    );

    case 'gallery': return (
      <div className="sv-section">
        <div className="sv-section-hd">
          <h2 {...field('heading')}>{content.heading}</h2>
        </div>
        <div className={`sv-gallery cols-${content.columns || 3}`}>
          {(content.items || []).map((item, i) => (
            <div key={i} className="sv-gallery-item">
              {item.image
                ? <img src={item.image} alt={item.alt || ''} />
                : <div className="sv-gallery-placeholder">📷</div>
              }
              {item.caption && <p className="sv-gallery-caption">{item.caption}</p>}
            </div>
          ))}
        </div>
      </div>
    );

    case 'contact': return (
      <div className="sv-section sv-section-alt">
        <div className="sv-section-hd">
          <h2 {...field('heading')}>{content.heading}</h2>
          {content.description && <p>{html(content.description)}</p>}
        </div>
        <div className="sv-contact-layout">
          <div className="sv-contact-info">
            {content.email && <div className="sv-contact-row"><span>📧</span><a href={`mailto:${content.email}`}>{content.email}</a></div>}
            {content.phone && <div className="sv-contact-row"><span>📞</span><span>{content.phone}</span></div>}
            {content.address && <div className="sv-contact-row"><span>📍</span><span>{content.address}</span></div>}
          </div>
          {content.showForm && (
            <form className="sv-contact-form" onSubmit={e => e.preventDefault()}>
              <input type="text" placeholder="Your Name" />
              <input type="email" placeholder="Your Email" />
              <textarea rows={4} placeholder="Your Message" />
              <button type="submit" className="sv-btn sv-btn-primary">Send Message</button>
            </form>
          )}
        </div>
      </div>
    );

    case 'statistics': return (
      <div className="sv-stats">
        <div className="sv-section-hd">
          <h2 {...field('heading')}>{content.heading}</h2>
          {content.subheading && <p>{content.subheading}</p>}
        </div>
        <div className="sv-stats-grid">
          {(content.items || []).map((item, i) => (
            <div key={i} className="sv-stat">
              {item.icon && <div className="sv-stat-icon">{item.icon}</div>}
              <div className="sv-stat-number">{item.number}</div>
              <div className="sv-stat-label">{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    );

    case 'team': return (
      <div className="sv-section">
        <div className="sv-section-hd">
          <h2 {...field('heading')}>{content.heading}</h2>
          {content.subheading && <p>{content.subheading}</p>}
        </div>
        <div className="sv-grid sv-grid-3">
          {(content.items || []).map((item, i) => (
            <div key={i} className="sv-team-card">
              {item.image
                ? <img src={item.image} alt={item.name} className="sv-team-photo" />
                : <div className="sv-team-photo-placeholder">{(item.name||'?')[0]}</div>
              }
              <h3>{item.name}</h3>
              <span className="sv-team-role">{item.role}</span>
              {item.bio && <p className="sv-team-bio" dangerouslySetInnerHTML={{ __html: item.bio }} />}
            </div>
          ))}
        </div>
      </div>
    );

    case 'banner': return (
      <div className={`sv-banner sv-banner-${content.type || 'info'}`}>
        <strong>{content.heading}</strong>
        {content.description && <span> — {content.description}</span>}
        {content.link && <a href={content.link} onClick={e=>e.preventDefault()}>{content.linkText || 'Learn More'}</a>}
      </div>
    );

    case 'custom': return (
      <div className="sv-custom" dangerouslySetInnerHTML={{ __html: content.html || '' }} />
    );

    default: return (
      <div className="sv-unknown">Unknown section type: <code>{type}</code></div>
    );
  }
}

function FAQAccordion({ item }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`sv-faq-item ${open ? 'open' : ''}`}>
      <button className="sv-faq-q" onClick={() => setOpen(!open)}>
        <span>{item.question}</span>
        <span className="sv-faq-icon">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="sv-faq-a" dangerouslySetInnerHTML={{ __html: item.answer || '' }} />}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   PROPERTIES PANEL
══════════════════════════════════════════════════════════════ */
function PropertiesPanel({ section, onUpdate, onClose, onDelete, onDuplicate, onToggleVisibility }) {
  const [content, setContent] = useState(parseSafe(section.content));
  const [settings, setSettings] = useState(parseSafe(section.settings));
  const [tab, setTab] = useState('content');

  useEffect(() => {
    setContent(parseSafe(section.content));
    setSettings(parseSafe(section.settings));
  }, [section.id]);

  function setC(field, value) {
    const next = { ...(content || {}), [field]: value };
    setContent(next);
    onUpdate({ content: next });
  }
  function setS(field, value) {
    const next = { ...(settings || {}), [field]: value };
    setSettings(next);
    onUpdate({ settings: next });
  }
  function setItem(arrField, idx, field, value) {
    const arr = [...((content || {})[arrField] || [])];
    arr[idx] = { ...arr[idx], [field]: value };
    setC(arrField, arr);
  }
  function addItem(arrField, defaults) { setC(arrField, [...((content || {})[arrField] || []), defaults]); }
  function removeItem(arrField, idx) {
    const arr = [...((content || {})[arrField] || [])];
    arr.splice(idx, 1);
    setC(arrField, arr);
  }

  function renderContent() {
    const c = content || {};
    switch (section.type) {
      case 'hero': return (<>
        <F label="Heading"><input value={c.heading||''} onChange={e=>setC('heading',e.target.value)} /></F>
        <F label="Subheading"><input value={c.subheading||''} onChange={e=>setC('subheading',e.target.value)} /></F>
        <F label="Description"><textarea rows={3} value={c.description||''} onChange={e=>setC('description',e.target.value)} /></F>
        <F label="Button 1 Text"><input value={c.buttonText||''} onChange={e=>setC('buttonText',e.target.value)} /></F>
        <F label="Button 1 URL"><input value={c.buttonUrl||''} onChange={e=>setC('buttonUrl',e.target.value)} /></F>
        <F label="Button 2 Text"><input value={c.buttonText2||''} onChange={e=>setC('buttonText2',e.target.value)} /></F>
        <F label="Button 2 URL"><input value={c.buttonUrl2||''} onChange={e=>setC('buttonUrl2',e.target.value)} /></F>
        <F label="Background Image URL"><input value={c.backgroundImage||''} onChange={e=>setC('backgroundImage',e.target.value)} placeholder="https://…" /></F>
        <F label="Overlay Color"><input type="color" value={c.overlayColor||'#000000'} onChange={e=>setC('overlayColor',e.target.value)} /></F>
        <F label={`Overlay Opacity (${c.overlayOpacity??0.5})`}>
          <input type="range" min="0" max="1" step="0.05" value={c.overlayOpacity??0.5} onChange={e=>setC('overlayOpacity',parseFloat(e.target.value))} />
        </F>
        <F label="Text Align">
          <select value={c.textAlign||'center'} onChange={e=>setC('textAlign',e.target.value)}>
            <option value="left">Left</option><option value="center">Center</option><option value="right">Right</option>
          </select>
        </F>
      </>);

      case 'about': return (<>
        <F label="Heading"><input value={c.heading||''} onChange={e=>setC('heading',e.target.value)} /></F>
        <F label="Content"><textarea rows={6} value={c.content||''} onChange={e=>setC('content',e.target.value)} /></F>
        <F label="Image URL"><input value={c.image||''} onChange={e=>setC('image',e.target.value)} placeholder="https://…" /></F>
        <F label="Image Alt Text"><input value={c.imageAlt||''} onChange={e=>setC('imageAlt',e.target.value)} /></F>
        <F label="Image Position">
          <select value={c.imagePosition||'right'} onChange={e=>setC('imagePosition',e.target.value)}>
            <option value="left">Left</option><option value="right">Right</option>
          </select>
        </F>
      </>);

      case 'services':
      case 'features': return (<>
        <F label="Heading"><input value={c.heading||''} onChange={e=>setC('heading',e.target.value)} /></F>
        <F label="Subheading"><input value={c.subheading||''} onChange={e=>setC('subheading',e.target.value)} /></F>
        <ItemsEditor label="Items" items={c.items||[]}
          onAdd={() => addItem('items', section.type==='services'
            ? {title:'New Service',description:'Description',icon:'⭐',link:'#'}
            : {title:'New Feature',description:'Description',icon:'✓'})}
          onRemove={i => removeItem('items',i)}
          renderItem={(item,i) => (<>
            <F label="Icon / Emoji"><input value={item.icon||''} onChange={e=>setItem('items',i,'icon',e.target.value)} /></F>
            <F label="Title"><input value={item.title||''} onChange={e=>setItem('items',i,'title',e.target.value)} /></F>
            <F label="Description"><textarea rows={2} value={item.description||''} onChange={e=>setItem('items',i,'description',e.target.value)} /></F>
            {section.type==='services' && <F label="Link"><input value={item.link||''} onChange={e=>setItem('items',i,'link',e.target.value)} /></F>}
          </>)}
        />
      </>);

      case 'cta': return (<>
        <F label="Heading"><input value={c.heading||''} onChange={e=>setC('heading',e.target.value)} /></F>
        <F label="Description"><textarea rows={3} value={c.description||''} onChange={e=>setC('description',e.target.value)} /></F>
        <F label="Button 1 Text"><input value={c.buttonText||''} onChange={e=>setC('buttonText',e.target.value)} /></F>
        <F label="Button 1 URL"><input value={c.buttonUrl||''} onChange={e=>setC('buttonUrl',e.target.value)} /></F>
        <F label="Button 2 Text"><input value={c.buttonText2||''} onChange={e=>setC('buttonText2',e.target.value)} /></F>
        <F label="Button 2 URL"><input value={c.buttonUrl2||''} onChange={e=>setC('buttonUrl2',e.target.value)} /></F>
        <F label="Background Color"><input type="color" value={c.bgColor||'#4f46e5'} onChange={e=>setC('bgColor',e.target.value)} /></F>
        <F label="Background Image URL"><input value={c.backgroundImage||''} onChange={e=>setC('backgroundImage',e.target.value)} /></F>
      </>);

      case 'testimonials': return (<>
        <F label="Heading"><input value={c.heading||''} onChange={e=>setC('heading',e.target.value)} /></F>
        <ItemsEditor label="Testimonials" items={c.items||[]}
          onAdd={() => addItem('items',{name:'Client Name',role:'Role, Company',content:'Great experience!',rating:5,image:''})}
          onRemove={i => removeItem('items',i)}
          renderItem={(item,i) => (<>
            <F label="Name"><input value={item.name||''} onChange={e=>setItem('items',i,'name',e.target.value)} /></F>
            <F label="Role"><input value={item.role||''} onChange={e=>setItem('items',i,'role',e.target.value)} /></F>
            <F label="Quote"><textarea rows={3} value={item.content||''} onChange={e=>setItem('items',i,'content',e.target.value)} /></F>
            <F label="Rating (1-5)"><input type="number" min="1" max="5" value={item.rating||5} onChange={e=>setItem('items',i,'rating',parseInt(e.target.value))} /></F>
            <F label="Photo URL"><input value={item.image||''} onChange={e=>setItem('items',i,'image',e.target.value)} /></F>
          </>)}
        />
      </>);

      case 'faq': return (<>
        <F label="Heading"><input value={c.heading||''} onChange={e=>setC('heading',e.target.value)} /></F>
        <F label="Subheading"><input value={c.subheading||''} onChange={e=>setC('subheading',e.target.value)} /></F>
        <ItemsEditor label="FAQ Items" items={c.items||[]}
          onAdd={() => addItem('items',{question:'New Question?',answer:'Answer here.'})}
          onRemove={i => removeItem('items',i)}
          renderItem={(item,i) => (<>
            <F label="Question"><input value={item.question||''} onChange={e=>setItem('items',i,'question',e.target.value)} /></F>
            <F label="Answer"><textarea rows={3} value={item.answer||''} onChange={e=>setItem('items',i,'answer',e.target.value)} /></F>
          </>)}
        />
      </>);

      case 'gallery': return (<>
        <F label="Heading"><input value={c.heading||''} onChange={e=>setC('heading',e.target.value)} /></F>
        <F label="Columns">
          <select value={c.columns||3} onChange={e=>setC('columns',parseInt(e.target.value))}>
            {[2,3,4].map(n=><option key={n} value={n}>{n}</option>)}
          </select>
        </F>
        <ItemsEditor label="Images" items={c.items||[]}
          onAdd={() => addItem('items',{image:'',alt:'',caption:''})}
          onRemove={i => removeItem('items',i)}
          renderItem={(item,i) => (<>
            <F label="Image URL"><input value={item.image||''} onChange={e=>setItem('items',i,'image',e.target.value)} /></F>
            <F label="Alt Text"><input value={item.alt||''} onChange={e=>setItem('items',i,'alt',e.target.value)} /></F>
            <F label="Caption"><input value={item.caption||''} onChange={e=>setItem('items',i,'caption',e.target.value)} /></F>
          </>)}
        />
      </>);

      case 'contact': return (<>
        <F label="Heading"><input value={c.heading||''} onChange={e=>setC('heading',e.target.value)} /></F>
        <F label="Description"><textarea rows={2} value={c.description||''} onChange={e=>setC('description',e.target.value)} /></F>
        <F label="Email"><input type="email" value={c.email||''} onChange={e=>setC('email',e.target.value)} /></F>
        <F label="Phone"><input value={c.phone||''} onChange={e=>setC('phone',e.target.value)} /></F>
        <F label="Address"><input value={c.address||''} onChange={e=>setC('address',e.target.value)} /></F>
        <F label="Show Contact Form">
          <select value={c.showForm?'yes':'no'} onChange={e=>setC('showForm',e.target.value==='yes')}>
            <option value="yes">Yes</option><option value="no">No</option>
          </select>
        </F>
      </>);

      case 'statistics': return (<>
        <F label="Heading"><input value={c.heading||''} onChange={e=>setC('heading',e.target.value)} /></F>
        <F label="Subheading"><input value={c.subheading||''} onChange={e=>setC('subheading',e.target.value)} /></F>
        <ItemsEditor label="Stats" items={c.items||[]}
          onAdd={() => addItem('items',{number:'100+',label:'New Stat',icon:'📊'})}
          onRemove={i => removeItem('items',i)}
          renderItem={(item,i) => (<>
            <F label="Icon / Emoji"><input value={item.icon||''} onChange={e=>setItem('items',i,'icon',e.target.value)} /></F>
            <F label="Number / Value"><input value={item.number||''} onChange={e=>setItem('items',i,'number',e.target.value)} /></F>
            <F label="Label"><input value={item.label||''} onChange={e=>setItem('items',i,'label',e.target.value)} /></F>
          </>)}
        />
      </>);

      case 'team': return (<>
        <F label="Heading"><input value={c.heading||''} onChange={e=>setC('heading',e.target.value)} /></F>
        <F label="Subheading"><input value={c.subheading||''} onChange={e=>setC('subheading',e.target.value)} /></F>
        <ItemsEditor label="Members" items={c.items||[]}
          onAdd={() => addItem('items',{name:'Team Member',role:'Role',bio:'',image:''})}
          onRemove={i => removeItem('items',i)}
          renderItem={(item,i) => (<>
            <F label="Photo URL"><input value={item.image||''} onChange={e=>setItem('items',i,'image',e.target.value)} /></F>
            <F label="Name"><input value={item.name||''} onChange={e=>setItem('items',i,'name',e.target.value)} /></F>
            <F label="Role"><input value={item.role||''} onChange={e=>setItem('items',i,'role',e.target.value)} /></F>
            <F label="Bio"><textarea rows={2} value={item.bio||''} onChange={e=>setItem('items',i,'bio',e.target.value)} /></F>
          </>)}
        />
      </>);

      case 'banner': return (<>
        <F label="Heading"><input value={c.heading||''} onChange={e=>setC('heading',e.target.value)} /></F>
        <F label="Description"><input value={c.description||''} onChange={e=>setC('description',e.target.value)} /></F>
        <F label="Type">
          <select value={c.type||'info'} onChange={e=>setC('type',e.target.value)}>
            {['info','success','warning','error'].map(t=><option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
          </select>
        </F>
        <F label="Link URL"><input value={c.link||''} onChange={e=>setC('link',e.target.value)} /></F>
        <F label="Link Text"><input value={c.linkText||''} onChange={e=>setC('linkText',e.target.value)} /></F>
      </>);

      case 'spacer': return (<>
        <F label={`Spacer Height: ${c.height||50}px`}>
          <input type="range" min="10" max="250" step="5" value={c.height||50} onChange={e=>setC('height',parseInt(e.target.value))} />
        </F>
      </>);

      case 'divider': return (<>
        <F label="Line Style">
          <select value={c.style||'solid'} onChange={e=>setC('style',e.target.value)}>
            <option value="solid">Solid</option>
            <option value="dashed">Dashed</option>
            <option value="dotted">Dotted</option>
          </select>
        </F>
        <F label="Line Color">
          <input type="color" value={c.color||'#e2e8f0'} onChange={e=>setC('color',e.target.value)} />
        </F>
        <F label={`Thickness: ${c.thickness||1}px`}>
          <input type="range" min="1" max="15" step="1" value={c.thickness||1} onChange={e=>setC('thickness',parseInt(e.target.value))} />
        </F>
        <F label="Divider Width">
          <select value={c.width||'100%'} onChange={e=>setC('width',e.target.value)}>
            <option value="100%">100% (Full Width)</option>
            <option value="80%">80%</option>
            <option value="60%">60%</option>
            <option value="40%">40%</option>
            <option value="20%">20%</option>
          </select>
        </F>
      </>);

      case 'custom': return (
        <F label="HTML Code">
          <textarea rows={12} value={c.html||''} onChange={e=>setC('html',e.target.value)} className="code-textarea" />
        </F>
      );

      default: return <p className="pp-no-fields">No editable fields for this section.</p>;
    }
  }

  const s = settings || {};
  return (
    <div className="pp-root">
      <div className="pp-header">
        <div className="pp-title">
          <span className="pp-type-badge">{section.type}</span>
          <span>Properties</span>
        </div>
        <button onClick={onClose} className="pp-close">×</button>
      </div>

      <div className="pp-actions">
        <button onClick={onToggleVisibility} className="pp-action-btn">{section.isVisible ? '🙈 Hide' : '👁 Show'}</button>
        <button onClick={onDuplicate} className="pp-action-btn">⧉ Duplicate</button>
        <button onClick={onDelete} className="pp-action-btn danger">🗑 Delete</button>
      </div>

      <div className="pp-tabs">
        <button className={tab==='content'?'active':''} onClick={()=>setTab('content')}>Content</button>
        <button className={tab==='style'?'active':''} onClick={()=>setTab('style')}>Style</button>
      </div>

      <div className="pp-body">
        {tab === 'content' && renderContent()}
        {tab === 'style' && (<>
          <F label="Background Color">
            <input type="color" value={s.backgroundColor||'#ffffff'} onChange={e=>setS('backgroundColor',e.target.value)} />
          </F>
          <F label="Padding Top (px)">
            <input type="number" value={s.paddingTop??80} onChange={e=>setS('paddingTop',parseInt(e.target.value))} />
          </F>
          <F label="Padding Bottom (px)">
            <input type="number" value={s.paddingBottom??80} onChange={e=>setS('paddingBottom',parseInt(e.target.value))} />
          </F>
          <F label="Margin Top (px)">
            <input type="number" value={s.marginTop??0} onChange={e=>setS('marginTop',parseInt(e.target.value))} />
          </F>
          <F label="Margin Bottom (px)">
            <input type="number" value={s.marginBottom??0} onChange={e=>setS('marginBottom',parseInt(e.target.value))} />
          </F>
          <F label="Border Color">
            <input type="color" value={s.borderColor||'#e2e8f0'} onChange={e=>setS('borderColor',e.target.value)} />
          </F>
          <F label="Border Width (px)">
            <input type="number" min="0" max="20" value={s.borderWidth??0} onChange={e=>setS('borderWidth',parseInt(e.target.value))} />
          </F>
          <F label="Border Radius (px)">
            <input type="number" min="0" max="100" value={s.borderRadius??0} onChange={e=>setS('borderRadius',parseInt(e.target.value))} />
          </F>
          <F label="Custom CSS Class">
            <input value={s.className||''} onChange={e=>setS('className',e.target.value)} placeholder="my-class" />
          </F>
        </>)}
      </div>
    </div>
  );
}

/* tiny field wrapper */
function F({ label, children }) {
  return (
    <div className="pp-field">
      <label>{label}</label>
      {children}
    </div>
  );
}

/* items list editor */
function ItemsEditor({ label, items, onAdd, onRemove, renderItem }) {
  const [expanded, setExpanded] = useState(null);
  return (
    <div className="pp-items-editor">
      <div className="pp-items-header">
        <span>{label} ({items.length})</span>
        <button onClick={onAdd} className="pp-add-item-btn">+ Add</button>
      </div>
      {items.map((item, i) => (
        <div key={i} className={`pp-item-card ${expanded === i ? 'open' : ''}`}>
          <div className="pp-item-head" onClick={() => setExpanded(expanded === i ? null : i)}>
            <span>{item.name || item.title || item.question || `Item ${i + 1}`}</span>
            <div className="pp-item-head-actions">
              <button onClick={e=>{e.stopPropagation(); onRemove(i);}} className="pp-item-remove">✕</button>
              <span>{expanded === i ? '▲' : '▼'}</span>
            </div>
          </div>
          {expanded === i && (
            <div className="pp-item-body">
              {renderItem(item, i)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   SECTION LIBRARY MODAL
══════════════════════════════════════════════════════════════ */
function SectionLibraryModal({ onSelect, onClose }) {
  const [search, setSearch] = useState('');
  const filtered = SECTION_TYPES.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.description.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-lg" onClick={e=>e.stopPropagation()}>
        <div className="modal-head">
          <h2>Add Section</h2>
          <button onClick={onClose} className="modal-close">×</button>
        </div>
        <div className="modal-search">
          <input autoFocus type="text" placeholder="Search sections…" value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <div className="modal-section-grid">
          {filtered.map(item => (
            <button key={item.type} className="modal-section-card" onClick={() => onSelect(item.type)}>
              <span className="msc-icon">{item.icon}</span>
              <div className="msc-info">
                <strong>{item.name}</strong>
                <span>{item.description}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   PREVIEW MODAL — fullscreen live preview
══════════════════════════════════════════════════════════════ */
function PreviewModal({ page, sections, onClose, htmlHelper }) {
  const [device, setDevice] = useState('desktop');
  const widths = { desktop: '100%', tablet: '768px', mobile: '390px' };

  return (
    <div className="modal-overlay preview-overlay" onClick={onClose}>
      <div className="modal-box modal-fullscreen" onClick={e=>e.stopPropagation()}>
        <div className="modal-head preview-head">
          <div className="preview-head-left">
            <h2>Live Preview</h2>
            <span className="preview-slug">/{page.slug}</span>
          </div>
          <div className="preview-device-switcher">
            {[['desktop','🖥️ Desktop'],['tablet','📱 Tablet'],['mobile','📲 Mobile']].map(([d,label]) => (
              <button key={d} className={device===d?'active':''} onClick={()=>setDevice(d)}>{label}</button>
            ))}
          </div>
          <button onClick={onClose} className="modal-close">×</button>
        </div>

        <div className="preview-stage">
          <div
            className={`preview-device-frame pdev-${device}`}
            style={{ width: widths[device], maxWidth: widths[device] }}
          >
            <div className="preview-page-content">
              {sections.filter(s => s.isVisible !== false).length === 0 ? (
                <div style={{padding:'4rem',textAlign:'center',color:'#888'}}>No visible sections to preview</div>
              ) : (
                sections.filter(s => s.isVisible !== false).map(sec => (
                  <div key={sec.id} style={{ opacity: sec.isVisible === false ? 0.4 : 1 }}>
                    <SectionView
                      type={sec.type}
                      content={parseSafe(sec.content)}
                      editable={false}
                      htmlHelper={htmlHelper}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   PAGE SETTINGS MODAL
══════════════════════════════════════════════════════════════ */
function PageSettingsModal({ page, pageId, onClose, onUpdate, showToast }) {
  const [tab, setTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: page.title || '',
    slug: page.slug || '',
    status: page.status || 'draft',
    visibility: page.visibility || 'public',
    password: page.password || '',
    metaTitle: page.seo?.metaTitle || '',
    metaDescription: page.seo?.metaDescription || '',
    canonical: page.seo?.canonical || '',
    ogImage: page.seo?.ogImage || '',
    robotsTxt: page.seo?.robotsTxt || 'index, follow',
  });

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/pages/${pageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title, slug: form.slug,
          status: form.status, visibility: form.visibility, password: form.password,
          seo: { metaTitle: form.metaTitle, metaDescription: form.metaDescription, canonical: form.canonical, ogImage: form.ogImage, robotsTxt: form.robotsTxt },
        }),
      });
      if (res.ok) { onUpdate({ title: form.title, slug: form.slug, status: form.status }); showToast('Settings saved ✓'); onClose(); }
      else showToast('Save failed', 'error');
    } catch { showToast('Save failed', 'error'); }
    finally { setSaving(false); }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-settings" onClick={e=>e.stopPropagation()}>
        <div className="modal-head">
          <h2>Page Settings</h2>
          <button onClick={onClose} className="modal-close">×</button>
        </div>
        <div className="settings-tabs">
          <button className={tab==='general'?'active':''} onClick={()=>setTab('general')}>General</button>
          <button className={tab==='seo'?'active':''} onClick={()=>setTab('seo')}>SEO</button>
        </div>
        <div className="settings-body">
          {tab === 'general' && (<>
            <F label="Page Title"><input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} /></F>
            <F label="URL Slug">
              <div className="slug-row"><span className="slug-pre">/</span><input value={form.slug} onChange={e=>setForm({...form,slug:e.target.value})} /></div>
            </F>
            <F label="Status">
              <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
                <option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option>
              </select>
            </F>
            <F label="Visibility">
              <select value={form.visibility} onChange={e=>setForm({...form,visibility:e.target.value})}>
                <option value="public">Public</option><option value="private">Private</option><option value="password">Password Protected</option>
              </select>
            </F>
            {form.visibility==='password' && <F label="Password"><input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} /></F>}
          </>)}
          {tab === 'seo' && (<>
            <F label={`Meta Title (${form.metaTitle.length}/60)`}><input maxLength={60} value={form.metaTitle} onChange={e=>setForm({...form,metaTitle:e.target.value})} /></F>
            <F label={`Meta Description (${form.metaDescription.length}/160)`}><textarea rows={3} maxLength={160} value={form.metaDescription} onChange={e=>setForm({...form,metaDescription:e.target.value})} /></F>
            <F label="Canonical URL"><input value={form.canonical} onChange={e=>setForm({...form,canonical:e.target.value})} /></F>
            <F label="OG Image URL"><input value={form.ogImage} onChange={e=>setForm({...form,ogImage:e.target.value})} /></F>
            <F label="Robots">
              <select value={form.robotsTxt} onChange={e=>setForm({...form,robotsTxt:e.target.value})}>
                <option value="index, follow">Index, Follow</option>
                <option value="noindex, follow">No Index, Follow</option>
                <option value="index, nofollow">Index, No Follow</option>
                <option value="noindex, nofollow">No Index, No Follow</option>
              </select>
            </F>
          </>)}
        </div>
        <div className="modal-foot">
          <button onClick={onClose} className="pb-btn-secondary">Cancel</button>
          <button onClick={save} disabled={saving} className="pb-btn-primary">{saving?'Saving…':'Save Settings'}</button>
        </div>
      </div>
    </div>
  );
}