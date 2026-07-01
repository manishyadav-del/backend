'use client';

import { useEffect, useState, useCallback } from 'react';

const LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
};

// Pre-built template configurations
const PREBUILT_LIBRARY = [
  {
    id: 'library-weekly-tips',
    name: 'Weekly Health Tips',
    subject: 'Healthy Habits for a Better Week',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background: #10b981; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">A Health Place</h1>
          <p style="margin: 5px 0 0 0; font-size: 14px;">Your Trusted Health Advisor</p>
        </div>
        <div style="padding: 20px; line-height: 1.6; color: #334155;">
          <h2>5 Simple Habits for Heart Health</h2>
          <p>Maintaining a healthy heart doesn't require a complete lifestyle overhaul. Simple, consistent daily habits can make a massive difference. Here are 5 quick tips to incorporate today:</p>
          <ul>
            <li>Take a 30-minute brisk walk.</li>
            <li>Incorporate leafy greens into your lunch.</li>
            <li>Drink at least 8 glasses of water.</li>
            <li>Reduce sugar intake.</li>
            <li>Aim for 7-8 hours of quality sleep.</li>
          </ul>
        </div>
        <div style="background: #f8fafc; padding: 15px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
          &copy; 2026 A Health Place. All rights reserved.<br>
          <a href="#" style="color: #10b981; text-decoration: none;">Unsubscribe</a>
        </div>
      </div>
    `
  },
  {
    id: 'library-welcome',
    name: 'Welcome Onboarding',
    subject: 'Welcome to A Health Place!',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background: #3b82f6; color: white; padding: 25px; text-align: center;">
          <h1 style="margin: 0; font-size: 26px;">Welcome to the Family!</h1>
          <p style="margin: 5px 0 0 0; font-size: 14px;">We are glad you are here</p>
        </div>
        <div style="padding: 20px; line-height: 1.6; color: #334155; text-align: center;">
          <h2>Hello and Welcome,</h2>
          <p>Thank you for subscribing to our updates. You will be the first to receive critical health updates, wellness bulletins, and expert medical advice directly in your inbox.</p>
          <div style="margin: 25px 0;">
            <a href="https://ahealthplace.com" style="background: #3b82f6; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Explore Our Services</a>
          </div>
        </div>
        <div style="background: #f8fafc; padding: 15px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
          &copy; 2026 A Health Place. All rights reserved.<br>
          <a href="#" style="color: #3b82f6; text-decoration: none;">Unsubscribe</a>
        </div>
      </div>
    `
  }
];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [loadingState, setLoadingState] = useState(LOADING_STATES.LOADING);
  const [error, setError] = useState(null);

  // Editor states
  const [editingTemplate, setEditingTemplate] = useState(null); // id or 'new'
  const [editorData, setEditorData] = useState({
    name: '',
    subject: '',
    htmlContent: ''
  });

  const projectId = 'demo';

  const fetchData = useCallback(async () => {
    try {
      setLoadingState(LOADING_STATES.LOADING);
      const res = await fetch(`/api/templates?projectId=${projectId}`);
      if (!res.ok) throw new Error('Failed to fetch templates');
      const data = await res.json();
      if (data.success) {
        setTemplates(data.templates || []);
        setLoadingState(LOADING_STATES.SUCCESS);
      } else {
        throw new Error(data.error || 'Failed to load templates');
      }
    } catch (err) {
      setError(err.message);
      setLoadingState(LOADING_STATES.ERROR);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenEditor = (temp) => {
    if (temp === 'new') {
      setEditingTemplate('new');
      setEditorData({
        name: '',
        subject: '',
        htmlContent: `
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
  <h1 style="color: #2563eb;">New Newsletter</h1>
  <p>Write your premium HTML content here.</p>
</div>
        `.trim()
      });
    } else {
      setEditingTemplate(temp.id);
      setEditorData({
        name: temp.name,
        subject: temp.subject || '',
        htmlContent: temp.htmlContent
      });
    }
  };

  const handleUseLibrary = (libTemp) => {
    setEditingTemplate('new');
    setEditorData({
      name: `Copy of ${libTemp.name}`,
      subject: libTemp.subject,
      htmlContent: libTemp.htmlContent.trim()
    });
  };

  const handleSaveEditor = async (e) => {
    e.preventDefault();
    if (!editorData.name || !editorData.htmlContent) return;

    try {
      let res;
      if (editingTemplate === 'new') {
        res = await fetch('/api/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, ...editorData })
        });
      } else {
        res = await fetch(`/api/templates/${editingTemplate}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...editorData })
        });
      }

      const data = await res.json();
      if (data.success) {
        setEditingTemplate(null);
        fetchData();
      } else {
        alert(data.error || 'Failed to save template');
      }
    } catch {
      alert('Error saving template');
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        alert(data.error || 'Failed to delete template');
      }
    } catch {
      alert('Error deleting template');
    }
  };

  // Simple builder helpers
  const appendBlock = (type) => {
    let blockHtml = '';
    if (type === 'header') {
      blockHtml = `\n<div style="background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 4px;">\n  <h2 style="margin:0;">Healthcare Updates</h2>\n</div>\n`;
    } else if (type === 'text') {
      blockHtml = `\n<p style="color: #475569; font-size: 15px; line-height: 1.6;">Enter details about your latest medical services, patient care recommendations, or upcoming appointment windows here.</p>\n`;
    } else if (type === 'button') {
      blockHtml = `\n<div style="text-align: center; margin: 15px 0;">\n  <a href="#" style="background: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Book Appointment</a>\n</div>\n`;
    } else if (type === 'footer') {
      blockHtml = `\n<div style="text-align: center; margin-top: 30px; padding-top: 15px; border-top: 1px solid #eee; font-size: 12px; color: #94a3b8;">\n  &copy; 2026 A Health Place. All rights reserved.\n</div>\n`;
    }

    setEditorData(prev => ({
      ...prev,
      htmlContent: prev.htmlContent + blockHtml
    }));
  };

  if (loadingState === LOADING_STATES.LOADING && !editingTemplate) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading newsletter templates...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {editingTemplate ? (
        /* Visual HTML Editor Page */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-h1)', margin: 0 }}>Visual Newsletter Builder</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: '0.15rem 0 0' }}>Configure components, edit source HTML, and preview the email output.</p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" className="btn-secondary" style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }} onClick={() => setEditingTemplate(null)}>Cancel</button>
              <button type="button" className="btn-primary" style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }} onClick={handleSaveEditor}>💾 Save Template</button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', height: '620px', alignItems: 'stretch' }}>
            {/* Editor Workspace & Blocks */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.72rem', fontWeight: 600 }}>Template Name</label>
                  <input 
                    type="text" 
                    value={editorData.name} 
                    onChange={(e) => setEditorData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Health Tips Bulletin"
                    style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.72rem', fontWeight: 600 }}>Default Email Subject</label>
                  <input 
                    type="text" 
                    value={editorData.subject} 
                    onChange={(e) => setEditorData(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="e.g. Stay Healthy This Summer!"
                    style={{ padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              {/* Layout Helper Blocks */}
              <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', color: 'var(--text-secondary)', marginRight: '0.5rem' }}>⚡ Click to insert blocks:</span>
                <button type="button" className="btn-secondary" style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }} onClick={() => appendBlock('header')}>Header</button>
                <button type="button" className="btn-secondary" style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }} onClick={() => appendBlock('text')}>Paragraph</button>
                <button type="button" className="btn-secondary" style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }} onClick={() => appendBlock('button')}>CTA Button</button>
                <button type="button" className="btn-secondary" style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }} onClick={() => appendBlock('footer')}>Footer</button>
              </div>

              {/* Code TextArea */}
              <textarea 
                value={editorData.htmlContent}
                onChange={(e) => setEditorData(prev => ({ ...prev, htmlContent: e.target.value }))}
                style={{ flex: 1, padding: '0.5rem', border: '1px solid var(--border-light)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)', fontFamily: 'monospace', fontSize: '0.78rem', resize: 'none' }}
              />
            </div>

            {/* Live Email Mock Preview Column */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-h1)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>👀 Live Output Preview</h3>
              <div 
                style={{ flex: 1, background: '#fff', border: '1px solid #ddd', borderRadius: '4px', overflowY: 'auto', padding: '10px' }}
                dangerouslySetInnerHTML={{ __html: editorData.htmlContent }}
              />
            </div>
          </div>
        </div>
      ) : (
        /* Templates List Page */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-h1)', margin: 0 }}>Newsletter Templates</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.25rem 0 0' }}>Manage customized newsletter layouts, email signatures, and campaign templates.</p>
            </div>
            <button className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }} onClick={() => handleOpenEditor('new')}>
              ➕ Custom Template
            </button>
          </div>

          {/* Prebuilt Library Section */}
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.75rem 0', color: 'var(--text-h1)' }}>🎨 Pre-built Template Library</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              {PREBUILT_LIBRARY.map(lib => (
                <div key={lib.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-h1)', fontWeight: 'bold' }}>{lib.name}</h3>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Subject: {lib.subject}</p>
                  </div>
                  <button className="btn-secondary" style={{ fontSize: '0.72rem', padding: '0.35rem 0.75rem' }} onClick={() => handleUseLibrary(lib)}>
                    Use Layout
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Custom templates */}
          <div style={{ marginTop: '1rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 0.75rem 0', color: 'var(--text-h1)' }}>👤 Custom Designed Layouts</h2>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '1.25rem' }}>
              {templates.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                  {templates.map(temp => (
                    <div key={temp.id} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', padding: '1rem', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <h3 style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text-h1)', fontWeight: 'bold' }}>{temp.name}</h3>
                      <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>Created: {new Date(temp.createdAt).toLocaleDateString()}</p>
                      
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <button className="btn-secondary" style={{ flex: 1, fontSize: '0.7rem', padding: '0.25rem' }} onClick={() => handleOpenEditor(temp)}>Edit</button>
                        <button className="btn-secondary" style={{ flex: 1, fontSize: '0.7rem', padding: '0.25rem', color: 'var(--danger)' }} onClick={() => handleDeleteTemplate(temp.id)}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No custom templates saved yet. Click Custom Template above to build one.</div>
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
