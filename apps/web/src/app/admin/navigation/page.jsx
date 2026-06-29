'use client';

import { useEffect, useState } from 'react';
import { navigationApi } from '@/lib/api.js';

export default function NavigationPage() {
  const [navigations, setNavigations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingNav, setEditingNav] = useState(null);
  
  const [location, setLocation] = useState('main');
  const [menuItems, setMenuItems] = useState([]);

  const projectId = 'demo';

  useEffect(() => {
    loadNavigations();
  }, []);

  async function loadNavigations() {
    try {
      setLoading(true);
      const data = await navigationApi.getAll(projectId);
      setNavigations(data.navigations || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleEdit = (nav) => {
    setEditingNav(nav);
    setLocation(nav.location || 'main');
    
    let itemsArray = [];
    try {
      itemsArray = typeof nav.items === 'string' ? JSON.parse(nav.items) : nav.items;
    } catch {
      itemsArray = [];
    }
    
    // Ensure structure of items: label, path, newTab, children
    const parsedItems = (itemsArray || []).map(item => ({
      label: item.label || '',
      path: item.path || item.url || '',
      newTab: item.newTab ?? false,
      children: (item.children || []).map(child => ({
        label: child.label || '',
        path: child.path || child.url || '',
        newTab: child.newTab ?? false,
      }))
    }));

    setMenuItems(parsedItems);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        location,
        items: JSON.stringify(menuItems),
        projectId,
      };

      if (editingNav) {
        await navigationApi.update(editingNav.id, payload);
      } else {
        await navigationApi.create(payload);
      }
      await loadNavigations();
      closeModal();
    } catch (err) {
      setError(err.message || 'Failed to save navigation menu');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this navigation menu?')) return;
    try {
      await navigationApi.delete(id);
      await loadNavigations();
    } catch (err) {
      setError(err.message);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingNav(null);
    setLocation('main');
    setMenuItems([]);
  };

  const handleAddMainItem = () => {
    setMenuItems([...menuItems, { label: 'New Item', path: '', newTab: false, children: [] }]);
  };

  const handleRemoveMainItem = (index) => {
    setMenuItems(menuItems.filter((_, i) => i !== index));
  };

  const handleMainItemChange = (index, field, value) => {
    setMenuItems(menuItems.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const moveMainItem = (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === menuItems.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...menuItems];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setMenuItems(updated);
  };

  // Sub-items (Dropdowns) functions
  const handleAddSubItem = (mainIndex) => {
    setMenuItems(menuItems.map((item, i) => {
      if (i === mainIndex) {
        return {
          ...item,
          children: [...(item.children || []), { label: 'New Sub-item', path: '', newTab: false }]
        };
      }
      return item;
    }));
  };

  const handleRemoveSubItem = (mainIndex, subIndex) => {
    setMenuItems(menuItems.map((item, i) => {
      if (i === mainIndex) {
        return {
          ...item,
          children: item.children.filter((_, j) => j !== subIndex)
        };
      }
      return item;
    }));
  };

  const handleSubItemChange = (mainIndex, subIndex, field, value) => {
    setMenuItems(menuItems.map((item, i) => {
      if (i === mainIndex) {
        const updatedChildren = item.children.map((child, j) => {
          if (j === subIndex) {
            return { ...child, [field]: value };
          }
          return child;
        });
        return { ...item, children: updatedChildren };
      }
      return item;
    }));
  };

  const getLocationLabel = (loc) => {
    const labels = {
      main: 'Main Navigation',
      footer: 'Footer Navigation',
      mobile: 'Mobile Menu',
    };
    return labels[loc] || loc;
  };

  return (
    <div className="navigation-page">
      <div className="page-header">
        <h1>Navigation Menus</h1>
        <button onClick={() => { setShowModal(true); setMenuItems([]); }} className="btn-primary">+ New Menu</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading">Loading navigation menus...</div>
      ) : navigations.length === 0 ? (
        <div className="empty-state">
          <p>No navigation menus yet. Create your first menu to get started.</p>
        </div>
      ) : (
        <div className="navigation-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {navigations.map(nav => (
            <div key={nav.id} className="navigation-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <h4 style={{ fontSize: '1.15rem', color: 'var(--text-h1)', margin: 0 }}>{getLocationLabel(nav.location)}</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Key: <code>{nav.location}</code></p>
              <div className="card-actions" style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button onClick={() => handleEdit(nav)} className="btn-sm" style={{ flex: 1 }}>Edit Menu</button>
                <button onClick={() => handleDelete(nav.id)} className="btn-sm btn-danger" style={{ flex: 1 }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingNav ? 'Edit Navigation Menu' : 'New Navigation Menu'}</h2>
              <button onClick={closeModal} className="modal-close">×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Location / Key *</label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                >
                  <option value="main">Main Navigation</option>
                  <option value="footer">Footer Navigation</option>
                  <option value="mobile">Mobile Menu</option>
                </select>
              </div>

              {/* Menu Item Builder */}
              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem', marginTop: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--text-h1)', margin: 0 }}>Menu Item List</h3>
                  <button type="button" className="btn-sm" onClick={handleAddMainItem}>+ Add Menu Item</button>
                </div>

                {menuItems.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)', background: 'var(--bg-base)', border: '1px dashed var(--border-strong)', borderRadius: 'var(--radius-md)' }}>
                    No menu items built yet. Click "+ Add Menu Item" to start.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxHeight: '420px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                    {menuItems.map((item, index) => (
                      <div 
                        key={index} 
                        style={{ 
                          background: 'rgba(255,255,255,0.01)', 
                          padding: '1.25rem', 
                          borderRadius: 'var(--radius-md)', 
                          border: '1px solid var(--border-light)',
                          position: 'relative'
                        }}
                      >
                        {/* Main Item Controls */}
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                            <input 
                              type="text" 
                              value={item.label} 
                              onChange={(e) => handleMainItemChange(index, 'label', e.target.value)}
                              placeholder="Label (e.g. Products)"
                              required
                              style={{ padding: '0.4rem' }}
                            />
                            <input 
                              type="text" 
                              value={item.path} 
                              onChange={(e) => handleMainItemChange(index, 'path', e.target.value)}
                              placeholder="Path (e.g. /products or https://...)"
                              required
                              style={{ padding: '0.4rem' }}
                            />
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.5rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', cursor: 'pointer', margin: 0, whiteSpace: 'nowrap' }}>
                              <input 
                                type="checkbox" 
                                checked={item.newTab} 
                                onChange={(e) => handleMainItemChange(index, 'newTab', e.target.checked)}
                              />
                              New Tab
                            </label>
                            
                            <button 
                              type="button" 
                              className="btn-sm" 
                              style={{ padding: '0.25rem 0.5rem' }} 
                              onClick={() => moveMainItem(index, 'up')}
                              disabled={index === 0}
                            >
                              ▲
                            </button>
                            <button 
                              type="button" 
                              className="btn-sm" 
                              style={{ padding: '0.25rem 0.5rem' }} 
                              onClick={() => moveMainItem(index, 'down')}
                              disabled={index === menuItems.length - 1}
                            >
                              ▼
                            </button>
                            <button 
                              type="button" 
                              className="btn-sm btn-danger" 
                              style={{ padding: '0.4rem 0.6rem' }} 
                              onClick={() => handleRemoveMainItem(index)}
                            >
                              🗑️
                            </button>
                          </div>
                        </div>

                        {/* Nested Dropdown Sub-Items */}
                        <div style={{ marginTop: '1rem', paddingLeft: '1.5rem', borderLeft: '2px solid var(--border-light)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Dropdown Sub-items</span>
                            <button type="button" className="btn-sm" style={{ padding: '0.15rem 0.4rem', fontSize: '0.7rem' }} onClick={() => handleAddSubItem(index)}>
                              + Add Sub-item
                            </button>
                          </div>

                          {(item.children || []).length === 0 ? (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.25rem 0' }}>
                              No sub-items (plain link, no dropdown).
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              {item.children.map((sub, subIndex) => (
                                <div key={subIndex} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                  <input 
                                    type="text" 
                                    value={sub.label} 
                                    onChange={(e) => handleSubItemChange(index, subIndex, 'label', e.target.value)}
                                    placeholder="Sub-label (e.g. Web Apps)"
                                    required
                                    style={{ flex: 1, padding: '0.35rem', fontSize: '0.8rem' }}
                                  />
                                  <input 
                                    type="text" 
                                    value={sub.path} 
                                    onChange={(e) => handleSubItemChange(index, subIndex, 'path', e.target.value)}
                                    placeholder="Sub-path (e.g. /services/web)"
                                    required
                                    style={{ flex: 1, padding: '0.35rem', fontSize: '0.8rem' }}
                                  />
                                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', cursor: 'pointer', margin: 0, whiteSpace: 'nowrap' }}>
                                    <input 
                                      type="checkbox" 
                                      checked={sub.newTab} 
                                      onChange={(e) => handleSubItemChange(index, subIndex, 'newTab', e.target.checked)}
                                    />
                                    New Tab
                                  </label>
                                  <button 
                                    type="button" 
                                    className="btn-sm btn-danger" 
                                    style={{ padding: '0.35rem 0.5rem' }} 
                                    onClick={() => handleRemoveSubItem(index, subIndex)}
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

              <div className="modal-actions" style={{ marginTop: '1.5rem', background: 'none', padding: '1rem 0 0' }}>
                <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">{editingNav ? 'Save Menu' : 'Create Menu'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}