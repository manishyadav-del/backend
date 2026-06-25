'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import WebsiteAssignmentTab from '@/components/WebsiteAssignmentTab.jsx';
import styles from './pages.module.css';

export default function PagesPage() {
  const [activeTab, setActiveTab] = useState('list'); // list, assignments
  
  // Data State
  const [pages, setPages] = useState([]);
  const [projects, setProjects] = useState([]);
  const [websites, setWebsites] = useState([]);
  const [stats, setStats] = useState({ total: 0, published: 0, draft: 0, archived: 0, synced: 0 });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [sortBy, setSortBy] = useState('updated_desc'); // updated_desc, updated_asc, name_asc, name_desc
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);

  // New Page Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [newForm, setNewForm] = useState({
    title: '',
    slug: '',
    metaTitle: '',
    metaDesc: '',
    layout: 'default',
    status: 'DRAFT',
    projectId: ''
  });

  // Fetch Projects / Applications
  useEffect(() => {
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => {
        const projList = data.projects || [];
        setProjects(projList);
        if (projList.length > 0) {
          setNewForm(prev => ({ ...prev, projectId: projList[0].id }));
        }
      })
      .catch(err => console.error('Error fetching projects:', err));

    fetch('/api/websites')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setWebsites(data.data || []);
        }
      })
      .catch(err => console.error('Error fetching websites:', err));
  }, []);

  // Fetch Stats & Pages
  const fetchStats = () => {
    fetch(`/api/pages/stats?projectId=${projectFilter}`)
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error('Error fetching page stats:', err));
  };

  const fetchPages = () => {
    setLoading(true);
    fetch(`/api/pages?projectId=${projectFilter}`)
      .then(res => res.json())
      .then(data => {
        setPages(data.pages || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching pages:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchStats();
    fetchPages();
  }, [projectFilter]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, projectFilter]);

  // Sync active application manually
  const handleSyncApp = async () => {
    if (projectFilter === 'all') return;
    const activeProject = projects.find(p => p.id === projectFilter);
    if (!activeProject) return;

    const matchedWeb = websites.find(w => w.name === activeProject.name || w.domain === activeProject.domain);
    if (!matchedWeb) {
      alert(`No active connected frontend website connection found for project "${activeProject.name}". Setup connection under Websites first.`);
      return;
    }

    setSyncing(true);
    try {
      const res = await fetch(`/api/websites/${matchedWeb.id}/sync`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        fetchPages();
        fetchStats();
        alert(`Successfully synced pages metadata from ${matchedWeb.name}.`);
      } else {
        alert(json.error || 'Sync failed.');
      }
    } catch (err) {
      console.error(err);
      alert('Error triggering sync connection.');
    } finally {
      setSyncing(false);
    }
  };

  // Duplicate page
  const handleDuplicatePage = async (id) => {
    try {
      const response = await fetch('/api/pages/duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId: id })
      });
      const data = await response.json();
      if (response.ok) {
        fetchPages();
        fetchStats();
      } else {
        alert(data.error || 'Failed to duplicate page');
      }
    } catch (err) {
      console.error(err);
      alert('Error duplicating page');
    }
  };

  // Soft Delete (Archive) page
  const handleDeletePage = async (id) => {
    if (!confirm('Are you sure you want to archive this page? It will be hidden from public view.')) return;
    try {
      const response = await fetch(`/api/pages/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ARCHIVED' })
      });
      if (response.ok) {
        fetchPages();
        fetchStats();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to archive page');
      }
    } catch (err) {
      console.error(err);
      alert('Error archiving page');
    }
  };

  // Submit Modal New Page
  const handleCreatePage = async (e) => {
    e.preventDefault();
    if (!newForm.projectId) {
      alert('Please select a project/application.');
      return;
    }
    try {
      const response = await fetch('/api/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: newForm.projectId,
          title: newForm.title,
          slug: newForm.slug,
          template: newForm.layout,
          status: newForm.status,
          seo: {
            metaTitle: newForm.metaTitle || newForm.title,
            metaDescription: newForm.metaDesc || ''
          }
        })
      });
      const data = await response.json();
      if (response.ok) {
        setModalOpen(false);
        setNewForm({
          title: '',
          slug: '',
          metaTitle: '',
          metaDesc: '',
          layout: 'default',
          status: 'DRAFT',
          projectId: projectFilter !== 'all' ? projectFilter : (projects[0]?.id || '')
        });
        fetchPages();
        fetchStats();
      } else {
        alert(data.error || 'Failed to create page');
      }
    } catch (err) {
      console.error(err);
      alert('Error creating page');
    }
  };

  // Auto slugify helper
  const handleTitleChange = (val) => {
    const slug = val
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    
    setNewForm(prev => ({
      ...prev,
      title: val,
      slug: slug.startsWith('/') ? slug : '/' + slug,
      metaTitle: val
    }));
  };

  // Client side filters
  const filteredPages = pages.filter(page => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const titleMatch = page.title?.toLowerCase().includes(query);
      const slugMatch = page.slug?.toLowerCase().includes(query);
      if (!titleMatch && !slugMatch) return false;
    }
    if (statusFilter !== 'all') {
      if (page.status?.toUpperCase() !== statusFilter.toUpperCase()) return false;
    } else {
      if (page.status?.toUpperCase() === 'ARCHIVED') return false;
    }
    return true;
  });

  // Client side sorting
  const sortedPages = [...filteredPages].sort((a, b) => {
    if (sortBy === 'name_asc') return (a.title || '').localeCompare(b.title || '');
    if (sortBy === 'name_desc') return (b.title || '').localeCompare(a.title || '');
    if (sortBy === 'updated_desc') return new Date(b.updatedAt) - new Date(a.updatedAt);
    if (sortBy === 'updated_asc') return new Date(a.updatedAt) - new Date(b.updatedAt);
    return 0;
  });

  // Pagination slice
  const totalItems = sortedPages.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedPages = sortedPages.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--text-h1)', margin: 0, letterSpacing: '-0.02em' }}>Page Registry</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Overview of client pages detected via SDK sync registry and custom page creations.
          </p>
        </div>
        {activeTab === 'list' && (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={() => setModalOpen(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>+</span> New Page
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-light)', gap: '1.5rem', marginTop: '-0.5rem' }}>
        <button
          onClick={() => setActiveTab('list')}
          style={{
            background: 'transparent',
            border: 'none',
            padding: '0.75rem 0.25rem',
            color: activeTab === 'list' ? 'var(--primary)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'list' ? 700 : 500,
            fontSize: '0.875rem',
            cursor: 'pointer',
            borderBottom: activeTab === 'list' ? '2px solid var(--primary)' : '2px solid transparent',
            transition: 'var(--transition)'
          }}
        >
          Pages List
        </button>
        <button
          onClick={() => setActiveTab('assignments')}
          style={{
            background: 'transparent',
            border: 'none',
            padding: '0.75rem 0.25rem',
            color: activeTab === 'assignments' ? 'var(--primary)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'assignments' ? 700 : 500,
            fontSize: '0.875rem',
            cursor: 'pointer',
            borderBottom: activeTab === 'assignments' ? '2px solid var(--primary)' : '2px solid transparent',
            transition: 'var(--transition)'
          }}
        >
          Website Assignment
        </button>
      </div>

      {activeTab === 'list' && (
        <>
          {/* Stats Bar */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statInfo}>
                <h3>Total Pages</h3>
                <p className={styles.statValue}>{stats.total}</p>
              </div>
              <div className={styles.statIcon}>📄</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statInfo}>
                <h3>Published</h3>
                <p className={styles.statValue} style={{ color: 'var(--success)' }}>{stats.published}</p>
              </div>
              <div className={styles.statIcon} style={{ color: 'var(--success)' }}>🟢</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statInfo}>
                <h3>Drafts</h3>
                <p className={styles.statValue} style={{ color: 'var(--warning)' }}>{stats.draft}</p>
              </div>
              <div className={styles.statIcon} style={{ color: 'var(--warning)' }}>🟡</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statInfo}>
                <h3>Synced SDK</h3>
                <p className={styles.statValue} style={{ color: 'var(--primary)' }}>{stats.synced}</p>
              </div>
              <div className={styles.statIcon} style={{ color: 'var(--primary)' }}>🔄</div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className={styles.filtersBar}>
            <div className={styles.filtersLeft}>
              <div className={styles.searchWrapper}>
                <span className={styles.searchIcon}>🔍</span>
                <input
                  type="text"
                  placeholder="Search pages by title or slug..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="all">All Statuses</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>

              <select
                value={projectFilter}
                onChange={(e) => {
                  setProjectFilter(e.target.value);
                  setNewForm(prev => ({ ...prev, projectId: e.target.value !== 'all' ? e.target.value : (projects[0]?.id || '') }));
                }}
                className={styles.filterSelect}
              >
                <option value="all">All Applications</option>
                {projects.map(proj => (
                  <option key={proj.id} value={proj.id}>{proj.name}</option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="updated_desc">Last Updated (Newest)</option>
                <option value="updated_asc">Last Updated (Oldest)</option>
                <option value="name_asc">Name (A-Z)</option>
                <option value="name_desc">Name (Z-A)</option>
              </select>
            </div>

            <div className={styles.filtersRight}>
              {projectFilter !== 'all' && (
                <button
                  onClick={handleSyncApp}
                  disabled={syncing}
                  className={styles.btnSync}
                >
                  {syncing ? 'Syncing...' : 'Sync Frontend'}
                </button>
              )}
            </div>
          </div>

          {/* Data Table */}
          <div className={styles.tableContainer}>
            {loading ? (
              // Loading skeletons
              Array.from({ length: 5 }).map((_, idx) => (
                <div key={idx} className={styles.skeletonRow}>
                  <div className={styles.skeletonCell} style={{ width: '30%' }} />
                  <div className={styles.skeletonCell} style={{ width: '20%' }} />
                  <div className={styles.skeletonCell} style={{ width: '15%' }} />
                  <div className={styles.skeletonCell} style={{ width: '15%' }} />
                  <div className={styles.skeletonCell} style={{ width: '20%' }} />
                </div>
              ))
            ) : paginatedPages.length === 0 ? (
              <div className="empty-state" style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                <p style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>No matching pages found</p>
                <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>Try refining your search or create a new page.</p>
              </div>
            ) : (
              <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-light)' }}>
                    <th style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Page Name</th>
                    <th style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Route / Slug</th>
                    <th style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Application</th>
                    <th style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Status</th>
                    <th style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Updated</th>
                    <th style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPages.map(page => (
                    <tr key={page.id} style={{ borderBottom: '1px solid var(--border-light)', transition: 'background-color 0.2s' }}>
                      <td style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>
                        <Link href={`/dashboard/pages/${page.id}`} style={{ color: 'var(--text-primary)', textDecoration: 'none' }} className="hover-underline">
                          {page.title}
                        </Link>
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <code style={{ background: 'rgba(39, 39, 42, 0.4)', padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.8125rem' }}>
                          {page.slug}
                        </code>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        {page.project?.name || 'Unknown Application'}
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <span className={`${styles.badge} ${
                          page.status?.toUpperCase() === 'PUBLISHED' ? styles.badgePublished :
                          page.status?.toUpperCase() === 'DRAFT' ? styles.badgeDraft : styles.badgeArchived
                        }`}>
                          {page.status}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        {new Date(page.updatedAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <Link href={`/dashboard/pages/${page.id}`} className={`${styles.actionBtn} ${styles.actionBtnEdit}`} title="Edit in builder">
                            ✏️
                          </Link>
                          <Link href={`/dashboard/pages/${page.id}/edit`} className={`${styles.actionBtn}`} title="Page Settings">
                            ⚙️
                          </Link>
                          <a href={`${page.project?.domain || ''}${page.slug}`} target="_blank" rel="noopener noreferrer" className={`${styles.actionBtn} ${styles.actionBtnPreview}`} title="Preview Page">
                            👁️
                          </a>
                          <button onClick={() => handleDuplicatePage(page.id)} className={`${styles.actionBtn} ${styles.actionBtnDuplicate}`} title="Duplicate Page">
                            👯
                          </button>
                          {page.status?.toUpperCase() !== 'ARCHIVED' && (
                            <button onClick={() => handleDeletePage(page.id)} className={`${styles.actionBtn} ${styles.actionBtnDelete}`} title="Archive Page">
                              🗑️
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Pagination Controls */}
            {!loading && totalItems > 0 && (
              <div className={styles.paginationBar}>
                <div className={styles.paginationInfo}>
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} pages
                </div>
                <div className={styles.paginationButtons}>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={styles.paginationBtn}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className={styles.paginationBtn}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* New Page Modal */}
          {modalOpen && (
            <div className={styles.modalOverlay}>
              <div className={styles.modal}>
                <div className={styles.modalHeader}>
                  <h2>Create New Page</h2>
                  <button onClick={() => setModalOpen(false)} className={styles.modalCloseBtn}>&times;</button>
                </div>
                <form onSubmit={handleCreatePage}>
                  <div className={styles.modalBody}>
                    <div className={styles.formGroup}>
                      <label htmlFor="projectId">Target Application / Project *</label>
                      <select
                        id="projectId"
                        value={newForm.projectId}
                        onChange={(e) => setNewForm(prev => ({ ...prev, projectId: e.target.value }))}
                        className={styles.formSelect}
                        required
                      >
                        {projects.map(proj => (
                          <option key={proj.id} value={proj.id}>{proj.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="title">Page Title *</label>
                      <input
                        type="text"
                        id="title"
                        placeholder="e.g. Services, About Us"
                        value={newForm.title}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        className={styles.formInput}
                        required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="slug">Route Slug *</label>
                      <input
                        type="text"
                        id="slug"
                        placeholder="e.g. /services"
                        value={newForm.slug}
                        onChange={(e) => setNewForm(prev => ({ ...prev, slug: e.target.value }))}
                        className={styles.formInput}
                        required
                      />
                    </div>

                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label htmlFor="layout">Layout Template</label>
                        <select
                          id="layout"
                          value={newForm.layout}
                          onChange={(e) => setNewForm(prev => ({ ...prev, layout: e.target.value }))}
                          className={styles.formSelect}
                        >
                          <option value="default">Default</option>
                          <option value="full-width">Full Width</option>
                          <option value="sidebar">With Sidebar</option>
                          <option value="landing">Landing Page</option>
                        </select>
                      </div>

                      <div className={styles.formGroup}>
                        <label htmlFor="status">Initial Status</label>
                        <select
                          id="status"
                          value={newForm.status}
                          onChange={(e) => setNewForm(prev => ({ ...prev, status: e.target.value }))}
                          className={styles.formSelect}
                        >
                          <option value="DRAFT">Draft</option>
                          <option value="PUBLISHED">Published</option>
                        </select>
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="metaTitle">SEO Meta Title</label>
                      <input
                        type="text"
                        id="metaTitle"
                        placeholder="Leave empty to use title"
                        value={newForm.metaTitle}
                        onChange={(e) => setNewForm(prev => ({ ...prev, metaTitle: e.target.value }))}
                        className={styles.formInput}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="metaDesc">SEO Meta Description</label>
                      <textarea
                        id="metaDesc"
                        rows="3"
                        placeholder="Search engine description preview..."
                        value={newForm.metaDesc}
                        onChange={(e) => setNewForm(prev => ({ ...prev, metaDesc: e.target.value }))}
                        className={styles.formTextarea}
                      />
                    </div>
                  </div>
                  <div className={styles.modalFooter}>
                    <button type="button" onClick={() => setModalOpen(false)} className={styles.btnCancel}>
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary">
                      Create Page
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'assignments' && (
        <WebsiteAssignmentTab moduleKey="content" />
      )}
    </div>
  );
}