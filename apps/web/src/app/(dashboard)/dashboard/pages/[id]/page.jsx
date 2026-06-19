'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';

export default function PageBuilderPage() {
  const params = useParams();
  const pageId = params.id;
  const [page, setPage] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [previewMode, setPreviewMode] = useState('desktop'); // desktop, tablet, mobile
  const [showPreview, setShowPreview] = useState(false);
  const [showPageSettings, setShowPageSettings] = useState(false);
  const [showSectionLibrary, setShowSectionLibrary] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [lastSaved, setLastSaved] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const projectId = 'demo';

  useEffect(() => {
    if (pageId) {
      loadPage();
    }
  }, [pageId]);

  async function loadPage() {
    try {
      const res = await fetch(`/api/pages/${pageId}?projectId=${projectId}`);
      const data = await res.json();
      if (data.page) {
        setPage(data.page);
        setSections(data.page.sections_rel || []);
        // Initialize history
        setHistory([{ sections: data.page.sections_rel || [], title: data.page.title }]);
        setHistoryIndex(0);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to load page:', error);
      setLoading(false);
    }
  }

  const saveToHistory = useCallback((newSections, newTitle) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push({ sections: newSections, title: newTitle });
      setHistoryIndex(newHistory.length - 1);
      return newHistory;
    });
  }, [historyIndex]);

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setSections(history[newIndex].sections);
      setHasUnsavedChanges(true);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setSections(history[newIndex].sections);
      setHasUnsavedChanges(true);
    }
  };

  const handleSectionUpdate = async (sectionId, updates) => {
    const newSections = sections.map(s => 
      s.id === sectionId ? { ...s, ...updates } : s
    );
    setSections(newSections);
    setHasUnsavedChanges(true);
    saveToHistory(newSections, page?.title);

    // Optimistic update to server
    try {
      await fetch(`/api/pages/${pageId}/sections/${sectionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
    } catch (error) {
      console.error('Failed to update section:', error);
    }
  };

  const handleSectionDelete = async (sectionId) => {
    if (!confirm('Are you sure you want to delete this section? This can be restored before saving.')) {
      return;
    }

    const newSections = sections.map(s => 
      s.id === sectionId ? { ...s, isDeleted: true } : s
    );
    setSections(newSections);
    setHasUnsavedChanges(true);
    saveToHistory(newSections, page?.title);

    try {
      await fetch(`/api/pages/${pageId}/sections/${sectionId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Failed to delete section:', error);
    }
  };

  const handleSectionReorder = async (sectionId, newSortOrder) => {
    const newSections = [...sections].sort((a, b) => a.sortOrder - b.sortOrder);
    const section = newSections.find(s => s.id === sectionId);
    const oldIndex = newSections.indexOf(section);
    newSections.splice(oldIndex, 1);
    newSections.splice(newSortOrder, 0, section);
    
    const reorderedSections = newSections.map((s, i) => ({ ...s, sortOrder: i }));
    setSections(reorderedSections);
    setHasUnsavedChanges(true);
    saveToHistory(reorderedSections, page?.title);

    try {
      await fetch(`/api/pages/${pageId}/sections/${sectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionId, newSortOrder })
      });
    } catch (error) {
      console.error('Failed to reorder section:', error);
    }
  };

  const handleAddSection = async (type, insertAfter = null) => {
    try {
      const res = await fetch(`/api/pages/${pageId}/sections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type, 
          content: getDefaultContent(type),
          insertAfter 
        })
      });
      
      const data = await res.json();
      if (data.section) {
        const newSections = [...sections, data.section].sort((a, b) => a.sortOrder - b.sortOrder);
        setSections(newSections);
        setHasUnsavedChanges(true);
        saveToHistory(newSections, page?.title);
        setShowSectionLibrary(false);
      }
    } catch (error) {
      console.error('Failed to add section:', error);
    }
  };

  const getDefaultContent = (type) => {
    const defaults = {
      hero: {
        heading: 'Welcome to Our Website',
        subheading: 'Build amazing experiences',
        description: 'Create stunning pages with our visual builder',
        buttonText: 'Get Started',
        buttonUrl: '#',
        backgroundImage: '',
        overlayColor: '#000000',
        overlayOpacity: 0.5
      },
      about: {
        heading: 'About Us',
        content: 'We are a leading company dedicated to excellence.',
        image: '',
        imageAlt: 'About us image'
      },
      services: {
        heading: 'Our Services',
        items: [
          { title: 'Service 1', description: 'Description of service 1', icon: '🚀' },
          { title: 'Service 2', description: 'Description of service 2', icon: '💡' },
          { title: 'Service 3', description: 'Description of service 3', icon: '⭐' }
        ]
      },
      features: {
        heading: 'Why Choose Us',
        items: [
          { title: 'Feature 1', description: 'Description', icon: '✓' },
          { title: 'Feature 2', description: 'Description', icon: '✓' }
        ]
      },
      cta: {
        heading: 'Ready to Get Started?',
        description: 'Join thousands of satisfied customers',
        buttonText: 'Contact Us',
        buttonUrl: '#contact',
        backgroundImage: ''
      },
      testimonials: {
        heading: 'What Our Clients Say',
        items: [
          { name: 'John Doe', role: 'CEO', content: 'Amazing service!', image: '', rating: 5 }
        ]
      },
      faq: {
        heading: 'Frequently Asked Questions',
        items: [
          { question: 'Question 1?', answer: 'Answer 1' }
        ]
      },
      gallery: {
        heading: 'Our Gallery',
        items: [
          { image: '', alt: 'Gallery image 1', caption: 'Caption 1' }
        ]
      },
      contact: {
        heading: 'Contact Us',
        description: 'Get in touch with us',
        email: 'info@example.com',
        phone: '+1234567890',
        address: '123 Street, City'
      },
      statistics: {
        heading: 'Our Achievements',
        items: [
          { number: '1000+', label: 'Clients' },
          { number: '500+', label: 'Projects' },
          { number: '50+', label: 'Awards' }
        ]
      },
      team: {
        heading: 'Our Team',
        items: [
          { name: 'John Doe', role: 'CEO', bio: 'Bio here', image: '' }
        ]
      },
      custom: {
        html: '<div>Custom HTML content</div>'
      }
    };
    return defaults[type] || {};
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      await fetch(`/api/pages/${pageId}/drafts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sections: sections,
          changeLog: 'Draft saved'
        })
      });
      setHasUnsavedChanges(false);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to save draft:', error);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!confirm('Are you sure you want to publish this page? It will be visible to all visitors.')) {
      return;
    }

    setSaving(true);
    try {
      // Save current state as draft first
      await fetch(`/api/pages/${pageId}/drafts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sections,
          changeLog: 'Before publish'
        })
      });

      // Update page status
      const res = await fetch(`/api/pages/${pageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'published',
          sections: JSON.stringify(sections),
          changeLog: 'Page published'
        })
      });

      if (res.ok) {
        setHasUnsavedChanges(false);
        setLastSaved(new Date());
        loadPage();
      }
    } catch (error) {
      console.error('Failed to publish:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleUnpublish = async () => {
    if (!confirm('Are you sure you want to unpublish this page?')) {
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/pages/${pageId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'draft',
          changeLog: 'Page unpublished'
        })
      });

      if (res.ok) {
        loadPage();
      }
    } catch (error) {
      console.error('Failed to unpublish:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading page builder...</div>;
  }

  if (!page) {
    return <div className="error">Page not found</div>;
  }

  return (
    <div className="page-builder">
      {/* Top Bar */}
      <div className="builder-topbar">
        <div className="topbar-left">
          <button onClick={() => window.history.back()} className="btn-back">← Back</button>
          <h2>{page.title}</h2>
          {hasUnsavedChanges && <span className="unsaved-indicator">● Unsaved changes</span>}
          {lastSaved && <span className="last-saved">Last saved: {lastSaved.toLocaleTimeString()}</span>}
        </div>
        
        <div className="topbar-center">
          <button onClick={undo} disabled={historyIndex <= 0} className="btn-toolbar" title="Undo">
            ↩ Undo
          </button>
          <button onClick={redo} disabled={historyIndex >= history.length - 1} className="btn-toolbar" title="Redo">
            ↪ Redo
          </button>
        </div>

        <div className="topbar-right">
          <button onClick={() => setShowPreview(true)} className="btn-secondary">
            👁 Preview
          </button>
          <button onClick={handleSaveDraft} disabled={saving} className="btn-secondary">
            {saving ? 'Saving...' : '💾 Save Draft'}
          </button>
          {page.status === 'published' ? (
            <button onClick={handleUnpublish} disabled={saving} className="btn-warning">
              Unpublish
            </button>
          ) : (
            <button onClick={handlePublish} disabled={saving} className="btn-primary">
              {saving ? 'Publishing...' : '🚀 Publish'}
            </button>
          )}
          <button onClick={() => setShowPageSettings(true)} className="btn-secondary">
            ⚙ Settings
          </button>
        </div>
      </div>

      <div className="builder-main">
        {/* Left Sidebar - Section List */}
        <div className="builder-sidebar-left">
          <div className="sidebar-header">
            <h3>Sections</h3>
            <button 
              onClick={() => setShowSectionLibrary(true)}
              className="btn-add-section"
            >
              + Add
            </button>
          </div>
          
          <div className="sections-list">
            {sections.filter(s => !s.isDeleted).map((section, index) => (
              <div
                key={section.id}
                className={`section-item ${selectedSection === section.id ? 'selected' : ''} ${!section.isVisible ? 'hidden' : ''}`}
                onClick={() => setSelectedSection(section.id)}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('sectionId', section.id);
                  e.dataTransfer.setData('index', index);
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const fromIndex = parseInt(e.dataTransfer.getData('index'));
                  const toIndex = index;
                  if (fromIndex !== toIndex) {
                    handleSectionReorder(section.id, toIndex);
                  }
                }}
              >
                <div className="section-item-header">
                  <span className="drag-handle">⋮⋮</span>
                  <span className="section-type">{section.type}</span>
                  {!section.isVisible && <span className="visibility-badge">👁‍🗨 Hidden</span>}
                </div>
                {section.title && <div className="section-title">{section.title}</div>}
                <div className="section-actions">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSectionUpdate(section.id, { isVisible: !section.isVisible });
                    }}
                    className="btn-icon"
                    title={section.isVisible ? 'Hide' : 'Show'}
                  >
                    {section.isVisible ? '👁' : '👁‍🗨'}
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSectionDelete(section.id);
                    }}
                    className="btn-icon btn-danger"
                    title="Delete"
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center - Preview Canvas */}
        <div className="builder-canvas">
          <div className={`preview-frame preview-${previewMode}`}>
            <div className="preview-content">
              {sections.filter(s => !s.isDeleted && s.isVisible).map(section => (
                <SectionRenderer
                  key={section.id}
                  section={section}
                  isSelected={selectedSection === section.id}
                  onSelect={() => setSelectedSection(section.id)}
                  onUpdate={(updates) => handleSectionUpdate(section.id, updates)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Properties Panel */}
        <div className="builder-sidebar-right">
          {selectedSection ? (
            <SectionProperties
              section={sections.find(s => s.id === selectedSection)}
              onUpdate={(updates) => handleSectionUpdate(selectedSection, updates)}
              onClose={() => setSelectedSection(null)}
            />
          ) : (
            <div className="no-selection">
              <p>Select a section to edit its properties</p>
            </div>
          )}
        </div>
      </div>

      {/* Section Library Modal */}
      {showSectionLibrary && (
        <SectionLibrary
          onSelect={handleAddSection}
          onClose={() => setShowSectionLibrary(false)}
        />
      )}

      {/* Preview Modal */}
      {showPreview && (
        <PreviewModal
          page={page}
          sections={sections}
          onClose={() => setShowPreview(false)}
        />
      )}

      {/* Page Settings Modal */}
      {showPageSettings && (
        <PageSettingsModal
          page={page}
          onClose={() => setShowPageSettings(false)}
          onUpdate={(updates) => {
            setPage({ ...page, ...updates });
            setHasUnsavedChanges(true);
          }}
        />
      )}
    </div>
  );
}

// Section Renderer Component
function SectionRenderer({ section, isSelected, onSelect, onUpdate }) {
  const content = typeof section.content === 'string' 
    ? JSON.parse(section.content || '{}') 
    : section.content;

  const handleInlineEdit = (field, value) => {
    onUpdate({
      content: { ...content, [field]: value }
    });
  };

  const renderSection = () => {
    switch (section.type) {
      case 'hero':
        return (
          <div className="section-hero" style={{ backgroundImage: content.backgroundImage ? `url(${content.backgroundImage})` : 'none' }}>
            <div className="hero-overlay" style={{ backgroundColor: content.overlayColor, opacity: content.overlayOpacity }} />
            <div className="hero-content">
              <h1 
                contentEditable 
                suppressContentEditableWarning
                onBlur={(e) => handleInlineEdit('heading', e.target.textContent)}
              >
                {content.heading}
              </h1>
              <p 
                contentEditable 
                suppressContentEditableWarning
                onBlur={(e) => handleInlineEdit('subheading', e.target.textContent)}
              >
                {content.subheading}
              </p>
              <button className="btn-primary">{content.buttonText}</button>
            </div>
          </div>
        );

      case 'about':
        return (
          <div className="section-about">
            <h2 
              contentEditable 
              suppressContentEditableWarning
              onBlur={(e) => handleInlineEdit('heading', e.target.textContent)}
            >
              {content.heading}
            </h2>
            <p 
              contentEditable 
              suppressContentEditableWarning
              onBlur={(e) => handleInlineEdit('content', e.target.textContent)}
            >
              {content.content}
            </p>
          </div>
        );

      case 'services':
        return (
          <div className="section-services">
            <h2 
              contentEditable 
              suppressContentEditableWarning
              onBlur={(e) => handleInlineEdit('heading', e.target.textContent)}
            >
              {content.heading}
            </h2>
            <div className="services-grid">
              {content.items?.map((item, i) => (
                <div key={i} className="service-card">
                  <div className="service-icon">{item.icon}</div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'features':
        return (
          <div className="section-features">
            <h2 
              contentEditable 
              suppressContentEditableWarning
              onBlur={(e) => handleInlineEdit('heading', e.target.textContent)}
            >
              {content.heading}
            </h2>
            <div className="features-grid">
              {content.items?.map((item, i) => (
                <div key={i} className="feature-item">
                  <span className="feature-icon">{item.icon}</span>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'cta':
        return (
          <div className="section-cta">
            <h2>{content.heading}</h2>
            <p>{content.description}</p>
            <button className="btn-primary">{content.buttonText}</button>
          </div>
        );

      case 'testimonials':
        return (
          <div className="section-testimonials">
            <h2>{content.heading}</h2>
            <div className="testimonials-grid">
              {content.items?.map((item, i) => (
                <div key={i} className="testimonial-card">
                  <p>"{item.content}"</p>
                  <div className="testimonial-author">
                    <strong>{item.name}</strong>
                    <span>{item.role}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'faq':
        return (
          <div className="section-faq">
            <h2>{content.heading}</h2>
            <div className="faq-list">
              {content.items?.map((item, i) => (
                <div key={i} className="faq-item">
                  <h3>{item.question}</h3>
                  <p>{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'gallery':
        return (
          <div className="section-gallery">
            <h2>{content.heading}</h2>
            <div className="gallery-grid">
              {content.items?.map((item, i) => (
                <div key={i} className="gallery-item">
                  <img src={item.image} alt={item.alt} />
                  <p>{item.caption}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'contact':
        return (
          <div className="section-contact">
            <h2>{content.heading}</h2>
            <p>{content.description}</p>
            <div className="contact-info">
              <p>Email: {content.email}</p>
              <p>Phone: {content.phone}</p>
              <p>Address: {content.address}</p>
            </div>
          </div>
        );

      case 'statistics':
        return (
          <div className="section-statistics">
            <h2>{content.heading}</h2>
            <div className="stats-grid">
              {content.items?.map((item, i) => (
                <div key={i} className="stat-item">
                  <div className="stat-number">{item.number}</div>
                  <div className="stat-label">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'team':
        return (
          <div className="section-team">
            <h2>{content.heading}</h2>
            <div className="team-grid">
              {content.items?.map((item, i) => (
                <div key={i} className="team-card">
                  <img src={item.image} alt={item.name} />
                  <h3>{item.name}</h3>
                  <p>{item.role}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'custom':
        return (
          <div 
            className="section-custom"
            dangerouslySetInnerHTML={{ __html: content.html }}
          />
        );

      default:
        return <div className="section-unknown">Unknown section type: {section.type}</div>;
    }
  };

  return (
    <div
      className={`section-block ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
    >
      {renderSection()}
    </div>
  );
}

