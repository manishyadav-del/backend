'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';

export default function BlogDetailPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const slug = params.slug;

  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [headerSettings, setHeaderSettings] = useState(null);
  const [footerSettings, setFooterSettings] = useState(null);
  const [navigationMenu, setNavigationMenu] = useState([]);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const getSocialIcon = (platform) => {
    switch (platform) {
      case 'twitter': return '𝕏';
      case 'linkedin': return '💼';
      case 'facebook': return '📘';
      case 'instagram': return '📸';
      case 'youtube': return '📺';
      case 'github': return '💻';
      default: return '🔗';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  useEffect(() => {
    setIsMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    async function fetchBlogData() {
      try {
        setLoading(true);
        const res = await fetch(`/api/blogs/public/${slug}?projectId=demo`);
        if (!res.ok) {
          throw new Error('Blog post not found');
        }
        const data = await res.json();
        setBlog(data.blog);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    async function fetchGlobalSettings() {
      try {
        const headerRes = await fetch('/api/global-settings/header?projectId=demo');
        if (headerRes.ok) {
          const headerData = await headerRes.json();
          if (headerData.success) setHeaderSettings(headerData.data);
        }
      } catch (err) {
        console.error('Failed to fetch header settings:', err);
      }

      try {
        const footerRes = await fetch('/api/global-settings/footer?projectId=demo');
        if (footerRes.ok) {
          const footerData = await footerRes.json();
          if (footerData.success) setFooterSettings(footerData.data);
        }
      } catch (err) {
        console.error('Failed to fetch footer settings:', err);
      }

      try {
        const navRes = await fetch('/api/navigation?projectId=demo');
        if (navRes.ok) {
          const navData = await navRes.json();
          if (navData.menus) {
            const mainMenu = navData.menus.find((menu) => menu.location === 'main');
            if (mainMenu) {
              try {
                const parsed = JSON.parse(mainMenu.items);
                setNavigationMenu(parsed);
              } catch (e) {
                console.error('Failed to parse navigation items:', e);
              }
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch navigation settings:', err);
      }
    }

    if (slug) {
      fetchBlogData();
      fetchGlobalSettings();
    }
  }, [slug]);

  if (loading || !isMounted) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-base)',
        color: 'var(--text-muted)',
        gap: '1rem',
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid var(--border-strong)',
          borderTopColor: 'var(--primary)',
          borderRadius: '50%',
          animation: 'blog-spin 0.8s linear infinite',
        }} />
        <p>Loading article...</p>
        <style>{`
          @keyframes blog-spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  const logo = headerSettings?.logo || '';
  const sticky = headerSettings?.sticky ?? true;
  const transparent = headerSettings?.transparent ?? false;
  const announcementBarActive = headerSettings?.announcementBarActive ?? false;
  const announcementBarText = headerSettings?.announcementBarText || '';

  const filterNavLinks = (links) => {
    return (links || []).filter(item => {
      const p = item.path || item.href || '';
      return !p.includes('[') && !p.includes(']');
    });
  };

  let displayLinks = [];
  if (navigationMenu && navigationMenu.length > 0) {
    displayLinks = filterNavLinks(navigationMenu);
  } else if (headerSettings?.navLinks && headerSettings.navLinks.length > 0) {
    displayLinks = filterNavLinks(headerSettings.navLinks);
  } else {
    displayLinks = [
      { label: 'Home', path: '/' }
    ];
  }

  return (
    <div className="blog-detail-root">
      {announcementBarActive && announcementBarText && (
        <div className="home-announcement-bar">
          <span>{announcementBarText}</span>
        </div>
      )}

      {/* Navigation */}
      <nav 
        className="home-nav"
        style={{
          position: sticky ? 'fixed' : 'absolute',
          top: announcementBarActive && announcementBarText ? '36px' : '0px',
          background: (transparent && !isScrolled) ? 'transparent' : 'rgba(9, 9, 11, 0.8)',
          borderBottomColor: (transparent && !isScrolled) ? 'transparent' : 'var(--border-light)',
          backdropFilter: (transparent && !isScrolled) ? 'none' : 'blur(12px)',
          zIndex: 100
        }}
      >
        <div className="home-nav-inner">
          <Link href="/" className="home-logo" style={{ textDecoration: 'none' }}>
            {logo ? (
              <img src={logo} alt="Logo" className="home-logo-img" />
            ) : (
              <>
                <div className="home-logo-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                  </svg>
                </div>
                <span className="home-logo-text">GlobalBackend</span>
              </>
            )}
          </Link>
          <div className="home-nav-links">
            {displayLinks.map((item, idx) => {
              const path = item.path || item.href || '';
              if (item.children && item.children.length > 0) {
                return (
                  <div key={idx} className="home-nav-dropdown-wrapper">
                    <span className="home-nav-link home-nav-dropdown-trigger">
                      {item.label}
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '4px' }}>
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </span>
                    <div className="home-nav-dropdown">
                      {item.children.map((child, cIdx) => (
                        <a 
                          key={cIdx} 
                          href={child.path || child.href || ''} 
                          target={child.newTab ? "_blank" : undefined}
                          rel={child.newTab ? "noopener noreferrer" : undefined}
                          className="home-nav-dropdown-item"
                        >
                          {child.label}
                        </a>
                      ))}
                    </div>
                  </div>
                );
              }
              return (
                <Link 
                  key={idx} 
                  href={path} 
                  target={item.newTab ? "_blank" : undefined}
                  rel={item.newTab ? "noopener noreferrer" : undefined}
                  className="home-nav-link"
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="blog-main-container">
        {error || !blog ? (
          <div className="blog-error-card">
            <h2>Post Not Found</h2>
            <p>{error || 'The blog post you are looking for could not be found.'}</p>
            <Link href="/" className="back-home-btn">← Back to Homepage</Link>
          </div>
        ) : (
          <article className="blog-article">
            {/* Header / Hero */}
            <header className="blog-header">
              {blog.category && (
                <span className="blog-post-category-badge">{blog.category}</span>
              )}
              <h1 className="blog-article-title">{blog.title}</h1>
              {blog.excerpt && (
                <p className="blog-article-subtitle">{blog.excerpt}</p>
              )}
              <div className="blog-article-meta">
                <div className="blog-meta-item">
                  <span className="meta-icon">✍️</span>
                  <span>By <strong>{blog.author || 'Author'}</strong></span>
                </div>
                {blog.publishedAt && (
                  <div className="blog-meta-item">
                    <span className="meta-icon">📅</span>
                    <span>{formatDate(blog.publishedAt)}</span>
                  </div>
                )}
              </div>
            </header>

            {/* Featured Image */}
            {blog.featuredImage && (
              <div className="blog-featured-image-container">
                <img src={blog.featuredImage} alt={blog.title} className="blog-featured-img-full" />
              </div>
            )}

            {/* Content Body */}
            <div 
              className="blog-content-body"
              dangerouslySetInnerHTML={{ __html: blog.content || '<p>No content provided.</p>' }}
            />
          </article>
        )}
      </main>

      {/* Footer */}
      <footer className="home-footer">
        <div 
          className="home-footer-inner" 
          style={{ 
            flexDirection: (footerSettings?.columns?.length > 0 || footerSettings?.socialLinks?.length > 0 || footerSettings?.showNewsletter) ? 'column' : 'row', 
            alignItems: (footerSettings?.columns?.length > 0 || footerSettings?.socialLinks?.length > 0 || footerSettings?.showNewsletter) ? 'stretch' : 'center' 
          }}
        >
          {(footerSettings?.columns?.length > 0 || footerSettings?.socialLinks?.length > 0 || footerSettings?.showNewsletter) ? (
            <>
              <div className="home-footer-top-grid">
                {/* Brand & Socials Column */}
                <div className="home-footer-brand-col">
                  <div className="home-footer-brand">
                    <div className="home-logo-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                      </svg>
                    </div>
                    <span>GlobalBackend</span>
                  </div>
                  <p className="home-footer-description">
                    Manage and grow your online presence from one comprehensive dashboard.
                  </p>
                  {footerSettings?.socialLinks && footerSettings.socialLinks.length > 0 && (
                    <div className="home-footer-socials">
                      {footerSettings.socialLinks.map((social, idx) => (
                        <a key={idx} href={social.url} target="_blank" rel="noopener noreferrer" className="home-footer-social-btn" title={social.platform}>
                          {getSocialIcon(social.platform)}
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Columns */}
                {footerSettings?.columns && footerSettings.columns.map((col, idx) => (
                  <div key={idx} className="home-footer-col">
                    <h4>{col.title}</h4>
                    <ul>
                      {col.links && col.links.map((link, lIdx) => (
                        <li key={lIdx}>
                          <a href={link.path || link.href || ''}>{link.label}</a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="home-footer-copy">
              &copy; {new Date().getFullYear()} GlobalBackend. All rights reserved.
            </p>
          )}
        </div>
      </footer>

      {/* Styled JSX */}
      <style jsx>{`
        .blog-detail-root {
          background: var(--bg-base);
          min-height: 100vh;
          color: var(--text-primary);
          font-family: var(--font-geist-sans), sans-serif;
        }

        .blog-main-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 8rem 1.5rem 6rem;
        }

        .blog-error-card {
          background: var(--bg-card);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          padding: 3rem 2rem;
          text-align: center;
          margin: 4rem 0;
        }

        .blog-error-card h2 {
          color: var(--text-h1);
          font-size: 1.75rem;
          margin-bottom: 1rem;
        }

        .blog-error-card p {
          color: var(--text-secondary);
          margin-bottom: 2rem;
        }

        .back-home-btn {
          display: inline-block;
          background: var(--primary);
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: var(--radius-sm);
          text-decoration: none;
          font-weight: 600;
          transition: var(--transition);
        }

        .back-home-btn:hover {
          opacity: 0.9;
        }

        .blog-article {
          background: transparent;
        }

        .blog-header {
          margin-bottom: 2.5rem;
        }

        .blog-post-category-badge {
          display: inline-block;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--primary);
          background: var(--primary-light);
          padding: 0.25rem 0.6rem;
          border-radius: var(--radius-pill);
          margin-bottom: 1rem;
        }

        .blog-article-title {
          font-size: 2.5rem;
          font-weight: 800;
          color: var(--text-h1);
          line-height: 1.25;
          margin-bottom: 1rem;
        }

        .blog-article-subtitle {
          font-size: 1.2rem;
          line-height: 1.5;
          color: var(--text-secondary);
          margin-bottom: 1.5rem;
        }

        .blog-article-meta {
          display: flex;
          gap: 1.5rem;
          border-top: 1px solid var(--border-light);
          border-bottom: 1px solid var(--border-light);
          padding: 0.75rem 0;
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .blog-meta-item {
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .meta-icon {
          font-size: 1rem;
        }

        .blog-featured-image-container {
          border-radius: var(--radius-md);
          overflow: hidden;
          border: 1px solid var(--border-light);
          margin-bottom: 3rem;
          box-shadow: var(--shadow-lg);
          max-height: 450px;
        }

        .blog-featured-img-full {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .blog-content-body {
          font-size: 1.125rem;
          line-height: 1.8;
          color: var(--text-secondary);
        }

        .blog-content-body :global(p) {
          margin-bottom: 1.5rem;
        }

        .blog-content-body :global(h2) {
          color: var(--text-h1);
          font-size: 1.75rem;
          font-weight: 700;
          margin: 2.5rem 0 1rem;
        }

        .blog-content-body :global(h3) {
          color: var(--text-h1);
          font-size: 1.4rem;
          font-weight: 600;
          margin: 2rem 0 1rem;
        }

        .blog-content-body :global(ul), .blog-content-body :global(ol) {
          margin-bottom: 1.5rem;
          padding-left: 1.5rem;
        }

        .blog-content-body :global(li) {
          margin-bottom: 0.5rem;
        }

        .blog-content-body :global(img) {
          max-width: 100%;
          height: auto;
          border-radius: var(--radius-sm);
          margin: 2rem 0;
        }

        .blog-content-body :global(blockquote) {
          border-left: 4px solid var(--primary);
          padding-left: 1.25rem;
          color: var(--text-muted);
          font-style: italic;
          margin: 2rem 0;
        }
      `}</style>
    </div>
  );
}
