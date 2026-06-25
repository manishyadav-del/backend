'use client';

import { useEffect, useState } from 'react';
import { mediaApi } from '@/lib/api.js';

export default function MediaPage() {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modals & Panels state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  
  // Filtering & Sorting state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedFolder, setSelectedFolder] = useState('All');
  const [customFolders, setCustomFolders] = useState([]);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  // Compression setting state
  const [compressImages, setCompressImages] = useState(true);
  const [compressQuality, setCompressQuality] = useState(75);
  
  // Edit Form state inside details panel
  const [editForm, setEditForm] = useState({
    originalName: '',
    altText: '',
    folder: 'root',
  });

  const [websites, setWebsites] = useState([]);
  const [projectId, setProjectId] = useState('demo');

  useEffect(() => {
    const loadWebsites = async () => {
      try {
        const res = await fetch('/api/websites');
        const data = await res.json();
        if (res.ok && data.success && Array.isArray(data.data) && data.data.length > 0) {
          setWebsites(data.data);
          setProjectId(data.data[0].id);
        }
      } catch (err) {
        console.error('Failed to load websites:', err);
      }
    };
    loadWebsites();
  }, []);

  useEffect(() => {
    if (projectId) {
      loadMedia(projectId);
    }
  }, [projectId]);

  useEffect(() => {
    if (selectedMedia) {
      setEditForm({
        originalName: selectedMedia.originalName || '',
        altText: selectedMedia.altText || '',
        folder: selectedMedia.folder || 'root',
      });
    }
  }, [selectedMedia]);

  const loadMedia = async (pId = projectId) => {
    if (!pId) return;
    try {
      setLoading(true);
      const data = await mediaApi.getAll(pId);
      setMedia(data.media || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // HTML5 client-side canvas image compression utility
  const compressImage = (file, qualityPercent) => {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.type === 'image/svg+xml') {
        return resolve(file);
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Limit resolution for optimal web load times
          const MAX_WIDTH = 1920;
          const MAX_HEIGHT = 1080;
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          canvas.toBlob(
            (blob) => {
              if (!blob) return resolve(file);
              const compressedFile = new File([blob], file.name, {
                type: mime,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            },
            mime,
            qualityPercent / 100
          );
        };
        img.onerror = () => resolve(file);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    });
  };

  // Helper to read image dimensions
  const getImageDimensions = (file) => {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/')) {
        return resolve({ width: null, height: null });
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          resolve({ width: img.width, height: img.height });
        };
        img.onerror = () => resolve({ width: null, height: null });
        img.src = e.target.result;
      };
      reader.onerror = () => resolve({ width: null, height: null });
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    setError(null);

    for (let i = 0; i < files.length; i++) {
      let file = files[i];
      setUploadProgress(`Processing ${i + 1}/${files.length}: ${file.name}...`);

      try {
        let width = null;
        let height = null;

        // Perform compression if enabled and file is image
        if (compressImages && file.type.startsWith('image/')) {
          setUploadProgress(`Compressing ${file.name}...`);
          file = await compressImage(file, compressQuality);
        }

        // Get dimensions
        if (file.type.startsWith('image/')) {
          const dims = await getImageDimensions(file);
          width = dims.width;
          height = dims.height;
        }

        setUploadProgress(`Uploading ${file.name}...`);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('projectId', projectId);

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
          folder: selectedFolder === 'All' ? 'root' : selectedFolder,
          width,
          height,
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

  const handleReplaceUpload = async (e, targetId) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setUploadProgress(`Compressing and uploading replacement...`);

    try {
      let fileToUpload = file;
      let width = null;
      let height = null;

      if (compressImages && file.type.startsWith('image/')) {
        fileToUpload = await compressImage(file, compressQuality);
      }

      if (fileToUpload.type.startsWith('image/')) {
        const dims = await getImageDimensions(fileToUpload);
        width = dims.width;
        height = dims.height;
      }

      const formData = new FormData();
      formData.append('file', fileToUpload);
      formData.append('projectId', projectId);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload replacement file');
      }

      // Update existing database entry
      const updated = await mediaApi.update(targetId, {
        filename: data.filename,
        originalName: data.originalName,
        url: data.url,
        mimeType: data.mimeType,
        size: data.size,
        width,
        height,
      });

      // Update details in selectedMedia
      setSelectedMedia(updated.media);
      await loadMedia();
    } catch (err) {
      setError(err.message || 'Replacement failed');
    } finally {
      setUploading(false);
      setUploadProgress('');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMedia) return;

    try {
      const updated = await mediaApi.update(selectedMedia.id, {
        altText: editForm.altText,
        folder: editForm.folder || 'root',
        originalName: editForm.originalName,
      });
      setSelectedMedia(updated.media);
      await loadMedia();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this media file? This is permanent.')) return;
    try {
      await mediaApi.delete(id);
      setSelectedMedia(null);
      await loadMedia();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCopyUrl = (url, id) => {
    const fullUrl = window.location.origin + url;
    navigator.clipboard.writeText(fullUrl)
      .then(() => {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      })
      .catch((err) => {
        console.error('Failed to copy URL:', err);
      });
  };

  const handleCreateFolder = (e) => {
    e.preventDefault();
    const folderName = newFolderName.trim().toLowerCase();
    if (folderName && !allFolders.includes(folderName)) {
      setCustomFolders([...customFolders, folderName]);
      setSelectedFolder(folderName);
    }
    setNewFolderName('');
    setShowNewFolderModal(false);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType) => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.includes('pdf')) return '📄';
    return '📎';
  };

  // Derive unique folders dynamically
  const allFolders = Array.from(
    new Set([
      'All',
      'root',
      ...media.map((item) => item.folder || 'root'),
      ...customFolders,
    ])
  );

  // Storage total size
  const totalSize = media.reduce((acc, curr) => acc + (curr.size || 0), 0);

  // Filter items
  const filteredMedia = media.filter((item) => {
    const matchesSearch =
      item.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.altText && item.altText.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesFolder =
      selectedFolder === 'All' ||
      (selectedFolder === 'root' && (!item.folder || item.folder === 'root')) ||
      item.folder === selectedFolder;
    
    return matchesSearch && matchesFolder;
  });

  // Sort items
  const sortedMedia = [...filteredMedia].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
    if (sortBy === 'name') return a.originalName.localeCompare(b.originalName);
    if (sortBy === 'size-large') return b.size - a.size;
    if (sortBy === 'size-small') return a.size - b.size;
    return 0;
  });

  return (
    <div className="media-page" style={{ position: 'relative', minHeight: '80vh' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <h1 style={{ margin: 0 }}>Media Library</h1>
          {websites.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Project:</span>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.4rem 1.5rem 0.4rem 0.75rem',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {websites.map(site => (
                  <option key={site.id} value={site.id}>{site.name} ({site.domain})</option>
                ))}
              </select>
            </div>
          )}
        </div>
        <button onClick={() => setShowUploadModal(true)} className="btn-primary">+ Upload Media</button>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}

      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
        {/* Left Sidebar: Folders & Stats */}
        <div style={{
          flex: '1 1 240px',
          maxWidth: '280px',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          background: 'var(--gradient-card)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem',
          height: 'fit-content'
        }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-h1)', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>Folders</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {allFolders.map(folder => {
              const fileCount = media.filter(m => 
                folder === 'All' || 
                m.folder === folder || 
                (folder === 'root' && (!m.folder || m.folder === 'root'))
              ).length;

              return (
                <button 
                  key={folder} 
                  onClick={() => setSelectedFolder(folder)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.75rem',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    background: selectedFolder === folder ? 'var(--primary-light)' : 'transparent',
                    color: selectedFolder === folder ? 'var(--primary)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontWeight: selectedFolder === folder ? 600 : 500,
                    fontSize: '0.875rem',
                    transition: 'var(--transition)'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>📁</span>
                    <span style={{ textTransform: 'capitalize' }}>{folder}</span>
                  </span>
                  <span style={{ fontSize: '0.75rem', opacity: 0.7, background: selectedFolder === folder ? 'rgba(14,165,233,0.1)' : 'rgba(255,255,255,0.05)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                    {fileCount}
                  </span>
                </button>
              );
            })}
          </div>

          <button 
            onClick={() => setShowNewFolderModal(true)} 
            style={{
              padding: '0.6rem',
              border: '1px dashed var(--border-strong)',
              borderRadius: 'var(--radius-sm)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '0.85rem',
              textAlign: 'center',
              fontWeight: 500,
              transition: 'var(--transition)'
            }}
            onMouseOver={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
            onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
          >
            + New Folder
          </button>

          <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-h1)', marginBottom: '0.5rem' }}>Storage Usage</h4>
            <div style={{ background: 'var(--bg-base)', height: '8px', borderRadius: 'var(--radius-pill)', overflow: 'hidden', marginBottom: '0.5rem' }}>
              <div style={{ background: 'var(--primary)', width: `${Math.min(100, (totalSize / (50 * 1024 * 1024)) * 100)}%`, height: '100%', borderRadius: 'inherit', transition: 'width 0.3s ease' }} />
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {formatFileSize(totalSize)} of 50 MB used
            </p>
          </div>
        </div>

        {/* Right Area: Search, Sort, Grid */}
        <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Filters Bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem 1.25rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '220px' }}>
              <span style={{ color: 'var(--text-muted)' }}>🔍</span>
              <input
                type="text"
                placeholder="Search by name or alt text..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem'
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  background: 'var(--bg-base)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.4rem 0.75rem',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name">Name (A-Z)</option>
                <option value="size-large">Size (Large-Small)</option>
                <option value="size-small">Size (Small-Large)</option>
              </select>
            </div>
          </div>

          {/* Grid Area */}
          {loading ? (
            <div className="loading" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading media library...</div>
          ) : sortedMedia.length === 0 ? (
            <div className="empty-state" style={{
              background: 'var(--gradient-card)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-md)',
              padding: '5rem 2rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem'
            }}>
              <span style={{ fontSize: '3rem' }}>📁</span>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--text-h1)' }}>No media files found</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '360px' }}>
                {searchQuery ? 'No files match your search filter.' : `This folder (${selectedFolder}) is empty. Upload files to get started.`}
              </p>
            </div>
          ) : (
            <div className="media-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1.25rem' }}>
              {sortedMedia.map(item => (
                <div 
                  key={item.id} 
                  className="media-card" 
                  onClick={() => setSelectedMedia(item)}
                  style={{
                    background: 'var(--gradient-card)',
                    border: selectedMedia?.id === item.id ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.6rem',
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'var(--transition)',
                    boxShadow: selectedMedia?.id === item.id ? 'var(--shadow-glow)' : 'var(--shadow-sm)'
                  }}
                  onMouseOver={(e) => { if (selectedMedia?.id !== item.id) e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
                  onMouseOut={(e) => { if (selectedMedia?.id !== item.id) e.currentTarget.style.borderColor = 'var(--border-light)'; }}
                >
                  {item.mimeType?.startsWith('image/') ? (
                    <div style={{ height: '120px', width: '100%', borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src={item.url} alt={item.altText || item.originalName} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                    </div>
                  ) : (
                    <div style={{ height: '120px', width: '100%', borderRadius: 'var(--radius-sm)', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>
                      {getFileIcon(item.mimeType)}
                    </div>
                  )}
                  
                  <div className="media-info" style={{ overflow: 'hidden' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-h1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.originalName}>
                      {item.originalName}
                    </h4>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                      {formatFileSize(item.size)} • {item.mimeType.split('/')[1]?.toUpperCase() || 'FILE'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* File Info Details Panel (Sliding Drawer on the Right) */}
      {selectedMedia && (
        <>
          <div 
            onClick={() => setSelectedMedia(null)} 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              background: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(2px)',
              zIndex: 999
            }}
          />
          <div style={{
            position: 'fixed',
            top: 0,
            right: 0,
            height: '100vh',
            width: '420px',
            background: 'var(--bg-card)',
            borderLeft: '1px solid var(--border-light)',
            zIndex: 1000,
            overflowY: 'auto',
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            boxShadow: '-10px 0 30px rgba(0,0,0,0.5)',
            animation: 'slideIn 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            {/* Slide-in animation stylesheet */}
            <style dangerouslySetInnerHTML={{__html: `
              @keyframes slideIn {
                from { transform: translateX(100%); }
                to { transform: translateX(0); }
              }
            `}} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-h1)' }}>File Details</h2>
              <button 
                onClick={() => setSelectedMedia(null)} 
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  padding: '0.2rem'
                }}
              >
                ×
              </button>
            </div>

            {/* Preview Section */}
            <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px', maxHeight: '300px', overflow: 'hidden' }}>
              {selectedMedia.mimeType?.startsWith('image/') ? (
                <img src={selectedMedia.url} alt={selectedMedia.altText || selectedMedia.originalName} style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: 'var(--radius-sm)' }} />
              ) : selectedMedia.mimeType?.startsWith('video/') ? (
                <video src={selectedMedia.url} controls style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: 'var(--radius-sm)' }} />
              ) : selectedMedia.mimeType?.startsWith('audio/') ? (
                <audio src={selectedMedia.url} controls style={{ width: '100%' }} />
              ) : selectedMedia.mimeType?.includes('pdf') ? (
                <iframe src={selectedMedia.url} style={{ width: '100%', height: '200px', border: 'none', borderRadius: 'var(--radius-sm)' }} title="pdf preview" />
              ) : (
                <div style={{ fontSize: '4rem' }}>{getFileIcon(selectedMedia.mimeType)}</div>
              )}
            </div>

            {/* Quick Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', background: 'var(--bg-base)', borderRadius: 'var(--radius-md)', padding: '1rem', border: '1px solid var(--border-light)' }}>
              <div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>File Size</p>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{formatFileSize(selectedMedia.size)}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Type</p>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{selectedMedia.mimeType.split('/')[1]?.toUpperCase() || 'FILE'}</p>
              </div>
              {selectedMedia.width && selectedMedia.height && (
                <div style={{ gridColumn: 'span 2', marginTop: '0.25rem' }}>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Dimensions</p>
                  <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{selectedMedia.width} × {selectedMedia.height} pixels</p>
                </div>
              )}
              <div style={{ gridColumn: 'span 2', marginTop: '0.25rem' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Created At</p>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{new Date(selectedMedia.createdAt).toLocaleString()}</p>
              </div>
            </div>

            {/* Actions: Copy Link, Download, Replace */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              <button 
                onClick={() => handleCopyUrl(selectedMedia.url, selectedMedia.id)} 
                className="btn-sm" 
                style={{ flex: 1, minWidth: '110px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.6rem 0.75rem' }}
              >
                <span>{copiedId === selectedMedia.id ? '✓' : '🔗'}</span>
                <span>{copiedId === selectedMedia.id ? 'Copied!' : 'Copy URL'}</span>
              </button>

              <a 
                href={selectedMedia.url} 
                download={selectedMedia.originalName} 
                className="btn-sm btn-secondary" 
                style={{ flex: 1, minWidth: '110px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', textDecoration: 'none', padding: '0.6rem 0.75rem' }}
              >
                <span>📥</span>
                <span>Download</span>
              </a>

              <button 
                onClick={() => document.getElementById('replace-file-input').click()}
                className="btn-sm btn-secondary"
                disabled={uploading}
                style={{ flex: '1 1 100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.6rem 0.75rem', marginTop: '0.25rem' }}
              >
                🔄 Replace File
              </button>
              <input 
                type="file" 
                id="replace-file-input" 
                style={{ display: 'none' }} 
                onChange={(e) => handleReplaceUpload(e, selectedMedia.id)}
                accept="image/*,.pdf"
              />
            </div>

            {/* Editing Form */}
            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Display Name / Rename</label>
                <input
                  type="text"
                  value={editForm.originalName}
                  onChange={(e) => setEditForm({ ...editForm, originalName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Alt Text (SEO)</label>
                <input
                  type="text"
                  value={editForm.altText}
                  onChange={(e) => setEditForm({ ...editForm, altText: e.target.value })}
                  placeholder="Describe this asset..."
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Folder Location</label>
                <select
                  value={editForm.folder}
                  onChange={(e) => setEditForm({ ...editForm, folder: e.target.value })}
                  style={{
                    width: '100%',
                    background: 'var(--bg-base)',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.6rem 0.75rem',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {allFolders.filter(f => f !== 'All').map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                  <option value="new-prompt">+ Move to new folder...</option>
                </select>
                
                {editForm.folder === 'new-prompt' && (
                  <input
                    type="text"
                    placeholder="Enter folder name..."
                    onChange={(e) => setEditForm({ ...editForm, folder: e.target.value.toLowerCase().trim() })}
                    required
                    style={{ marginTop: '0.5rem' }}
                  />
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem' }}>
                <button 
                  type="button" 
                  onClick={() => handleDelete(selectedMedia.id)} 
                  className="btn-danger"
                  style={{ padding: '0.6rem 1rem', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem', cursor: 'pointer', border: 'none', flex: 1 }}
                >
                  Delete Asset
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  style={{ flex: 1.5 }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Upload Files Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => !uploading && setShowUploadModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h2>Upload Files</h2>
              <button onClick={() => !uploading && setShowUploadModal(false)} className="modal-close" disabled={uploading}>×</button>
            </div>
            
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Compression Configuration Panel */}
              <div style={{
                background: 'var(--bg-base)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  <input
                    type="checkbox"
                    checked={compressImages}
                    onChange={(e) => setCompressImages(e.target.checked)}
                    style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                  />
                  Compress Images before upload
                </label>
                
                {compressImages && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', paddingLeft: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <span>Quality</span>
                      <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{compressQuality}%</span>
                    </div>
                    <input
                      type="range"
                      min="30"
                      max="95"
                      value={compressQuality}
                      onChange={(e) => setCompressQuality(parseInt(e.target.value))}
                      style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--primary)' }}
                    />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Resizes large images to 1920x1080 and reduces size dramatically with minimal visual loss.
                    </span>
                  </div>
                )}
              </div>

              {/* Drag/Drop Uploader Container */}
              <div style={{ textAlign: 'center' }}>
                {uploading ? (
                  <div style={{ padding: '2rem 0' }}>
                    <div className="spinner" style={{ margin: '0 auto 1.5rem', width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.05)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    <style dangerouslySetInnerHTML={{__html: `
                      @keyframes spin {
                        to { transform: rotate(360deg); }
                      }
                    `}} />
                    <p style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{uploadProgress}</p>
                  </div>
                ) : (
                  <div 
                    style={{ 
                      border: '2px dashed var(--border-strong)', 
                      borderRadius: 'var(--radius-md)', 
                      padding: '2.5rem 1.5rem', 
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
                    onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'rgba(14,165,233,0.02)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.background = 'rgba(255,255,255,0.01)'; }}
                  >
                    <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📁</div>
                    <h3 style={{ fontSize: '1.1rem', color: 'var(--text-h1)', marginBottom: '0.4rem' }}>Drag &amp; Drop files here</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1.25rem' }}>Or click to browse from computer (Images or PDFs)</p>
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
        </div>
      )}

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="modal-overlay" onClick={() => setShowNewFolderModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Create New Folder</h2>
              <button onClick={() => setShowNewFolderModal(false)} className="modal-close">×</button>
            </div>
            <form onSubmit={handleCreateFolder} style={{ padding: '1.5rem' }}>
              <div className="form-group">
                <label>Folder Name</label>
                <input
                  type="text"
                  placeholder="e.g. hero-images, blogs..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="modal-actions" style={{ marginTop: '1.5rem', background: 'none', padding: '0' }}>
                <button type="button" onClick={() => setShowNewFolderModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Create Folder</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}