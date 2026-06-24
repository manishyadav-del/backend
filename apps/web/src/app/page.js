'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const pathname = usePathname();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [headerSettings, setHeaderSettings] = useState(null);
  const [footerSettings, setFooterSettings] = useState(null);
  const [navigationMenu, setNavigationMenu] = useState([]);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  // ── Dynamic magazine/blog content from MySQL ──
  const [homepageContent, setHomepageContent] = useState(null);
  const [homepageLoading, setHomepageLoading] = useState(true);
  const [expandedFaq, setExpandedFaq] = useState(null);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        setIsAuthenticated(false);
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

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

  useEffect(() => {
    setIsMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    async function fetchDashboardStats() {
      try {
        const res = await fetch('/api/dashboard/stats');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        if (data.success) {
          setStats(data.data);
        }
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

    async function checkAuthAndFetchStats() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          setIsAuthenticated(true);
          if (pathname === '/') {
            router.push('/home');
          } else {
            setLoading(false);
          }
        } else {
          setIsAuthenticated(false);
          if (pathname === '/home') {
            router.push('/login');
          } else {
            setLoading(false);
          }
        }
      } catch {
        setLoading(false);
      }
    }

    checkAuthAndFetchStats();
    fetchGlobalSettings();
  }, []);

  // ── Fetch public homepage content from MySQL ────────────────────────────────
  useEffect(() => {
    async function fetchHomepageContent() {
      try {
        const res = await fetch('/api/homepage?projectId=demo', {
          cache: 'no-store',
        });
        if (res.ok) {
          const data = await res.json();
          setHomepageContent(data);
        }
      } catch (err) {
        console.error('[Homepage] Failed to fetch content:', err);
      } finally {
        setHomepageLoading(false);
      }
    }
    fetchHomepageContent();
  }, []);

  // ── Static fallback feature cards (used when DB has no services yet) ────────
  const fallbackFeatures = [
    {
      icon: '📄',
      title: 'Page Builder',
      description: 'Create and manage stunning pages with our intuitive drag-and-drop builder.',
      link: '/dashboard/pages',
    },
    {
      icon: '🛠️',
      title: 'Service Management',
      description: 'Showcase your services and offerings with beautiful customizable cards.',
      link: '/dashboard/services',
    },
    {
      icon: '📝',
      title: 'Blog Engine',
      description: 'Publish and manage blog posts with categories, SEO, and scheduling.',
      link: '/dashboard/blog',
    },
    {
      icon: '🎯',
      title: 'Lead Generation',
      description: 'Capture and manage leads with forms, CTAs, and tracking analytics.',
      link: '/dashboard/leads',
    },
    {
      icon: '🔍',
      title: 'SEO Tools',
      description: 'Optimize your content with meta tags, sitemaps, and performance insights.',
      link: '/dashboard/seo',
    },
    {
      icon: '📊',
      title: 'Analytics',
      description: 'Track visitors, conversions, and growth with real-time analytics dashboard.',
      link: '/dashboard/analytics',
    },
  ];

  // Use DB services if available, else fall back to hardcoded cards
  const features =
    homepageContent?.services?.length > 0
      ? homepageContent.services.map((svc) => ({
          icon: '🛠️',
          title: svc.title,
          description: svc.description || '',
          link: svc.ctaLink || '/dashboard/services',
          image: svc.image || null,
          ctaText: svc.ctaText || 'Learn more',
        }))
      : fallbackFeatures;

  // ── Helper: format date for display ────────────────────────────────────────
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

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
          animation: 'home-spin 0.8s linear infinite',
        }} />
        <p>Loading your dashboard...</p>
        <style>{`
          @keyframes home-spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  const logo = headerSettings?.logo || '';
  const sticky = headerSettings?.sticky ?? true;
  const transparent = headerSettings?.transparent ?? false;
  const announcementBarActive = headerSettings?.announcementBarActive ?? false;
  const announcementBarText = headerSettings?.announcementBarText || '';

  // Use navigation builder menu items if they exist, otherwise header builder navLinks, otherwise default
  let displayLinks = [];
  if (navigationMenu && navigationMenu.length > 0) {
    displayLinks = navigationMenu;
  } else if (headerSettings?.navLinks && headerSettings.navLinks.length > 0) {
    displayLinks = headerSettings.navLinks;
  } else {
    displayLinks = [
      { label: 'Features', path: '#features' },
      { label: 'Stats', path: '#stats' }
    ];
  }

  return (
    <>
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
          backdropFilter: (transparent && !isScrolled) ? 'none' : 'blur(12px)'
        }}
      >
        <div className="home-nav-inner">
          <div className="home-logo">
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
          </div>
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
                <a 
                  key={idx} 
                  href={path} 
                  target={item.newTab ? "_blank" : undefined}
                  rel={item.newTab ? "noopener noreferrer" : undefined}
                  className="home-nav-link"
                >
                  {item.label}
                </a>
              );
            })}
            {!isAuthenticated && (
              <Link href="/login" className="home-nav-link">
                Login
              </Link>
            )}
            <Link 
              href={headerSettings?.ctaLink || (isAuthenticated ? '/dashboard' : '/register')} 
              className="home-cta-btn"
            >
              {headerSettings?.ctaText || (isAuthenticated ? 'Dashboard' : 'Register')}
            </Link>
            {isAuthenticated && (
              <button 
                onClick={handleLogout} 
                className="home-nav-link"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'inherit',
                  cursor: 'pointer',
                  font: 'inherit',
                  padding: 0
                }}
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section 
        className="home-hero"
        style={{ 
          paddingTop: announcementBarActive && announcementBarText ? '8rem' : '6rem' 
        }}
      >
        <div className="home-hero-bg">
          <div className="home-hero-orb home-hero-orb-1" />
          <div className="home-hero-orb home-hero-orb-2" />
        </div>
        <div className="home-hero-content">
          <div className="home-hero-badge">🚀 All-in-One Platform</div>
          <h1 className="home-hero-title">
            Manage Your Digital
            <span className="home-gradient-text"> Presence</span>
            {' '}From One Dashboard
          </h1>
          <p className="home-hero-subtitle">
            Build, manage, and grow your online presence with our comprehensive suite of tools.
            From pages and blogs to SEO and analytics — everything you need in one place.
          </p>
          <div className="home-hero-actions">
            <Link href={isAuthenticated ? '/dashboard' : '/register'} className="home-primary-btn">
              <span>{isAuthenticated ? 'Go to Dashboard' : 'Get Started Free'}</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </Link>
            <a href="#features" className="home-secondary-btn">
              Learn More
            </a>
          </div>

          {/* Hero Stats */}
          {stats && (
            <div className="home-hero-stats">
              <div className="home-hero-stat">
                <span className="home-hero-stat-value">{stats.stats.pages}</span>
                <span className="home-hero-stat-label">Pages</span>
              </div>
              <div className="home-hero-stat">
                <span className="home-hero-stat-value">{stats.stats.leads}</span>
                <span className="home-hero-stat-label">Leads</span>
              </div>
              <div className="home-hero-stat">
                <span className="home-hero-stat-value">{stats.stats.services}</span>
                <span className="home-hero-stat-label">Services</span>
              </div>
              <div className="home-hero-stat">
                <span className="home-hero-stat-value">{stats.stats.blogs}</span>
                <span className="home-hero-stat-label">Blog Posts</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Quick Stats Section */}
      <section id="stats" className="home-section">
        <div className="home-section-header">
          <h2>Platform Overview</h2>
          <p>Real-time metrics from your dashboard</p>
        </div>
        <div className="home-stats-grid">
          {stats ? (
            <>
              <div className="home-stat-card">
                <div className="home-stat-icon" style={{ background: 'linear-gradient(135deg, #0ea5e9, #06b6d4)' }}>
                  📄
                </div>
                <div className="home-stat-info">
                  <div className="home-stat-number">{stats.stats.pages}</div>
                  <div className="home-stat-name">Total Pages</div>
                </div>
                <div className="home-stat-detail">
                  {stats.stats.publishedPages} published · {stats.stats.draftPages} drafts
                </div>
              </div>
              <div className="home-stat-card">
                <div className="home-stat-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                  💼
                </div>
                <div className="home-stat-info">
                  <div className="home-stat-number">{stats.stats.leads}</div>
                  <div className="home-stat-name">Total Leads</div>
                </div>
                <div className="home-stat-detail">
                  {stats.stats.newLeads} new this week
                </div>
              </div>
              <div className="home-stat-card">
                <div className="home-stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                  🛠️
                </div>
                <div className="home-stat-info">
                  <div className="home-stat-number">{stats.stats.services}</div>
                  <div className="home-stat-name">Services</div>
                </div>
                <div className="home-stat-detail">
                  {stats.stats.activeServices} active services
                </div>
              </div>
              <div className="home-stat-card">
                <div className="home-stat-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
                  📝
                </div>
                <div className="home-stat-info">
                  <div className="home-stat-number">{stats.stats.blogs}</div>
                  <div className="home-stat-name">Blog Posts</div>
                </div>
                <div className="home-stat-detail">
                  {stats.stats.media} media files
                </div>
              </div>
              <div className="home-stat-card">
                <div className="home-stat-icon" style={{ background: 'linear-gradient(135deg, #ec4899, #db2777)' }}>
                  👥
                </div>
                <div className="home-stat-info">
                  <div className="home-stat-number">{stats.stats.teamMembers}</div>
                  <div className="home-stat-name">Team Members</div>
                </div>
                <div className="home-stat-detail">
                  {stats.stats.testimonials} testimonials
                </div>
              </div>
              <div className="home-stat-card">
                <div className="home-stat-icon" style={{ background: 'linear-gradient(135deg, #14b8a6, #0d9488)' }}>
                  🔔
                </div>
                <div className="home-stat-info">
                  <div className="home-stat-number">{stats.stats.notifications}</div>
                  <div className="home-stat-name">Notifications</div>
                </div>
                <div className="home-stat-detail">
                  {stats.stats.unreadNotifications} unread
                </div>
              </div>
            </>
          ) : (
            <div className="home-empty">Unable to load stats. Please login to view metrics.</div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="home-section">
        <div className="home-section-header">
          <h2>Everything You Need</h2>
          <p>Comprehensive tools to manage your entire digital presence</p>
        </div>
        <div className="home-features-grid">
          {features.map((feature) => (
            <Link href={feature.link} key={feature.title} className="home-feature-card">
              <div className="home-feature-icon">{feature.icon}</div>
              <h3 className="home-feature-title">{feature.title}</h3>
              <p className="home-feature-desc">{feature.description}</p>
              <div className="home-feature-link">
                <span>Learn more</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── DYNAMIC: Categories bar ───────────────────────────────────── */}
      {homepageContent?.categories?.length > 0 && (
        <section className="home-section" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
          <div className="home-section-header">
            <h2>Browse by Category</h2>
            <p>Explore content by topic area</p>
          </div>
          <div className="home-categories-bar">
            {homepageContent.categories.map((cat) => (
              <div key={cat.name} className="home-category-chip">
                <span className="home-category-name">{cat.name}</span>
                <span className="home-category-count">{cat.count}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── DYNAMIC: Featured Posts ───────────────────────────────────── */}
      {homepageContent?.featuredPosts?.length > 0 && (
        <section className="home-section">
          <div className="home-section-header">
            <h2>Featured Posts</h2>
            <p>Hand-picked articles from our editorial team</p>
          </div>
          <div className="home-featured-grid">
            {homepageContent.featuredPosts.map((post, idx) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className={`home-featured-card ${idx === 0 ? 'home-featured-card--hero' : ''}`}
              >
                {post.featuredImage && (
                  <div className="home-featured-img-wrap">
                    <img src={post.featuredImage} alt={post.title} className="home-featured-img" />
                  </div>
                )}
                <div className="home-featured-body">
                  {post.category && (
                    <span className="home-post-category">{post.category}</span>
                  )}
                  <h3 className="home-featured-title">{post.title}</h3>
                  {post.excerpt && (
                    <p className="home-featured-excerpt">{post.excerpt}</p>
                  )}
                  <div className="home-post-meta">
                    {post.author && <span>✍️ {post.author}</span>}
                    {post.publishedAt && <span>🗓 {formatDate(post.publishedAt)}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── DYNAMIC: Latest Blogs + Trending sidebar ─────────────────── */}
      {homepageContent?.latestBlogs?.length > 0 && (
        <section className="home-section">
          <div className="home-section-header">
            <h2>Latest Blogs</h2>
            <p>Fresh content published by our team</p>
          </div>
          <div className="home-blogs-layout">
            {/* Main blog list */}
            <div className="home-blogs-main">
              {homepageContent.latestBlogs.map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`} className="home-blog-card">
                  {post.featuredImage && (
                    <div className="home-blog-img-wrap">
                      <img src={post.featuredImage} alt={post.title} className="home-blog-img" />
                    </div>
                  )}
                  <div className="home-blog-body">
                    {post.category && (
                      <span className="home-post-category">{post.category}</span>
                    )}
                    <h3 className="home-blog-title">{post.title}</h3>
                    {post.excerpt && (
                      <p className="home-blog-excerpt">{post.excerpt}</p>
                    )}
                    <div className="home-post-meta">
                      {post.author && <span>✍️ {post.author}</span>}
                      {post.publishedAt && <span>🗓 {formatDate(post.publishedAt)}</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Trending sidebar */}
            {homepageContent.trendingPosts?.length > 0 && (
              <aside className="home-trending-sidebar">
                <div className="home-panel">
                  <div className="home-panel-header">
                    <h3>🔥 Trending Now</h3>
                  </div>
                  <div className="home-panel-body">
                    {homepageContent.trendingPosts.map((post, idx) => (
                      <Link key={post.id} href={`/blog/${post.slug}`} className="home-trending-item">
                        <span className="home-trending-num">{String(idx + 1).padStart(2, '0')}</span>
                        <div className="home-trending-body">
                          <div className="home-trending-title">{post.title}</div>
                          {post.category && (
                            <div className="home-trending-cat">{post.category}</div>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Popular posts */}
                {homepageContent.popularPosts?.length > 0 && (
                  <div className="home-panel" style={{ marginTop: '1.25rem' }}>
                    <div className="home-panel-header">
                      <h3>⭐ Popular Posts</h3>
                    </div>
                    <div className="home-panel-body">
                      {homepageContent.popularPosts.map((post) => (
                        <Link key={post.id} href={`/blog/${post.slug}`} className="home-popular-item">
                          {post.featuredImage && (
                            <img src={post.featuredImage} alt={post.title} className="home-popular-img" />
                          )}
                          <div className="home-popular-body">
                            <div className="home-popular-title">{post.title}</div>
                            {post.publishedAt && (
                              <div className="home-popular-date">{formatDate(post.publishedAt)}</div>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </aside>
            )}
          </div>
        </section>
      )}

      {/* ── DYNAMIC: Recent Articles (from Pages) ────────────────────── */}
      {homepageContent?.recentArticles?.length > 0 && (
        <section className="home-section">
          <div className="home-section-header">
            <h2>Recent Articles</h2>
            <p>Pages and in-depth guides from our platform</p>
          </div>
          <div className="home-articles-grid">
            {homepageContent.recentArticles.map((article) => (
              <Link key={article.id} href={`/${article.slug}`} className="home-article-card">
                {article.banner && (
                  <div className="home-article-img-wrap">
                    <img src={article.banner} alt={article.title} className="home-article-img" />
                  </div>
                )}
                <div className="home-article-body">
                  <h3 className="home-article-title">{article.title}</h3>
                  {article.excerpt && (
                    <p className="home-article-excerpt">{article.excerpt}</p>
                  )}
                  <span className="home-article-read">Read article →</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── DYNAMIC: Testimonials ─────────────────────────────────────── */}
      {homepageContent?.testimonials?.length > 0 && (
        <section className="home-section">
          <div className="home-section-header">
            <h2>What Our Clients Say</h2>
            <p>Real reviews from real people</p>
          </div>
          <div className="home-testimonials-grid">
            {homepageContent.testimonials.map((t) => (
              <div key={t.id} className="home-testimonial-card">
                <div className="home-testimonial-stars">
                  {'★'.repeat(Math.max(0, Math.min(5, t.rating)))}
                  {'☆'.repeat(Math.max(0, 5 - Math.min(5, t.rating)))}
                </div>
                <p className="home-testimonial-text">&ldquo;{t.content}&rdquo;</p>
                <div className="home-testimonial-author">
                  {t.clientImage && (
                    <img src={t.clientImage} alt={t.clientName} className="home-testimonial-avatar" />
                  )}
                  <div className="home-testimonial-name">{t.clientName}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── DYNAMIC: Team Members ─────────────────────────────────────── */}
      {homepageContent?.teamMembers?.length > 0 && (
        <section className="home-section">
          <div className="home-section-header">
            <h2>Meet Our Team</h2>
            <p>The people behind the platform</p>
          </div>
          <div className="home-team-grid">
            {homepageContent.teamMembers.map((member) => (
              <div key={member.id} className="home-team-card">
                {member.photo && (
                  <img src={member.photo} alt={member.name} className="home-team-photo" />
                )}
                <div className="home-team-name">{member.name}</div>
                {member.role && <div className="home-team-role">{member.role}</div>}
                {member.bio && <p className="home-team-bio">{member.bio}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── DYNAMIC: FAQs ─────────────────────────────────────────────── */}
      {homepageContent?.faqs?.length > 0 && (
        <section className="home-section">
          <div className="home-section-header">
            <h2>Frequently Asked Questions</h2>
            <p>Everything you need to know</p>
          </div>
          <div className="home-faqs-list">
            {homepageContent.faqs.map((faq) => (
              <div key={faq.id} className="home-faq-item">
                <button
                  className="home-faq-question"
                  onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                >
                  <span>{faq.question}</span>
                  <span className="home-faq-toggle">{expandedFaq === faq.id ? '−' : '+'}</span>
                </button>
                {expandedFaq === faq.id && (
                  <div className="home-faq-answer">{faq.answer}</div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent Activity & Notifications */}
      {stats && (
        <section className="home-section">
          <div className="home-section-header">
            <h2>Recent Activity</h2>
            <p>Latest updates from your platform</p>
          </div>
          <div className="home-activity-grid">
            {/* Recent Activity */}
            <div className="home-panel">
              <div className="home-panel-header">
                <h3>Activity Feed</h3>
                <Link href="/dashboard/activity" className="home-view-all">View all →</Link>
              </div>
              <div className="home-panel-body">
                {stats.recentActivity.length > 0 ? (
                  stats.recentActivity.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="home-activity-item">
                      <div className="home-activity-dot" />
                      <div className="home-activity-content">
                        <div className="home-activity-action">{activity.action}</div>
                        <div className="home-activity-detail">
                          {activity.details || activity.entity}
                        </div>
                        <div className="home-activity-time">{activity.timeAgo}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="home-empty-small">No recent activity</div>
                )}
              </div>
            </div>

            {/* Notifications */}
            <div className="home-panel">
              <div className="home-panel-header">
                <h3>Notifications</h3>
                <Link href="/dashboard/notifications" className="home-view-all">View all →</Link>
              </div>
              <div className="home-panel-body">
                {stats.notifications.length > 0 ? (
                  stats.notifications.map((notif) => (
                    <div key={notif.id} className={`home-notif-item ${!notif.isRead ? 'unread' : ''}`}>
                      <div className="home-notif-icon">
                        {notif.type === 'lead' ? '💼' : notif.type === 'form' ? '📋' : notif.type === 'system' ? '⚙️' : '🔔'}
                      </div>
                      <div className="home-notif-content">
                        <div className="home-notif-title">{notif.title}</div>
                        <div className="home-notif-msg">{notif.message}</div>
                        <div className="home-notif-time">{notif.timeAgo}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="home-empty-small">No notifications</div>
                )}
              </div>
            </div>

            {/* Upcoming Tasks */}
            <div className="home-panel">
              <div className="home-panel-header">
                <h3>Upcoming Tasks</h3>
                <Link href="/dashboard/pages" className="home-view-all">View all →</Link>
              </div>
              <div className="home-panel-body">
                {stats.upcomingTasks.length > 0 ? (
                  stats.upcomingTasks.map((task) => (
                    <div key={task.id} className="home-task-item">
                      <div className="home-task-status">
                        <div className={`home-task-dot ${task.status}`} />
                      </div>
                      <div className="home-task-content">
                        <div className="home-task-title">{task.title}</div>
                        <div className="home-task-date">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                          </svg>
                          {task.dueDate}
                        </div>
                      </div>
                      <span className="home-task-badge">{task.status}</span>
                    </div>
                  ))
                ) : (
                  <div className="home-empty-small">No upcoming tasks</div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Quick Actions / CTA */}
      {!isAuthenticated && (
        <section className="home-cta-section">
          <div className="home-cta-card">
            <h2>Ready to Take Control?</h2>
            <p>Start managing your entire digital presence from one powerful dashboard.</p>
            <div className="home-cta-actions">
              <Link href="/login" className="home-primary-btn home-primary-btn-lg">
                Login to Dashboard
              </Link>
            </div>
          </div>
        </section>
      )}

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
                  <div key={idx} className="home-footer-nav-col">
                    <h4 className="home-footer-col-title">{col.title}</h4>
                    <ul className="home-footer-col-list">
                      {col.links && col.links.map((link, lIdx) => (
                        <li key={lIdx}>
                          <a href={link.href} className="home-footer-col-link">{link.label}</a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}

                {/* Newsletter Column */}
                {footerSettings?.showNewsletter && (
                  <div className="home-footer-newsletter-col">
                    <h4 className="home-footer-col-title">Stay Updated</h4>
                    <p className="home-footer-newsletter-text">Subscribe to our newsletter for features and updates.</p>
                    <form className="home-footer-newsletter-form" onSubmit={(e) => { e.preventDefault(); alert('Subscribed successfully!'); e.target.reset(); }}>
                      <input type="email" placeholder="Enter your email" required className="home-footer-newsletter-input" />
                      <button type="submit" className="home-footer-newsletter-btn">Subscribe</button>
                    </form>
                  </div>
                )}
              </div>

              <div className="home-footer-divider" />

              <div className="home-footer-bottom">
                <div className="home-footer-copy">
                  {footerSettings?.copyright || `© ${new Date().getFullYear()} GlobalBackend. All rights reserved.`}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="home-footer-brand">
                <div className="home-logo-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                  </svg>
                </div>
                <span>GlobalBackend</span>
              </div>
              <div className="home-footer-links">
                {isAuthenticated ? (
                  <>
                    <Link href="/dashboard">Dashboard</Link>
                    <button 
                      onClick={handleLogout} 
                      className="home-footer-logout-btn"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'inherit',
                        cursor: 'pointer',
                        font: 'inherit',
                        padding: 0,
                        textDecoration: 'underline'
                      }}
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login">Login</Link>
                    <Link href="/register">Register</Link>
                  </>
                )}
              </div>
              <div className="home-footer-copy">
                {footerSettings?.copyright || `© ${new Date().getFullYear()} GlobalBackend. All rights reserved.`}
              </div>
            </>
          )}
        </div>
      </footer>

      <style jsx>{`
        /* ── Dynamic magazine section styles ───────────────────────────────── */

        /* Categories bar */
        .home-categories-bar {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
        }
        .home-category-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: var(--bg-card);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-pill);
          cursor: pointer;
          transition: var(--transition);
        }
        .home-category-chip:hover {
          border-color: var(--primary);
          background: var(--bg-card-hover);
        }
        .home-category-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
        }
        .home-category-count {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--primary);
          background: var(--primary-light);
          padding: 0.125rem 0.4rem;
          border-radius: var(--radius-pill);
        }

        /* Featured Posts */
        .home-featured-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }
        .home-featured-card {
          background: var(--bg-card);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          overflow: hidden;
          text-decoration: none;
          transition: var(--transition);
          display: flex;
          flex-direction: column;
        }
        .home-featured-card:hover {
          border-color: var(--border-strong);
          transform: translateY(-4px);
          box-shadow: var(--shadow-lg);
        }
        .home-featured-card--hero {
          grid-column: 1 / -1;
          flex-direction: row;
        }
        .home-featured-card--hero .home-featured-img-wrap {
          width: 45%;
          flex-shrink: 0;
        }
        .home-featured-img-wrap {
          overflow: hidden;
          max-height: 220px;
        }
        .home-featured-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s ease;
        }
        .home-featured-card:hover .home-featured-img {
          transform: scale(1.04);
        }
        .home-featured-body {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        .home-featured-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--text-h1);
          margin-bottom: 0.5rem;
          line-height: 1.4;
        }
        .home-featured-excerpt {
          font-size: 0.875rem;
          color: var(--text-secondary);
          line-height: 1.6;
          flex: 1;
          margin-bottom: 0.75rem;
        }
        .home-post-category {
          display: inline-block;
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--primary);
          background: var(--primary-light);
          padding: 0.2rem 0.5rem;
          border-radius: var(--radius-pill);
          margin-bottom: 0.5rem;
        }
        .home-post-meta {
          display: flex;
          gap: 1rem;
          font-size: 0.775rem;
          color: var(--text-muted);
          flex-wrap: wrap;
        }

        /* Blog list + trending layout */
        .home-blogs-layout {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 2rem;
          align-items: start;
        }
        @media (max-width: 900px) {
          .home-blogs-layout { grid-template-columns: 1fr; }
          .home-trending-sidebar { display: none; }
          .home-featured-card--hero { flex-direction: column; }
          .home-featured-card--hero .home-featured-img-wrap { width: 100%; }
        }
        .home-blogs-main {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .home-blog-card {
          background: var(--bg-card);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          overflow: hidden;
          display: flex;
          gap: 1.25rem;
          text-decoration: none;
          transition: var(--transition);
          padding: 1rem;
        }
        .home-blog-card:hover {
          border-color: var(--border-strong);
          transform: translateX(4px);
          box-shadow: var(--shadow-md);
        }
        .home-blog-img-wrap {
          width: 120px;
          height: 90px;
          flex-shrink: 0;
          border-radius: var(--radius-sm);
          overflow: hidden;
        }
        .home-blog-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }
        .home-blog-card:hover .home-blog-img { transform: scale(1.05); }
        .home-blog-body { flex: 1; min-width: 0; }
        .home-blog-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-h1);
          margin-bottom: 0.375rem;
          line-height: 1.4;
        }
        .home-blog-excerpt {
          font-size: 0.825rem;
          color: var(--text-secondary);
          line-height: 1.5;
          margin-bottom: 0.5rem;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Trending sidebar */
        .home-trending-sidebar { display: flex; flex-direction: column; }
        .home-trending-item {
          display: flex;
          gap: 0.875rem;
          padding: 0.875rem 1.25rem;
          text-decoration: none;
          transition: var(--transition);
          align-items: flex-start;
          border-bottom: 1px solid var(--border-light);
        }
        .home-trending-item:last-child { border-bottom: none; }
        .home-trending-item:hover { background: rgba(255,255,255,0.02); }
        .home-trending-num {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--primary);
          opacity: 0.5;
          flex-shrink: 0;
          min-width: 28px;
        }
        .home-trending-title {
          font-size: 0.825rem;
          font-weight: 600;
          color: var(--text-primary);
          line-height: 1.4;
          margin-bottom: 0.25rem;
        }
        .home-trending-cat {
          font-size: 0.7rem;
          color: var(--primary);
          font-weight: 600;
        }
        .home-popular-item {
          display: flex;
          gap: 0.75rem;
          padding: 0.75rem 1.25rem;
          text-decoration: none;
          transition: var(--transition);
          align-items: center;
          border-bottom: 1px solid var(--border-light);
        }
        .home-popular-item:last-child { border-bottom: none; }
        .home-popular-item:hover { background: rgba(255,255,255,0.02); }
        .home-popular-img {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-sm);
          object-fit: cover;
          flex-shrink: 0;
        }
        .home-popular-title {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-primary);
          line-height: 1.4;
        }
        .home-popular-date {
          font-size: 0.7rem;
          color: var(--text-muted);
          margin-top: 0.2rem;
        }

        /* Recent Articles */
        .home-articles-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.25rem;
        }
        .home-article-card {
          background: var(--bg-card);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          overflow: hidden;
          text-decoration: none;
          transition: var(--transition);
        }
        .home-article-card:hover {
          border-color: var(--border-strong);
          transform: translateY(-3px);
          box-shadow: var(--shadow-md);
        }
        .home-article-img-wrap {
          height: 160px;
          overflow: hidden;
        }
        .home-article-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }
        .home-article-card:hover .home-article-img { transform: scale(1.04); }
        .home-article-body { padding: 1.25rem; }
        .home-article-title {
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-h1);
          margin-bottom: 0.5rem;
          line-height: 1.4;
        }
        .home-article-excerpt {
          font-size: 0.8rem;
          color: var(--text-secondary);
          line-height: 1.5;
          margin-bottom: 0.75rem;
        }
        .home-article-read {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--primary);
        }

        /* Testimonials */
        .home-testimonials-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
        }
        .home-testimonial-card {
          background: var(--bg-card);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          padding: 1.75rem;
          transition: var(--transition);
        }
        .home-testimonial-card:hover {
          border-color: var(--border-strong);
          transform: translateY(-3px);
          box-shadow: var(--shadow-md);
        }
        .home-testimonial-stars {
          font-size: 1rem;
          color: var(--accent);
          margin-bottom: 0.75rem;
          letter-spacing: 2px;
        }
        .home-testimonial-text {
          font-size: 0.9rem;
          color: var(--text-secondary);
          line-height: 1.7;
          font-style: italic;
          margin-bottom: 1.25rem;
        }
        .home-testimonial-author {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .home-testimonial-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          object-fit: cover;
        }
        .home-testimonial-name {
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--text-h1);
        }

        /* Team */
        .home-team-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
        }
        .home-team-card {
          background: var(--bg-card);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          padding: 1.5rem;
          text-align: center;
          transition: var(--transition);
        }
        .home-team-card:hover {
          border-color: var(--border-strong);
          transform: translateY(-3px);
          box-shadow: var(--shadow-md);
        }
        .home-team-photo {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          object-fit: cover;
          margin: 0 auto 0.75rem;
          display: block;
          border: 2px solid var(--border-strong);
        }
        .home-team-name {
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-h1);
          margin-bottom: 0.25rem;
        }
        .home-team-role {
          font-size: 0.8rem;
          color: var(--primary);
          font-weight: 600;
          margin-bottom: 0.5rem;
        }
        .home-team-bio {
          font-size: 0.8rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        /* FAQs */
        .home-faqs-list {
          max-width: 800px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .home-faq-item {
          background: var(--bg-card);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          overflow: hidden;
          transition: var(--transition);
        }
        .home-faq-item:hover {
          border-color: var(--border-strong);
        }
        .home-faq-question {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          padding: 1.25rem 1.5rem;
          background: transparent;
          border: none;
          cursor: pointer;
          color: var(--text-primary);
          font-size: 0.9rem;
          font-weight: 700;
          font-family: inherit;
          text-align: left;
          transition: var(--transition);
        }
        .home-faq-question:hover { color: var(--text-h1); }
        .home-faq-toggle {
          font-size: 1.25rem;
          color: var(--primary);
          flex-shrink: 0;
          font-weight: 400;
        }
        .home-faq-answer {
          padding: 0 1.5rem 1.25rem;
          font-size: 0.875rem;
          color: var(--text-secondary);
          line-height: 1.7;
          border-top: 1px solid var(--border-light);
          padding-top: 1rem;
        }

        /* Navigation */
        .home-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          background: rgba(9, 9, 11, 0.8);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border-light);
          transition: background 0.3s ease, border-color 0.3s ease, backdrop-filter 0.3s ease;
        }
        .home-logo-img {
          height: 32px;
          max-width: 150px;
          object-fit: contain;
        }
        .home-announcement-bar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 36px;
          background: var(--gradient-primary);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.85rem;
          font-weight: 600;
          z-index: 101;
          box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        }
        .home-nav-dropdown-wrapper {
          position: relative;
          display: inline-block;
        }
        .home-nav-dropdown-trigger {
          display: inline-flex;
          align-items: center;
          cursor: pointer;
        }
        .home-nav-dropdown {
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%) translateY(10px);
          opacity: 0;
          visibility: hidden;
          background: rgba(9, 9, 11, 0.95);
          backdrop-filter: blur(16px);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          min-width: 180px;
          padding: 0.5rem;
          box-shadow: var(--shadow-lg), var(--shadow-glow);
          transition: all 0.2s ease-in-out;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          z-index: 200;
        }
        .home-nav-dropdown-wrapper:hover .home-nav-dropdown {
          opacity: 1;
          visibility: visible;
          transform: translateX(-50%) translateY(0);
        }
        .home-nav-dropdown-item {
          padding: 0.5rem 1rem;
          color: var(--text-secondary);
          font-size: 0.85rem;
          font-weight: 600;
          text-decoration: none;
          border-radius: var(--radius-sm);
          transition: var(--transition);
          white-space: nowrap;
          text-align: left;
        }
        .home-nav-dropdown-item:hover {
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-primary);
        }
        .home-nav-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.5rem;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .home-logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .home-logo-icon {
          width: 36px;
          height: 36px;
          background: var(--gradient-primary);
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          box-shadow: var(--shadow-glow);
        }
        .home-logo-text {
          font-size: 1.25rem;
          font-weight: 800;
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .home-nav-links {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }
        .home-nav-link {
          color: var(--text-secondary);
          font-weight: 600;
          font-size: 0.9rem;
          transition: var(--transition);
          text-decoration: none;
        }
        .home-nav-link:hover {
          color: var(--text-primary);
        }
        .home-cta-btn {
          padding: 0.5rem 1.25rem;
          background: var(--gradient-primary);
          color: #fff;
          border-radius: var(--radius-pill);
          font-weight: 700;
          font-size: 0.875rem;
          text-decoration: none;
          transition: var(--transition);
          box-shadow: 0 4px 15px rgba(14, 165, 233, 0.25);
        }
        .home-cta-btn:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-glow), 0 8px 25px rgba(14, 165, 233, 0.4);
        }

        /* Hero Section */
        .home-hero {
          position: relative;
          min-height: 90vh;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          padding: 6rem 1.5rem 4rem;
        }
        .home-hero-bg {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .home-hero-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          opacity: 0.3;
        }
        .home-hero-orb-1 {
          width: 600px;
          height: 600px;
          background: var(--primary);
          top: -200px;
          right: -200px;
          animation: floatSlow 20s infinite alternate;
        }
        .home-hero-orb-2 {
          width: 500px;
          height: 500px;
          background: var(--secondary);
          bottom: -250px;
          left: -150px;
          animation: floatSlow 25s infinite alternate-reverse;
        }
        @keyframes floatSlow {
          from { transform: translate(0, 0); }
          to { transform: translate(50px, -50px); }
        }
        .home-hero-content {
          position: relative;
          max-width: 800px;
          text-align: center;
          z-index: 10;
        }
        .home-hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: rgba(14, 165, 233, 0.1);
          border: 1px solid rgba(14, 165, 233, 0.2);
          border-radius: var(--radius-pill);
          color: var(--primary);
          font-weight: 600;
          font-size: 0.875rem;
          margin-bottom: 1.5rem;
        }
        .home-hero-title {
          font-size: 3.5rem;
          font-weight: 800;
          color: var(--text-h1);
          line-height: 1.1;
          margin-bottom: 1.5rem;
          letter-spacing: -0.03em;
        }
        .home-gradient-text {
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .home-hero-subtitle {
          font-size: 1.15rem;
          color: var(--text-secondary);
          line-height: 1.7;
          max-width: 600px;
          margin: 0 auto 2rem;
        }
        .home-hero-actions {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          flex-wrap: wrap;
          margin-bottom: 3rem;
        }
        .home-primary-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.875rem 2rem;
          background: var(--gradient-primary);
          color: #fff;
          border-radius: var(--radius-pill);
          font-weight: 700;
          font-size: 1rem;
          text-decoration: none;
          transition: var(--transition);
          box-shadow: 0 4px 15px rgba(14, 165, 233, 0.25);
        }
        .home-primary-btn:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-glow), 0 8px 25px rgba(14, 165, 233, 0.4);
        }
        .home-primary-btn-lg {
          padding: 1rem 2.5rem;
          font-size: 1.125rem;
        }
        .home-secondary-btn {
          padding: 0.875rem 2rem;
          background: var(--bg-card);
          color: var(--text-primary);
          border: 1px solid var(--border-strong);
          border-radius: var(--radius-pill);
          font-weight: 600;
          font-size: 1rem;
          text-decoration: none;
          transition: var(--transition);
        }
        .home-secondary-btn:hover {
          background: var(--bg-card-hover);
          border-color: var(--text-muted);
        }
        .home-hero-stats {
          display: flex;
          justify-content: center;
          gap: 2.5rem;
          flex-wrap: wrap;
          padding: 2rem;
          background: rgba(24, 24, 27, 0.5);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-lg);
          backdrop-filter: blur(10px);
        }
        .home-hero-stat {
          text-align: center;
        }
        .home-hero-stat-value {
          display: block;
          font-size: 2rem;
          font-weight: 800;
          color: var(--text-h1);
          background: var(--gradient-primary);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .home-hero-stat-label {
          font-size: 0.8125rem;
          color: var(--text-muted);
          font-weight: 500;
        }

        /* Sections */
        .home-section {
          max-width: 1200px;
          margin: 0 auto;
          padding: 5rem 1.5rem;
        }
        .home-section-header {
          text-align: center;
          margin-bottom: 3rem;
        }
        .home-section-header h2 {
          font-size: 2.25rem;
          font-weight: 800;
          color: var(--text-h1);
          margin-bottom: 0.75rem;
          letter-spacing: -0.02em;
        }
        .home-section-header p {
          color: var(--text-secondary);
          font-size: 1.05rem;
        }

        /* Stats Grid */
        .home-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.25rem;
        }
        .home-stat-card {
          background: var(--bg-card);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          transition: var(--transition);
        }
        .home-stat-card:hover {
          border-color: var(--border-strong);
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }
        .home-stat-icon {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          color: #fff;
        }
        .home-stat-info {
          display: flex;
          align-items: flex-end;
          gap: 0.75rem;
        }
        .home-stat-number {
          font-size: 2rem;
          font-weight: 800;
          color: var(--text-h1);
          line-height: 1;
        }
        .home-stat-name {
          font-size: 0.875rem;
          color: var(--text-secondary);
          font-weight: 500;
          padding-bottom: 0.25rem;
        }
        .home-stat-detail {
          font-size: 0.8125rem;
          color: var(--text-muted);
          border-top: 1px solid var(--border-light);
          padding-top: 0.75rem;
        }

        /* Features Grid */
        .home-features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 1.25rem;
        }
        .home-feature-card {
          background: var(--bg-card);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          padding: 2rem;
          transition: var(--transition);
          text-decoration: none;
          display: flex;
          flex-direction: column;
        }
        .home-feature-card:hover {
          border-color: var(--border-strong);
          transform: translateY(-4px);
          box-shadow: var(--shadow-lg);
        }
        .home-feature-icon {
          font-size: 2rem;
          margin-bottom: 1rem;
        }
        .home-feature-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--text-h1);
          margin-bottom: 0.5rem;
        }
        .home-feature-desc {
          font-size: 0.875rem;
          color: var(--text-secondary);
          line-height: 1.6;
          flex: 1;
        }
        .home-feature-link {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 1rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--primary);
          transition: var(--transition);
        }
        .home-feature-card:hover .home-feature-link {
          gap: 0.75rem;
        }

        /* Activity Grid */
        .home-activity-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
          gap: 1.5rem;
        }
        .home-panel {
          background: var(--bg-card);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          overflow: hidden;
          transition: var(--transition);
        }
        .home-panel:hover {
          border-color: var(--border-strong);
        }
        .home-panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid var(--border-light);
        }
        .home-panel-header h3 {
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-h1);
        }
        .home-view-all {
          font-size: 0.8125rem;
          color: var(--primary);
          font-weight: 600;
          text-decoration: none;
        }
        .home-view-all:hover {
          text-decoration: underline;
        }
        .home-panel-body {
          padding: 0.5rem 0;
        }

        /* Activity Items */
        .home-activity-item {
          display: flex;
          gap: 1rem;
          padding: 0.875rem 1.5rem;
          transition: var(--transition);
        }
        .home-activity-item:hover {
          background: rgba(255,255,255,0.02);
        }
        .home-activity-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--primary);
          margin-top: 6px;
          flex-shrink: 0;
          box-shadow: 0 0 6px rgba(14, 165, 233, 0.4);
        }
        .home-activity-content {
          flex: 1;
          min-width: 0;
        }
        .home-activity-action {
          font-weight: 600;
          font-size: 0.875rem;
          color: var(--text-primary);
        }
        .home-activity-detail {
          font-size: 0.8125rem;
          color: var(--text-secondary);
          margin-top: 0.125rem;
        }
        .home-activity-time {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-top: 0.25rem;
        }

        /* Notification items */
        .home-notif-item {
          display: flex;
          gap: 0.875rem;
          padding: 0.875rem 1.5rem;
          transition: var(--transition);
        }
        .home-notif-item.unread {
          background: rgba(14, 165, 233, 0.03);
        }
        .home-notif-item:hover {
          background: rgba(255,255,255,0.02);
        }
        .home-notif-icon {
          font-size: 1.125rem;
          flex-shrink: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-secondary);
          border-radius: var(--radius-sm);
        }
        .home-notif-content {
          flex: 1;
          min-width: 0;
        }
        .home-notif-title {
          font-weight: 600;
          font-size: 0.875rem;
          color: var(--text-primary);
        }
        .home-notif-msg {
          font-size: 0.8125rem;
          color: var(--text-secondary);
          margin-top: 0.125rem;
        }
        .home-notif-time {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-top: 0.25rem;
        }

        /* Task items */
        .home-task-item {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          padding: 0.875rem 1.5rem;
          transition: var(--transition);
        }
        .home-task-item:hover {
          background: rgba(255,255,255,0.02);
        }
        .home-task-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }
        .home-task-dot.published { background: var(--success); box-shadow: 0 0 6px rgba(16,185,129,0.4); }
        .home-task-dot.draft { background: var(--warning); box-shadow: 0 0 6px rgba(245,158,11,0.4); }
        .home-task-dot.scheduled { background: var(--info); box-shadow: 0 0 6px rgba(14,165,233,0.4); }
        .home-task-content {
          flex: 1;
          min-width: 0;
        }
        .home-task-title {
          font-weight: 600;
          font-size: 0.875rem;
          color: var(--text-primary);
        }
        .home-task-date {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-top: 0.125rem;
        }
        .home-task-badge {
          font-size: 0.6875rem;
          font-weight: 600;
          padding: 0.25rem 0.5rem;
          border-radius: var(--radius-pill);
          background: var(--bg-secondary);
          border: 1px solid var(--border-light);
          color: var(--text-secondary);
          text-transform: capitalize;
        }

        /* Empty state */
        .home-empty {
          text-align: center;
          padding: 3rem;
          color: var(--text-muted);
          font-weight: 500;
          grid-column: 1 / -1;
        }
        .home-empty-small {
          text-align: center;
          padding: 2rem;
          color: var(--text-muted);
          font-size: 0.875rem;
        }

        /* CTA Section */
        .home-cta-section {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem 1.5rem 5rem;
        }
        .home-cta-card {
          background: var(--gradient-card);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-lg);
          padding: 4rem 2rem;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .home-cta-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: var(--gradient-primary);
        }
        .home-cta-card h2 {
          font-size: 2rem;
          font-weight: 800;
          color: var(--text-h1);
          margin-bottom: 1rem;
        }
        .home-cta-card p {
          font-size: 1.05rem;
          color: var(--text-secondary);
          margin-bottom: 2rem;
          max-width: 500px;
          margin-left: auto;
          margin-right: auto;
        }
        .home-cta-actions {
          display: flex;
          justify-content: center;
        }

        /* Footer */
        .home-footer {
          border-top: 1px solid var(--border-light);
          background: var(--bg-sidebar);
        }
        .home-footer-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 3rem 1.5rem;
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 2rem;
        }
        .home-footer-brand {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 700;
          color: var(--text-secondary);
        }
        .home-footer-links {
          display: flex;
          gap: 1.5rem;
        }
        .home-footer-links a {
          color: var(--text-muted);
          font-size: 0.875rem;
          font-weight: 500;
          text-decoration: none;
          transition: var(--transition);
        }
        .home-footer-links a:hover {
          color: var(--text-primary);
        }
        .home-footer-copy {
          font-size: 0.8125rem;
          color: var(--text-muted);
        }

        /* Dynamic Footer Styling */
        .home-footer-top-grid {
          display: grid;
          grid-template-columns: 2fr repeat(auto-fit, minmax(150px, 1fr)) 2fr;
          gap: 2rem;
          margin-bottom: 2rem;
          text-align: left;
          width: 100%;
        }
        .home-footer-brand-col {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .home-footer-description {
          font-size: 0.875rem;
          color: var(--text-muted);
          line-height: 1.6;
          max-width: 280px;
          text-align: left;
        }
        .home-footer-socials {
          display: flex;
          gap: 0.75rem;
          margin-top: 0.5rem;
        }
        .home-footer-social-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--bg-card);
          border: 1px solid var(--border-light);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.9rem;
          color: var(--text-secondary);
          transition: var(--transition);
          text-decoration: none;
        }
        .home-footer-social-btn:hover {
          background: var(--bg-card-hover);
          border-color: var(--border-strong);
          color: var(--text-primary);
          transform: translateY(-2px);
        }
        .home-footer-nav-col {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .home-footer-col-title {
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--text-h1);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.5rem;
        }
        .home-footer-col-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .home-footer-col-link {
          font-size: 0.875rem;
          color: var(--text-secondary);
          text-decoration: none;
          transition: var(--transition);
        }
        .home-footer-col-link:hover {
          color: var(--text-primary);
        }
        .home-footer-newsletter-col {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .home-footer-newsletter-text {
          font-size: 0.875rem;
          color: var(--text-muted);
          line-height: 1.5;
          text-align: left;
        }
        .home-footer-newsletter-form {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          max-width: 300px;
        }
        .home-footer-newsletter-input {
          padding: 0.6rem 0.875rem;
          background: var(--bg-card);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          color: var(--text-primary);
          font-size: 0.875rem;
          outline: none;
          transition: var(--transition);
        }
        .home-footer-newsletter-input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.15);
        }
        .home-footer-newsletter-btn {
          padding: 0.6rem;
          background: var(--gradient-primary);
          color: #fff;
          font-weight: 600;
          font-size: 0.875rem;
          border: none;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: var(--transition);
          box-shadow: 0 2px 8px rgba(14, 165, 233, 0.2);
          text-align: center;
        }
        .home-footer-newsletter-btn:hover {
          transform: translateY(-1px);
          box-shadow: var(--shadow-glow), 0 4px 12px rgba(14, 165, 233, 0.35);
        }
        .home-footer-divider {
          height: 1px;
          background: var(--border-light);
          margin: 1.5rem 0;
          width: 100%;
        }
        .home-footer-bottom {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .home-hero-title {
            font-size: 2.25rem;
          }
          .home-hero-subtitle {
            font-size: 1rem;
          }
          .home-section-header h2 {
            font-size: 1.75rem;
          }
          .home-hero-stats {
            gap: 1.5rem;
          }
          .home-nav-links a:not(.home-cta-btn) {
            display: none;
          }
          .home-stats-grid {
            grid-template-columns: 1fr;
          }
          .home-features-grid {
            grid-template-columns: 1fr;
          }
          .home-activity-grid {
            grid-template-columns: 1fr;
          }
          .home-footer-inner {
            flex-direction: column;
            text-align: center;
          }
        }
        @media (max-width: 480px) {
          .home-hero-title {
            font-size: 1.75rem;
          }
          .home-hero-actions {
            flex-direction: column;
          }
          .home-primary-btn, .home-secondary-btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </>
  );
}