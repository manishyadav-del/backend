'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

const reservedRoutes = [
  'login',
  'register',
  'dashboard',
  'home',
  'admin',
  'api'
];

export default function CustomPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const slug = params.slug;

  if (reservedRoutes.includes(slug)) {
    notFound();
  }

  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [headerSettings, setHeaderSettings] = useState(null);
  const [footerSettings, setFooterSettings] = useState(null);
  const [navigationMenu, setNavigationMenu] = useState([]);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(null);

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
    async function fetchPageData() {
      try {
        setLoading(true);
        const res = await fetch(`/api/pages/public/${slug}?projectId=demo`);
        if (!res.ok) {
          throw new Error('Page not found');
        }
        const data = await res.json();
        setPageData(data);
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
      fetchPageData();
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
          animation: 'page-spin 0.8s linear infinite',
        }} />
        <p>Loading page...</p>
        <style>{`
          @keyframes page-spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  const logo = headerSettings?.logo || '';
  const sticky = headerSettings?.sticky ?? true;
  const transparent = headerSettings?.transparent ?? false;
  const announcementBarActive = headerSettings?.announcementBarActive ?? false;
  const announcementBarText = headerSettings?.announcementBarText || '';

  let displayLinks = [];
  if (navigationMenu && navigationMenu.length > 0) {
    displayLinks = navigationMenu;
  } else if (headerSettings?.navLinks && headerSettings.navLinks.length > 0) {
    displayLinks = headerSettings.navLinks;
  } else {
    displayLinks = [
      { label: 'Home', path: '/' }
    ];
  }

  const renderSection = (section) => {
    const content = typeof section.content === 'string'
      ? JSON.parse(section.content || '{}')
      : section.content;

    switch (section.type) {
      case 'hero':
        return (
          <section className="section-hero" style={{ backgroundImage: content.backgroundImage ? `url(${content.backgroundImage})` : 'none' }}>
            <div className="hero-overlay" style={{ backgroundColor: content.overlayColor || '#000', opacity: content.overlayOpacity ?? 0.5 }} />
            <div className="hero-content">
              {content.heading && <h1>{content.heading}</h1>}
              {content.subheading && <p className="hero-subheading">{content.subheading}</p>}
              {content.description && <p className="hero-desc">{content.description}</p>}
              {content.buttonText && (
                <a href={content.buttonUrl || '#'} className="btn-primary-custom">{content.buttonText}</a>
              )}
            </div>
          </section>
        );

      case 'about':
        return (
          <section className="section-about">
            <div className="about-container">
              {content.heading && <h2>{content.heading}</h2>}
              {content.content && <p className="about-text">{content.content}</p>}
              {content.image && (
                <div className="about-img-wrap">
                  <img src={content.image} alt={content.imageAlt || 'About image'} />
                </div>
              )}
            </div>
          </section>
        );

      case 'services':
        return (
          <section className="section-services">
            {content.heading && <h2>{content.heading}</h2>}
            <div className="services-grid">
              {content.items?.map((item, i) => (
                <div key={i} className="service-card-custom">
                  {item.icon && <div className="service-icon">{item.icon}</div>}
                  {item.title && <h3>{item.title}</h3>}
                  {item.description && <p>{item.description}</p>}
                </div>
              ))}
            </div>
          </section>
        );

      case 'features':
        return (
          <section className="section-features">
            {content.heading && <h2>{content.heading}</h2>}
            <div className="features-grid">
              {content.items?.map((item, i) => (
                <div key={i} className="feature-item-custom">
                  {item.icon && <span className="feature-icon">{item.icon}</span>}
                  {item.title && <h3>{item.title}</h3>}
                  {item.description && <p>{item.description}</p>}
                </div>
              ))}
            </div>
          </section>
        );

      case 'cta':
        return (
          <section className="section-cta">
            <div className="cta-container" style={{ backgroundImage: content.backgroundImage ? `url(${content.backgroundImage})` : 'none' }}>
              {content.heading && <h2>{content.heading}</h2>}
              {content.description && <p>{content.description}</p>}
              {content.buttonText && (
                <a href={content.buttonUrl || '#'} className="btn-primary-custom">{content.buttonText}</a>
              )}
            </div>
          </section>
        );

      case 'testimonials':
        return (
          <section className="section-testimonials">
            {content.heading && <h2>{content.heading}</h2>}
            <div className="testimonials-grid">
              {content.items?.map((item, i) => (
                <div key={i} className="testimonial-card-custom">
                  {item.rating && (
                    <div className="testimonial-stars">
                      {'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}
                    </div>
                  )}
                  {item.content && <p>&ldquo;{item.content}&rdquo;</p>}
                  <div className="testimonial-author">
                    {item.image && <img src={item.image} alt={item.name} />}
                    <div>
                      <strong>{item.name}</strong>
                      {item.role && <span>{item.role}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );

      case 'faq':
        return (
          <section className="section-faq">
            {content.heading && <h2>{content.heading}</h2>}
            <div className="faq-list">
              {content.items?.map((item, i) => (
                <div key={i} className="faq-item-custom">
                  <button
                    className="faq-question"
                    onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  >
                    <span>{item.question}</span>
                    <span>{expandedFaq === i ? '−' : '+'}</span>
                  </button>
                  {expandedFaq === i && (
                    <div className="faq-answer">{item.answer}</div>
                  )}
                </div>
              ))}
            </div>
          </section>
        );

      case 'gallery':
        return (
          <section className="section-gallery">
            {content.heading && <h2>{content.heading}</h2>}
            <div className="gallery-grid">
              {content.items?.map((item, i) => (
                <div key={i} className="gallery-item-custom">
                  {item.image && <img src={item.image} alt={item.alt || 'Gallery item'} />}
                  {item.caption && <p>{item.caption}</p>}
                </div>
              ))}
            </div>
          </section>
        );

      case 'contact':
        return (
          <section className="section-contact">
            {content.heading && <h2>{content.heading}</h2>}
            {content.description && <p className="contact-desc">{content.description}</p>}
            <div className="contact-info-grid">
              {content.email && <p>📧 <strong>Email:</strong> {content.email}</p>}
              {content.phone && <p>📞 <strong>Phone:</strong> {content.phone}</p>}
              {content.address && <p>📍 <strong>Address:</strong> {content.address}</p>}
            </div>
          </section>
        );

      case 'statistics':
        return (
          <section className="section-statistics">
            {content.heading && <h2>{content.heading}</h2>}
            <div className="stats-grid">
              {content.items?.map((item, i) => (
                <div key={i} className="stat-item-custom">
                  <div className="stat-number">{item.number}</div>
                  <div className="stat-label">{item.label}</div>
                </div>
              ))}
            </div>
          </section>
        );

      case 'team':
        return (
          <section className="section-team">
            {content.heading && <h2>{content.heading}</h2>}
            <div className="team-grid">
              {content.items?.map((item, i) => (
                <div key={i} className="team-card-custom">
                  {item.image && <img src={item.image} alt={item.name} />}
                  <h3>{item.name}</h3>
                  {item.role && <p className="team-role">{item.role}</p>}
                  {item.bio && <p className="team-bio">{item.bio}</p>}
                </div>
              ))}
            </div>
          </section>
        );

      case 'custom':
        return (
          <section 
            className="section-custom"
            dangerouslySetInnerHTML={{ __html: content.html || '' }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="custom-page-root">
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
      <main className="custom-page-main">
        {error || !pageData ? (
          <div className="page-error-card">
            <h2>Page Not Found</h2>
            <p>{error || 'The page you are looking for could not be found.'}</p>
            <Link href="/" className="back-home-btn">← Back to Homepage</Link>
          </div>
        ) : (
          <div className="page-sections-container">
            {pageData.contentBlocks?.filter(s => s.isVisible).map((section) => (
              <div key={section.id} className="rendered-section-wrapper">
                {renderSection(section)}
              </div>
            ))}
          </div>
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
        .custom-page-root {
          background: var(--bg-base);
          min-height: 100vh;
          color: var(--text-primary);
          font-family: var(--font-geist-sans), sans-serif;
        }

        .custom-page-main {
          padding-top: announcementBarActive && announcementBarText ? '8rem' : '6rem';
        }

        .page-error-card {
          max-width: 600px;
          margin: 10rem auto;
          background: var(--bg-card);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          padding: 3rem 2rem;
          text-align: center;
        }

        .page-error-card h2 {
          color: var(--text-h1);
          font-size: 1.75rem;
          margin-bottom: 1rem;
        }

        .page-error-card p {
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

        /* ── Hero Section Style ── */
        .section-hero {
          position: relative;
          padding: 8rem 2rem;
          background-size: cover;
          background-position: center;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          min-height: 50vh;
        }
        .hero-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1;
        }
        .hero-content {
          position: relative;
          z-index: 2;
          max-width: 800px;
        }
        .hero-content h1 {
          font-size: 3rem;
          font-weight: 800;
          color: white;
          margin-bottom: 1rem;
        }
        .hero-subheading {
          font-size: 1.5rem;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 1rem;
        }
        .hero-desc {
          font-size: 1.1rem;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 2rem;
        }
        .btn-primary-custom {
          display: inline-block;
          background: var(--primary);
          color: white;
          padding: 0.75rem 1.75rem;
          border-radius: var(--radius-sm);
          font-weight: 600;
          text-decoration: none;
          transition: var(--transition);
        }
        .btn-primary-custom:hover {
          opacity: 0.9;
        }

        /* ── About Section Style ── */
        .section-about {
          padding: 5rem 2rem;
        }
        .about-container {
          max-width: 800px;
          margin: 0 auto;
          text-align: center;
        }
        .section-about h2 {
          font-size: 2.25rem;
          color: var(--text-h1);
          margin-bottom: 1.5rem;
        }
        .about-text {
          font-size: 1.125rem;
          line-height: 1.8;
          color: var(--text-secondary);
          margin-bottom: 2rem;
        }
        .about-img-wrap {
          border-radius: var(--radius-md);
          overflow: hidden;
          border: 1px solid var(--border-light);
        }
        .about-img-wrap img {
          width: 100%;
          display: block;
        }

        /* ── Services Section Style ── */
        .section-services {
          padding: 5rem 2rem;
          max-width: 1000px;
          margin: 0 auto;
        }
        .section-services h2 {
          font-size: 2.25rem;
          text-align: center;
          color: var(--text-h1);
          margin-bottom: 3rem;
        }
        .services-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
        }
        .service-card-custom {
          background: var(--bg-card);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          padding: 2rem;
          transition: var(--transition);
        }
        .service-card-custom:hover {
          border-color: var(--border-strong);
        }
        .service-icon {
          font-size: 2rem;
          margin-bottom: 1rem;
        }
        .service-card-custom h3 {
          font-size: 1.25rem;
          color: var(--text-h1);
          margin-bottom: 0.75rem;
        }
        .service-card-custom p {
          color: var(--text-secondary);
          line-height: 1.6;
        }

        /* ── Features Section Style ── */
        .section-features {
          padding: 5rem 2rem;
          max-width: 1000px;
          margin: 0 auto;
        }
        .section-features h2 {
          font-size: 2.25rem;
          text-align: center;
          color: var(--text-h1);
          margin-bottom: 3rem;
        }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
        }
        .feature-item-custom {
          display: flex;
          gap: 1rem;
          background: var(--bg-card);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          padding: 1.5rem;
        }
        .feature-icon {
          font-size: 1.5rem;
          color: var(--primary);
        }
        .feature-item-custom h3 {
          font-size: 1.15rem;
          color: var(--text-h1);
          margin-bottom: 0.5rem;
        }
        .feature-item-custom p {
          color: var(--text-secondary);
          font-size: 0.95rem;
          line-height: 1.5;
        }

        /* ── CTA Section Style ── */
        .section-cta {
          padding: 5rem 2rem;
          max-width: 1000px;
          margin: 0 auto;
        }
        .cta-container {
          background-size: cover;
          background-position: center;
          padding: 4rem 2rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-light);
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .section-cta h2 {
          font-size: 2.25rem;
          color: var(--text-h1);
          margin-bottom: 1rem;
        }
        .section-cta p {
          color: var(--text-secondary);
          margin-bottom: 2rem;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }

        /* ── Testimonials Section Style ── */
        .section-testimonials {
          padding: 5rem 2rem;
          max-width: 1000px;
          margin: 0 auto;
        }
        .section-testimonials h2 {
          font-size: 2.25rem;
          text-align: center;
          color: var(--text-h1);
          margin-bottom: 3rem;
        }
        .testimonials-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
        }
        .testimonial-card-custom {
          background: var(--bg-card);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          padding: 2rem;
        }
        .testimonial-stars {
          color: #eab308;
          margin-bottom: 1rem;
        }
        .testimonial-card-custom p {
          font-style: italic;
          color: var(--text-secondary);
          line-height: 1.6;
          margin-bottom: 1.5rem;
        }
        .testimonial-author {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .testimonial-author img {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          object-fit: cover;
        }
        .testimonial-author strong {
          display: block;
          color: var(--text-primary);
        }
        .testimonial-author span {
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        /* ── FAQs Section Style ── */
        .section-faq {
          padding: 5rem 2rem;
          max-width: 800px;
          margin: 0 auto;
        }
        .section-faq h2 {
          font-size: 2.25rem;
          text-align: center;
          color: var(--text-h1);
          margin-bottom: 3rem;
        }
        .faq-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .faq-item-custom {
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          background: var(--bg-card);
          overflow: hidden;
        }
        .faq-question {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem 1.5rem;
          background: none;
          border: none;
          color: var(--text-h1);
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          text-align: left;
        }
        .faq-answer {
          padding: 0 1.5rem 1.25rem;
          color: var(--text-secondary);
          line-height: 1.6;
        }

        /* ── Gallery Section Style ── */
        .section-gallery {
          padding: 5rem 2rem;
          max-width: 1000px;
          margin: 0 auto;
        }
        .section-gallery h2 {
          font-size: 2.25rem;
          text-align: center;
          color: var(--text-h1);
          margin-bottom: 3rem;
        }
        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1.25rem;
        }
        .gallery-item-custom {
          background: var(--bg-card);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          overflow: hidden;
        }
        .gallery-item-custom img {
          width: 100%;
          height: 200px;
          object-fit: cover;
          display: block;
        }
        .gallery-item-custom p {
          padding: 1rem;
          font-size: 0.9rem;
          color: var(--text-secondary);
          text-align: center;
        }

        /* ── Team Section Style ── */
        .section-team {
          padding: 5rem 2rem;
          max-width: 1000px;
          margin: 0 auto;
        }
        .section-team h2 {
          font-size: 2.25rem;
          text-align: center;
          color: var(--text-h1);
          margin-bottom: 3rem;
        }
        .team-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1.5rem;
        }
        .team-card-custom {
          background: var(--bg-card);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          padding: 1.5rem;
          text-align: center;
        }
        .team-card-custom img {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          object-fit: cover;
          margin: 0 auto 1.25rem;
          border: 2px solid var(--border-strong);
        }
        .team-card-custom h3 {
          font-size: 1.2rem;
          color: var(--text-h1);
          margin-bottom: 0.25rem;
        }
        .team-role {
          font-size: 0.9rem;
          color: var(--primary);
          font-weight: 600;
          margin-bottom: 0.75rem;
        }
        .team-bio {
          font-size: 0.875rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        /* ── Statistics Section Style ── */
        .section-statistics {
          padding: 5rem 2rem;
          max-width: 1000px;
          margin: 0 auto;
        }
        .section-statistics h2 {
          font-size: 2.25rem;
          text-align: center;
          color: var(--text-h1);
          margin-bottom: 3rem;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 1.5rem;
          text-align: center;
        }
        .stat-item-custom {
          background: var(--bg-card);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          padding: 2rem;
        }
        .stat-number {
          font-size: 2.5rem;
          font-weight: 800;
          color: var(--primary);
          margin-bottom: 0.5rem;
        }
        .stat-label {
          font-size: 0.95rem;
          color: var(--text-secondary);
          font-weight: 600;
        }

        /* ── Contact Section Style ── */
        .section-contact {
          padding: 5rem 2rem;
          max-width: 800px;
          margin: 0 auto;
          text-align: center;
        }
        .section-contact h2 {
          font-size: 2.25rem;
          color: var(--text-h1);
          margin-bottom: 1.5rem;
        }
        .contact-desc {
          font-size: 1.1rem;
          color: var(--text-secondary);
          margin-bottom: 2.5rem;
        }
        .contact-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1.5rem;
          text-align: left;
        }
        .contact-info-grid p {
          background: var(--bg-card);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          padding: 1.25rem;
          margin: 0;
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
}
