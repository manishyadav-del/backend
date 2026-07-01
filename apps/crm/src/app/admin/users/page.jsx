'use client';

import { useEffect, useState } from 'react';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    roleId: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await fetch('/api/roles');
      const data = await res.json();
      setAvailableRoles(data.roles || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const openAddModal = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', password: '', roleId: availableRoles[0]?.id || '' });
    setError('');
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    const firstRole = user.roles?.[0];
    setFormData({
      name: user.name || '',
      email: user.email,
      password: '',
      roleId: firstRole?.id || '',
    });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      if (editingUser) {
        // Update user profile fields (name, password)
        const updateRes = await fetch(`/api/users/${editingUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            ...(formData.password && { password: formData.password }),
          }),
        });
        if (!updateRes.ok) {
          const d = await updateRes.json();
          setError(d.error || 'Failed to update user');
          setSaving(false);
          return;
        }

        // Assign RBAC role
        if (formData.roleId) {
          const roleRes = await fetch(`/api/users/${editingUser.id}/roles`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roleIds: [formData.roleId] }),
          });
          if (!roleRes.ok) {
            const d = await roleRes.json();
            setError(d.error || 'Failed to assign role');
            setSaving(false);
            return;
          }
        }
      } else {
        // Create new user with roleId
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Something went wrong');
          setSaving(false);
          return;
        }
      }

      setShowModal(false);
      fetchUsers();
    } catch {
      setError('Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      if (res.ok) fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const getRoleStyle = (roleName = '') => {
    const name = roleName.toLowerCase();
    if (name.includes('admin')) {
      return { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'rgba(239, 68, 68, 0.2)' };
    }
    if (name.includes('editor') || name.includes('creator') || name.includes('author')) {
      return { bg: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', border: 'rgba(139, 92, 246, 0.2)' };
    }
    if (name.includes('seo')) {
      return { bg: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9', border: 'rgba(14, 165, 233, 0.2)' };
    }
    if (name.includes('client')) {
      return { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: 'rgba(16, 185, 129, 0.2)' };
    }
    return { bg: 'rgba(100, 116, 139, 0.1)', color: '#94a3b8', border: 'rgba(100, 116, 139, 0.2)' };
  };

  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase();
    return (u.name || '').toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  const inp = {
    width: '100%',
    padding: '0.6rem 0.8rem',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-strong)',
    background: 'var(--bg-base)',
    color: 'var(--text-primary)',
    fontSize: '0.875rem',
    outline: 'none'
  };

  return (
    <div style={{ padding: '1.5rem', background: 'var(--bg-base)', minHeight: '85vh' }}>
      
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-h1)', margin: 0, letterSpacing: '-0.02em' }}>User Management</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            Invite new administrators, manage role-based access control, and review authentication status.
          </p>
        </div>
        <button className="btn-primary" onClick={openAddModal} style={{ padding: '0.6rem 1.25rem', fontWeight: 700 }}>
          ➕ Invite User
        </button>
      </div>

      {/* Filters & Search bar */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ flex: 1, position: 'relative', maxWidth: '400px' }}>
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={inp}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <div className="loading">Retrieving team directory...</div>
        </div>
      ) : (
        <div className="data-table-container" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-light)' }}>
                <th style={{ padding: '1rem 1.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>User Profile</th>
                <th style={{ padding: '1rem 1.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Email Address</th>
                <th style={{ padding: '1rem 1.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>RBAC Roles</th>
                <th style={{ padding: '1rem 1.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>2FA Security</th>
                <th style={{ padding: '1rem 1.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Date Joined</th>
                <th style={{ padding: '1rem 1.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => {
                const userInitial = user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U';
                return (
                  <tr key={user.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    {/* User profile with avatar */}
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-light)',
                          color: 'var(--text-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          fontSize: '0.85rem'
                        }}>
                          {userInitial}
                        </div>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{user.name || '—'}</span>
                      </div>
                    </td>
                    
                    <td style={{ padding: '1rem 1.25rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{user.email}</td>
                    
                    {/* Roles Badges */}
                    <td style={{ padding: '1rem 1.25rem' }}>
                      {user.roles && user.roles.length > 0 ? (
                        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                          {user.roles.map((r) => {
                            const styleInfo = getRoleStyle(r.name);
                            return (
                              <span 
                                key={r.id} 
                                style={{ 
                                  background: styleInfo.bg, 
                                  color: styleInfo.color, 
                                  border: `1px solid ${styleInfo.border}`,
                                  fontSize: '0.7rem',
                                  padding: '0.15rem 0.5rem',
                                  borderRadius: '9999px',
                                  fontWeight: 'bold',
                                  letterSpacing: '0.02em',
                                  textTransform: 'uppercase'
                                }}
                              >
                                {r.name}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <span style={{ 
                          background: 'rgba(100, 116, 139, 0.1)', 
                          color: '#94a3b8', 
                          border: '1px solid rgba(100, 116, 139, 0.2)',
                          fontSize: '0.7rem',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '9999px',
                          fontWeight: 'bold'
                        }}>
                          {user.role || 'MEMBER'}
                        </span>
                      )}
                    </td>

                    {/* 2FA Status */}
                    <td style={{ padding: '1rem 1.25rem' }}>
                      {user.twoFactorEnabled ? (
                        <span style={{ color: 'var(--success)', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          🟢 Enabled
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          ⚪ Disabled
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '1rem 1.25rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button 
                          className="btn-sm" 
                          onClick={() => openEditModal(user)}
                          style={{ padding: '0.35rem 0.65rem' }}
                        >
                          ✏️ Edit
                        </button>
                        <button 
                          className="btn-sm btn-danger" 
                          onClick={() => handleDelete(user.id)}
                          style={{ padding: '0.35rem 0.65rem' }}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit User Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', zIndex: 9999 }}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', width: '100%', maxWidth: '480px', boxShadow: 'var(--shadow-xl)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 1.25rem', color: 'var(--text-h1)' }}>
              {editingUser ? '✏️ Edit Team Member Profile' : '➕ Invite Team Member'}
            </h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              <div className="form-group">
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. John Doe"
                  style={inp}
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={!!editingUser}
                  style={{ ...inp, opacity: editingUser ? 0.6 : 1, cursor: editingUser ? 'not-allowed' : 'text' }}
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>
                  {editingUser ? 'New Password (leave blank to keep current)' : 'Password'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingUser}
                  minLength={8}
                  style={inp}
                />
              </div>

              {/* Roles dropdown */}
              <div className="form-group">
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 600 }}>Assigned Role</label>
                <select
                  value={formData.roleId}
                  onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                  required
                  style={inp}
                >
                  <option value="">— Select a Role —</option>
                  {availableRoles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name} {role.description ? ` — ${role.description}` : ''}
                    </option>
                  ))}
                </select>
                {availableRoles.length === 0 && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem', margin: 0 }}>
                    No roles found. Set up roles first.
                  </p>
                )}
              </div>

              {error && (
                <div style={{ padding: '0.5rem 0.75rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem' }}>
                  ⚠️ {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)} style={{ padding: '0.5rem 1rem' }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving} style={{ padding: '0.5rem 1rem' }}>
                  {saving ? 'Saving...' : editingUser ? 'Update Profile' : 'Invite User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}