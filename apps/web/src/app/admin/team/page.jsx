'use client';

import { useEffect, useState } from 'react';
import { teamApi } from '@/lib/api.js';

export default function TeamPage() {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  
  const [photoUploading, setPhotoUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    role: '',
    photo: '',
    bio: '',
    sortOrder: 0,
    isVisible: true,
  });

  const [socials, setSocials] = useState({
    linkedin: '',
    twitter: '',
    github: '',
  });

  const projectId = 'demo';

  const loadTeamMembers = async () => {
    try {
      setLoading(true);
      const data = await teamApi.getAll(projectId);
      setTeamMembers(data.members || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeamMembers();
  }, []);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setPhotoUploading(true);
    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('projectId', projectId);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setFormData(prev => ({ ...prev, photo: data.url }));
      } else {
        alert(data.error || 'Failed to upload photo');
      }
    } catch {
      alert('Upload error');
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Serialize socials as JSON string
      const socialLinksJson = JSON.stringify({
        linkedin: socials.linkedin.trim(),
        twitter: socials.twitter.trim(),
        github: socials.github.trim(),
      });

      const submitData = {
        ...formData,
        projectId,
        socialLinks: socialLinksJson,
      };

      if (editingMember) {
        await teamApi.update(editingMember.id, submitData);
      } else {
        await teamApi.create(submitData);
      }
      await loadTeamMembers();
      closeModal();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (member) => {
    setEditingMember(member);
    setFormData({
      name: member.name || '',
      role: member.role || '',
      photo: member.photo || '',
      bio: member.bio || '',
      sortOrder: member.sortOrder || 0,
      isVisible: member.isVisible ?? true,
    });

    // Parse socials JSON
    let parsedSocials = { linkedin: '', twitter: '', github: '' };
    try {
      if (member.socialLinks) {
        const parsed = JSON.parse(member.socialLinks);
        parsedSocials = {
          linkedin: parsed.linkedin || '',
          twitter: parsed.twitter || '',
          github: parsed.github || '',
        };
      }
    } catch {
      // fallback if it was a plain string
      parsedSocials.linkedin = member.socialLinks || '';
    }
    setSocials(parsedSocials);

    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this team member?')) return;
    try {
      await teamApi.delete(id);
      await loadTeamMembers();
    } catch (err) {
      setError(err.message);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingMember(null);
    setFormData({
      name: '',
      role: '',
      photo: '',
      bio: '',
      sortOrder: 0,
      isVisible: true,
    });
    setSocials({
      linkedin: '',
      twitter: '',
      github: '',
    });
  };

  return (
    <div className="team-page">
      <div className="page-header">
        <h1>Team Members</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary">+ New Member</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading">Loading team members...</div>
      ) : teamMembers.length === 0 ? (
        <div className="empty-state">
          <p>No team members yet. Add your first team member to get started.</p>
        </div>
      ) : (
        <div className="team-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {teamMembers.map(member => (
            <div key={member.id} className="team-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', textAlign: 'center' }}>
              {member.photo ? (
                <img src={member.photo} alt={member.name} style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', background: 'var(--bg-base)', border: '2px solid var(--border-strong)' }} />
              ) : (
                <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>👤</div>
              )}
              <div className="team-info" style={{ flex: 1 }}>
                <h3 style={{ fontSize: '1.2rem', color: 'var(--text-h1)', margin: 0 }}>{member.name}</h3>
                {member.role && <p style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, marginTop: '0.25rem' }}>{member.role}</p>}
                {member.bio && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{member.bio}</p>}
              </div>
              <div className="card-actions" style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                <button onClick={() => handleEdit(member)} className="btn-sm" style={{ flex: 1 }}>Edit</button>
                <button onClick={() => handleDelete(member.id)} className="btn-sm btn-danger" style={{ flex: 1 }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingMember ? 'Edit Team Member' : 'New Team Member'}</h2>
              <button onClick={closeModal} className="modal-close">×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  placeholder="e.g., CEO, Developer, Designer"
                />
              </div>

              <div className="form-group">
                <label>Photo</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={formData.photo}
                    onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
                    placeholder="https://... or upload photo"
                    style={{ flex: 1 }}
                  />
                  <input
                    type="file"
                    id="team-photo-file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    style={{ display: 'none' }}
                  />
                  <button
                    type="button"
                    className="btn-sm"
                    style={{ height: '40px', display: 'flex', alignItems: 'center' }}
                    onClick={() => document.getElementById('team-photo-file').click()}
                    disabled={photoUploading}
                  >
                    {photoUploading ? 'Uploading...' : '📁 Upload'}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows="3"
                />
              </div>

              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem', marginTop: '1.5rem' }}>
                <h3 style={{ fontSize: '0.95rem', color: 'var(--text-h1)', marginBottom: '1rem' }}>Social Networks Profiles</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                  <div className="form-group">
                    <label>LinkedIn URL</label>
                    <input
                      type="url"
                      value={socials.linkedin}
                      onChange={(e) => setSocials({ ...socials, linkedin: e.target.value })}
                      placeholder="https://linkedin.com/in/..."
                    />
                  </div>
                  <div className="form-group">
                    <label>Twitter / X URL</label>
                    <input
                      type="url"
                      value={socials.twitter}
                      onChange={(e) => setSocials({ ...socials, twitter: e.target.value })}
                      placeholder="https://twitter.com/..."
                    />
                  </div>
                  <div className="form-group">
                    <label>GitHub URL</label>
                    <input
                      type="url"
                      value={socials.github}
                      onChange={(e) => setSocials({ ...socials, github: e.target.value })}
                      placeholder="https://github.com/..."
                    />
                  </div>
                </div>
              </div>

              <div className="form-row" style={{ marginTop: '0.5rem' }}>
                <div className="form-group">
                  <label>Sort Order</label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="form-group checkbox" style={{ marginTop: '2rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.isVisible}
                      onChange={(e) => setFormData({ ...formData, isVisible: e.target.checked })}
                    />
                    Visible
                  </label>
                </div>
              </div>

              <div className="modal-actions" style={{ marginTop: '1.5rem', background: 'none', padding: '1rem 0 0' }}>
                <button type="button" onClick={closeModal} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary" disabled={photoUploading}>
                  {editingMember ? 'Update Member' : 'Create Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}