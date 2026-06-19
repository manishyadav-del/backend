'use client';

import { useEffect, useState } from 'react';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
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
    const res = await fetch('/api/users');
    const data = await res.json();
    setUsers(data.users || []);
    setLoading(false);
  };

  const fetchRoles = async () => {
    const res = await fetch('/api/roles');
    const data = await res.json();
    setAvailableRoles(data.roles || []);
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
    // Pre-select first assigned role if any
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
        // Step 1: Update user profile fields (name, password)
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
          return;
        }

        // Step 2: Assign RBAC role via the roles endpoint
        if (formData.roleId) {
          const roleRes = await fetch(`/api/users/${editingUser.id}/roles`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roleIds: [formData.roleId] }),
          });
          if (!roleRes.ok) {
            const d = await roleRes.json();
            setError(d.error || 'Failed to assign role');
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
    const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
    if (res.ok) fetchUsers();
  };

  // Get role badge color by role name
  const roleBadgeStyle = (roleName = '') => {
    const name = roleName.toLowerCase();
    if (name.includes('super') || name.includes('admin')) return 'badge-admin';
    if (name.includes('content') || name.includes('editor')) return 'badge-editor';
    if (name.includes('sales') || name.includes('manager')) return 'badge-manager';
    if (name.includes('seo')) return 'badge-seo';
    if (name.includes('client')) return 'badge-client';
    return 'badge-viewer';
  };

  return (
    <div className="users-page">
      <div className="page-header">
        <h1>Users</h1>
        <button className="btn-primary" onClick={openAddModal}>+ Add User</button>
      </div>

      {loading ? (
        <div className="loading">Loading users...</div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Roles</th>
                <th>2FA</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.name || '—'}</td>
                  <td>{user.email}</td>
                  <td>
                    {user.roles && user.roles.length > 0 ? (
                      <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                        {user.roles.map((r) => (
                          <span key={r.id} className={`badge ${roleBadgeStyle(r.name)}`}>
                            {r.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="badge badge-viewer">{user.role || '—'}</span>
                    )}
                  </td>
                  <td>{user.twoFactorEnabled ? '✅ Enabled' : '❌ Disabled'}</td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button className="btn-sm" onClick={() => openEditModal(user)}>Edit</button>
                    <button className="btn-sm btn-danger" onClick={() => handleDelete(user.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingUser ? 'Edit User' : 'Add User'}</h2>
            <form onSubmit={handleSubmit}>

              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={!!editingUser}
                />
              </div>

              <div className="form-group">
                <label>{editingUser ? 'New Password (leave blank to keep)' : 'Password'}</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingUser}
                  minLength={8}
                />
              </div>

              {/* Dynamic role selector from DB */}
              <div className="form-group">
                <label>Role</label>
                <select
                  value={formData.roleId}
                  onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                  required
                >
                  <option value="">— Select a Role —</option>
                  {availableRoles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                      {role.description ? ` — ${role.description}` : ''}
                    </option>
                  ))}
                </select>
                {availableRoles.length === 0 && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.3rem' }}>
                    No roles found. Add roles first via the Roles section.
                  </p>
                )}
              </div>

              {error && <div className="error-message">{error}</div>}

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}