// Section Properties Panel
function SectionProperties({ section, onUpdate, onClose }) {
  const [content, setContent] = useState({});
  const [settings, setSettings] = useState({});

  useEffect(() => {
    if (section) {
      setContent(typeof section.content === 'string' ? JSON.parse(section.content || '{}') : section.content);
      setSettings(typeof section.settings === 'string' ? JSON.parse(section.settings || '{}') : section.settings);
    }
  }, [section]);

  const handleContentChange = (field, value) => {
    const newContent = { ...content, [field]: value };
    setContent(newContent);
    onUpdate({ content: newContent });
  };

  const handleSettingsChange = (field, value) => {
    const newSettings = { ...settings, [field]: value };
    setSettings(newSettings);
    onUpdate({ settings: newSettings });
  };

  const renderProperties = () => {
    switch (section.type) {
      case 'hero':
        return (
          <>
            <div className="property-group">
              <label>Heading</label>
              <input
                type="text"
                value={content.heading || ''}
                onChange={(e) => handleContentChange('heading', e.target.value)}
              />
            </div>
            <div className="property-group">
              <label>Subheading</label>
              <input
                type="text"
                value={content.subheading || ''}
                onChange={(e) => handleContentChange('subheading', e.target.value)}
              />
            </div>
            <div className="property-group">
              <label>Description</label>
              <textarea
                value={content.description || ''}
                onChange={(e) => handleContentChange('description', e.target.value)}
              />
            </div>
            <div className="property-group">
              <label>Button Text</label>
              <input
                type="text"
                value={content.buttonText || ''}
                onChange={(e) => handleContentChange('buttonText', e.target.value)}
              />
            </div>
            <div className="property-group">
              <label>Button URL</label>
              <input
                type="text"
                value={content.buttonUrl || ''}
                onChange={(e) => handleContentChange('buttonUrl', e.target.value)}
              />
            </div>
            <div className="property-group">
              <label>Background Image</label>
              <input
                type="text"
                value={content.backgroundImage || ''}
                onChange={(e) => handleContentChange('backgroundImage', e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="property-group">
              <label>Overlay Color</label>
              <input
                type="color"
                value={content.overlayColor || '#000000'}
                onChange={(e) => handleContentChange('overlayColor', e.target.value)}
              />
            </div>
            <div className="property-group">
              <label>Overlay Opacity</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={content.overlayOpacity || 0.5}
                onChange={(e) => handleContentChange('overlayOpacity', parseFloat(e.target.value))}
              />
            </div>
          </>
        );

      case 'about':
        return (
          <>
            <div className="property-group">
              <label>Heading</label>
              <input
                type="text"
                value={content.heading || ''}
                onChange={(e) => handleContentChange('heading', e.target.value)}
              />
            </div>
            <div className="property-group">
              <label>Content</label>
              <textarea
                value={content.content || ''}
                onChange={(e) => handleContentChange('content', e.target.value)}
                rows={6}
              />
            </div>
            <div className="property-group">
              <label>Image URL</label>
              <input
                type="text"
                value={content.image || ''}
                onChange={(e) => handleContentChange('image', e.target.value)}
              />
            </div>
            <div className="property-group">
              <label>Image Alt Text</label>
              <input
                type="text"
                value={content.imageAlt || ''}
                onChange={(e) => handleContentChange('imageAlt', e.target.value)}
              />
            </div>
          </>
        );

      default:
        return (
          <div className="property-group">
            <label>Title</label>
            <input
              type="text"
              value={section.title || ''}
              onChange={(e) => onUpdate({ title: e.target.value })}
            />
          </div>
        );
    }
  };

  return (
    <div className="properties-panel">
      <div className="properties-header">
        <h3>Section Properties</h3>
        <button onClick={onClose} className="btn-close">×</button>
      </div>
      
      <div className="properties-content">
        <div className="property-group">
          <label>Section Type</label>
          <input type="text" value={section.type} disabled />
        </div>
        
        {renderProperties()}

        <div className="property-group">
          <label>Visibility</label>
          <select
            value={section.isVisible ? 'visible' : 'hidden'}
            onChange={(e) => onUpdate({ isVisible: e.target.value === 'visible' })}
          >
            <option value="visible">Visible</option>
            <option value="hidden">Hidden</option>
          </select>
        </div>

        <div className="property-group">
          <label>Background Color</label>
          <input
            type="color"
            value={settings.backgroundColor || '#ffffff'}
            onChange={(e) => handleSettingsChange('backgroundColor', e.target.value)}
          />
        </div>

        <div className="property-group">
          <label>Padding Top (px)</label>
          <input
            type="number"
            value={settings.paddingTop || 0}
            onChange={(e) => handleSettingsChange('paddingTop', parseInt(e.target.value))}
          />
        </div>

        <div className="property-group">
          <label>Padding Bottom (px)</label>
          <input
            type="number"
            value={settings.paddingBottom || 0}
            onChange={(e) => handleSettingsChange('paddingBottom', parseInt(e.target.value))}
          />
        </div>
      </div>
    </div>
  );
}

// Section Library Modal
function SectionLibrary({ onSelect, onClose }) {
  const sectionTypes = [
    { type: 'hero', name: 'Hero', icon: '🎯', description: 'Full-width hero banner with heading, text, and CTA' },
    { type: 'about', name: 'About', icon: 'ℹ️', description: 'About us section with text and image' },
    { type: 'services', name: 'Services', icon: '🛠️', description: 'Showcase your services in a grid' },
    { type: 'features', name: 'Features', icon: '⭐', description: 'Highlight key features and benefits' },
    { type: 'cta', name: 'Call to Action', icon: '📢', description: 'Encourage user action with CTA' },
    { type: 'testimonials', name: 'Testimonials', icon: '💬', description: 'Display client testimonials' },
    { type: 'faq', name: 'FAQ', icon: '❓', description: 'Frequently asked questions accordion' },
    { type: 'gallery', name: 'Gallery', icon: '🖼️', description: 'Image gallery grid' },
    { type: 'contact', name: 'Contact', icon: '📧', description: 'Contact information and form' },
    { type: 'statistics', name: 'Statistics', icon: '📊', description: 'Display key metrics and numbers' },
    { type: 'team', name: 'Team', icon: '👥', description: 'Showcase team members' },
    { type: 'custom', name: 'Custom HTML', icon: '🔧', description: 'Add custom HTML code' }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Section</h2>
          <button onClick={onClose} className="btn-close">×</button>
        </div>
        
        <div className="section-library">
          {sectionTypes.map(item => (
            <div
              key={item.type}
              className="section-template"
              onClick={() => onSelect(item.type)}
            >
              <div className="template-icon">{item.icon}</div>
              <div className="template-info">
                <h3>{item.name}</h3>
                <p>{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Preview Modal
function PreviewModal({ page, sections, onClose }) {
  const [device, setDevice] = useState('desktop');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-fullscreen" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Preview</h2>
          <div className="preview-controls">
            <button 
              className={device === 'desktop' ? 'active' : ''}
              onClick={() => setDevice('desktop')}
            >
              🖥️ Desktop
            </button>
            <button 
              className={device === 'tablet' ? 'active' : ''}
              onClick={() => setDevice('tablet')}
            >
              📱 Tablet
            </button>
            <button 
              className={device === 'mobile' ? 'active' : ''}
              onClick={() => setDevice('mobile')}
            >
              📱 Mobile
            </button>
          </div>
          <button onClick={onClose} className="btn-close">×</button>
        </div>
        
        <div className="preview-container">
          <div className={`preview-device preview-${device}`}>
            <div className="preview-page">
              {sections.filter(s => !s.isDeleted && s.isVisible).map(section => (
                <SectionRenderer
                  key={section.id}
                  section={section}
                  isSelected={false}
                  onSelect={() => {}}
                  onUpdate={() => {}}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Page Settings Modal
function PageSettingsModal({ page, onClose, onUpdate }) {
  const [settings, setSettings] = useState({
    title: page.title || '',
    slug: page.slug || '',
    status: page.status || 'draft',
    visibility: page.visibility || 'public',
    password: page.password || '',
    metaTitle: page.seo?.metaTitle || '',
    metaDescription: page.seo?.metaDescription || '',
    canonical: page.seo?.canonical || '',
    ogImage: page.seo?.ogImage || ''
  });

  const handleSave = async () => {
    try {
      const res = await fetch(`/api/pages/${page.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...settings,
          seo: {
            metaTitle: settings.metaTitle,
            metaDescription: settings.metaDescription,
            canonical: settings.canonical,
            ogImage: settings.ogImage
          }
        })
      });

      if (res.ok) {
        onUpdate(settings);
        onClose();
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Page Settings</h2>
          <button onClick={onClose} className="btn-close">×</button>
        </div>
        
        <div className="modal-body">
          <div className="form-group">
            <label>Page Title</label>
            <input
              type="text"
              value={settings.title}
              onChange={(e) => setSettings({ ...settings, title: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>URL Slug</label>
            <input
              type="text"
              value={settings.slug}
              onChange={(e) => setSettings({ ...settings, slug: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Status</label>
            <select
              value={settings.status}
              onChange={(e) => setSettings({ ...settings, status: e.target.value })}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="form-group">
            <label>Visibility</label>
            <select
              value={settings.visibility}
              onChange={(e) => setSettings({ ...settings, visibility: e.target.value })}
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
              <option value="password">Password Protected</option>
            </select>
          </div>

          {settings.visibility === 'password' && (
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={settings.password}
                onChange={(e) => setSettings({ ...settings, password: e.target.value })}
              />
            </div>
          )}

          <hr />
          <h3>SEO Settings</h3>

          <div className="form-group">
            <label>Meta Title</label>
            <input
              type="text"
              value={settings.metaTitle}
              onChange={(e) => setSettings({ ...settings, metaTitle: e.target.value })}
              maxLength={60}
            />
          </div>

          <div className="form-group">
            <label>Meta Description</label>
            <textarea
              value={settings.metaDescription}
              onChange={(e) => setSettings({ ...settings, metaDescription: e.target.value })}
              maxLength={160}
              rows={3}
            />
          </div>

          <div className="form-group">
            <label>Canonical URL</label>
            <input
              type="text"
              value={settings.canonical}
              onChange={(e) => setSettings({ ...settings, canonical: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Open Graph Image</label>
            <input
              type="text"
              value={settings.ogImage}
              onChange={(e) => setSettings({ ...settings, ogImage: e.target.value })}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} className="btn-primary">Save Settings</button>
        </div>
      </div>
    </div>
  );
}