'use client';

import { useEffect, useState } from 'react';
import { mediaApi } from '@/lib/api.js';

export default function MediaPage() {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modals state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  
  // Form states
  const [editingMedia, setEditingMedia] = useState(null);
  const [editForm, setEditForm] = useState({
    altText: '',
    folder: 'root',
    originalName: '',
  });

  const projectId = 'default';

  useEffect(() => {
    loadMedia();
  }, []);

  const loadMedia = async () => {
    try {
      setLoading(true);
      const data = await mediaApi.getAll(projectId);
      setMedia(data.media || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    setError(null);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress(`Uploading ${i + 1}/${files.length}: ${file.name}...`);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectId', projectId);

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to upload file');
        }

        // Save to DB
        await mediaApi.create({
          projectId,
          filename: data.filename,
          originalName: data.originalName,
          url: data.url,
          mimeType: data.mimeType,
          size: data.size,
          altText: '',
          folder: 'root',
        });
      } catch (err) {
        setError(err.message || 'Upload failed');
        setUploading(false);
        return;
      }
    }

    setUploading(false);
    setUploadProgress('');
    setShowUploadModal(false);
    loadMedia();
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingMedia) return;

    try {
      await mediaApi.update(editingMedia.id, {
        altText: editForm.altText,
        folder: editForm.folder,
        originalName: editForm.originalName,
      });
      await loadMedia();
      setShowEditModal(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (item) => {
    setEditingMedia(item);
    setEditForm({
      altText: item.altText || '',
      folder: item.folder || 'root',
      originalName: item.originalName || '',
    });
    setShowEditModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this media file? This is permanent.')) return;
    try {
      await mediaApi.delete(id);
      await loadMedia();
    } catch (err) {
      setError(err.message);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType) => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.includes('pdf')) return '📄';
    return '📎';
  };

  return (
    <div className="media-page">
      <div className="page-header">
        <h1>Media Library</h1>
        <button onClick={() => setShowUploadModal(true)} className="btn-primary">+ Upload Media</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading">Loading media...</div>
      ) : media.length === 0 ? (
        <div className="empty-state">
          <p>No media files yet. Upload your first file to get started.</p>
        </div>
      ) : (
        <div className="media-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem' }}>
          {media.map(item => (
            <div key={item.id} className="media-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative', overflow: 'hidden' }}>
              {item.mimeType?.startsWith('image/') ? (
                <div style={{ height: '140px', width: '100%', borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={item.url} alt={item.altText || item.originalName} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                </div>
              ) : (
                <div style={{ height: '140px', width: '100%', borderRadius: 'var(--radius-sm)', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>
                  {getFileIcon(item.mimeType)}
                </div>
              )}
              
              <div className="media-info" style={{ flex: 1 }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-h1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.originalName}>
                  {item.originalName}
                </h4>
                <p className="media-meta" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  {formatFileSize(item.size)} • {item.mimeType.split('/')[1]?.toUpperCase() || 'FILE'}
                </p>
                {item.altText && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    Alt: {item.altText}
                  </p>
                )}
              </div>
              
              <div className="card-actions" style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                <button onClick={() => handleEdit(item)} className="btn-sm" style={{ flex: 1 }}>Edit</button>
                <button onClick={() => handleDelete(item.id)} className="btn-sm btn-danger" style={{ flex: 1 }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => !uploading && setShowUploadModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Upload Files</h2>
              <button onClick={() => !uploading && setShowUploadModal(false)} className="modal-close" disabled={uploading}>×</button>
            </div>
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              {uploading ? (
                <div>
                  <div className="spinner" style={{ margin: '0 auto 1.5rem', width: '40px', height: '40px' }} />
                  <p style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{uploadProgress}</p>
                </div>
              ) : (
                <div 
                  style={{ 
                    border: '2px dashed var(--border-strong)', 
                    borderRadius: 'var(--radius-md)', 
                    padding: '3rem 2rem', 
                    cursor: 'pointer',
                    background: 'rgba(255,255,255,0.01)',
                    transition: 'var(--transition)'
                  }}
                  onClick={() => document.getElementById('file-input').click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const files = e.dataTransfer.files;
                    if (files.length > 0) {
                      const mockEvent = { target: { files } };
                      handleFileUpload(mockEvent);
                    }
                  }}
                >
                  <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>📁</div>
                  <h3 style={{ fontSize: '1.15rem', color: 'var(--text-h1)', marginBottom: '0.5rem' }}>Drag &amp; Drop files here</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Or click to select files from your computer</p>
                  <button type="button" className="btn-secondary">Select Files</button>
                  <input 
                    type="file" 
                    id="file-input" 
                    multiple 
                    style={{ display: 'none' }} 
                    onChange={handleFileUpload}
                    accept="image/*,.pdf"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Media Properties</h2>
              <button onClick={() => setShowEditModal(false)} className="modal-close">×</button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label>Display Name</label>
                <input
                  type="text"
                  value={editForm.originalName}
                  onChange={(e) => setEditForm({ ...editForm, originalName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Alt Text (SEO)</label>
                <input
                  type="text"
                  value={editForm.altText}
                  onChange={(e) => setEditForm({ ...editForm, altText: e.target.value })}
                  placeholder="Describe the image..."
                />
              </div>

              <div className="form-group">
                <label>Folder Path</label>
                <input
                  type="text"
                  value={editForm.folder}
                  onChange={(e) => setEditForm({ ...editForm, folder: e.target.value })}
                  placeholder="root"
                />
              </div>

              <div className="modal-actions" style={{ marginTop: '1.5rem', background: 'none', padding: '1rem 0 0' }}>
                <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}