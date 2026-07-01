import React, { createContext, useContext, useState, useEffect } from 'react';
import Script from 'next/script';
import { Settings, PageSection } from './types.js';
import { useComponentData, useCTAs, useSubmitForm } from './hooks.js';


const GlobalBackendContext = createContext<any>(null);

export function GlobalBackendProvider({ children, client }: { children: React.ReactNode; client: any }) {
  const [isolateName, setIsolateName] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const name = params.get('isolateComponent') || params.get('previewComponent');
      setIsolateName(name);
    }
  }, []);

  return (
    <GlobalBackendContext.Provider value={client}>
      {isolateName && (
        <style dangerouslySetInnerHTML={{ __html: `
          /* Hide all standard direct children of body */
          body > * {
            display: none !important;
          }
          
          /* Reveal isolated custom component containers */
          [data-global-component="${isolateName}"] {
            display: block !important;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            z-index: 9999999 !important;
            background: #ffffff !important;
            overflow: auto !important;
            padding: 2rem !important;
            box-sizing: border-box !important;
          }

          /* Specifically reveal Header when isolated */
          ${isolateName.toLowerCase() === 'header' ? `
            header {
              display: block !important;
              position: relative !important;
              top: 0 !important;
              left: 0 !important;
              width: 100% !important;
              z-index: 9999999 !important;
            }
            body > header,
            body > div > header,
            body > main > header {
              display: block !important;
            }
          ` : ''}

          /* Specifically reveal Footer when isolated */
          ${isolateName.toLowerCase() === 'footer' ? `
            footer {
              display: block !important;
              position: relative !important;
              bottom: 0 !important;
              width: 100% !important;
              z-index: 9999999 !important;
            }
            body > footer,
            body > div > footer,
            body > main > footer {
              display: block !important;
            }
          ` : ''}

          /* Ensure parent container chain of the target isolated elements is visible */
          div:has([data-global-component="${isolateName}"]),
          main:has([data-global-component="${isolateName}"]),
          #__next:has([data-global-component="${isolateName}"]),
          div:has(header),
          main:has(header),
          #__next:has(header),
          div:has(footer),
          main:has(footer),
          #__next:has(footer) {
            display: block !important;
          }
        `}} />
      )}
      {children}
    </GlobalBackendContext.Provider>
  );
}

export function useGlobalBackend() {
  return useContext(GlobalBackendContext);
}

/**
 * GlobalComponent — wrapper component that fetches dynamic backend data and injects it into the component's props.
 */
export function GlobalComponent({
  componentId,
  component: Component,
  fallbackProps = {},
  routePath
}: {
  componentId: string;
  component: React.ComponentType<any>;
  fallbackProps?: any;
  routePath?: string;
}) {
  const client = useGlobalBackend();
  const { data } = useComponentData(client, componentId, fallbackProps, routePath);

  return (
    <div data-global-component={componentId} style={{ display: 'contents' }}>
      <Component {...(data || fallbackProps)} componentId={componentId} />
    </div>
  );
}

/**
 * withGlobalComponent — high-order component to make any component automatically fetch backend data if componentId is supplied.
 */
export function withGlobalComponent<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  return function WrappedComponent(props: P & { componentId?: string; routePath?: string }) {
    const client = useGlobalBackend();
    const { componentId, routePath, ...rest } = props;

    // If no componentId is supplied, render as is
    if (!componentId) {
      return <Component {...props} />;
    }

    const { data } = useComponentData(client, componentName, rest, routePath);

    return (
      <div data-global-component={componentName} style={{ display: 'contents' }}>
        <Component {...(data || rest) as P} />
      </div>
    );
  };
}


export function SchemaScript({ schema }: { schema: any }) {
  if (!schema) return null;
  const schemaObj = typeof schema === 'string' ? JSON.parse(schema) : schema;
  if (Array.isArray(schemaObj) && schemaObj.length === 0) return null;
  if (!Array.isArray(schemaObj) && Object.keys(schemaObj).length === 0) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaObj) }}
    />
  );
}

export function DynamicRenderer({
  sections,
  components = {}
}: {
  sections?: PageSection[];
  components?: Record<string, React.ComponentType<any>>;
}) {
  if (!sections || !Array.isArray(sections)) {
    return null;
  }

  return (
    <div className="gb-sections-container">
      {sections.map((section, idx) => {
        if (section.isDeleted || section.isVisible === false) {
          return null;
        }

        const Component = components[section.type];

        let parsedContent: any = {};
        try {
          parsedContent = typeof section.content === 'string' ? JSON.parse(section.content) : section.content || {};
        } catch (e) {
          parsedContent = section.content || {};
        }

        const parsedSettings: any = {};
        try {
          const s = typeof section.settings === 'string' ? JSON.parse(section.settings) : section.settings || {};
          Object.assign(parsedSettings, s);
        } catch (e) {
          Object.assign(parsedSettings, section.settings || {});
        }

        if (section.type === 'spacer') {
          const height = parsedContent.height || 50;
          return (
            <div key={section.id || idx} style={{ height: `${height}px` }} />
          );
        }

        if (section.type === 'divider') {
          const thickness = parsedContent.thickness || 1;
          const style = parsedContent.style || 'solid';
          const color = parsedContent.color || '#e2e8f0';
          const width = parsedContent.width || '100%';
          return (
            <div key={section.id || idx} style={{ padding: '20px 0', display: 'flex', justifyContent: 'center', width: '100%' }}>
              <hr style={{
                border: 'none',
                borderTop: `${thickness}px ${style} ${color}`,
                width,
                margin: 0
              }} />
            </div>
          );
        }

        const wrapperStyle: React.CSSProperties = {
          backgroundColor: parsedSettings.backgroundColor || undefined,
          paddingTop: parsedSettings.paddingTop != null ? `${parsedSettings.paddingTop}px` : undefined,
          paddingBottom: parsedSettings.paddingBottom != null ? `${parsedSettings.paddingBottom}px` : undefined,
          marginTop: parsedSettings.marginTop != null ? `${parsedSettings.marginTop}px` : undefined,
          marginBottom: parsedSettings.marginBottom != null ? `${parsedSettings.marginBottom}px` : undefined,
          borderColor: parsedSettings.borderWidth ? parsedSettings.borderColor || '#e2e8f0' : undefined,
          borderStyle: parsedSettings.borderWidth ? 'solid' : undefined,
          borderWidth: parsedSettings.borderWidth != null ? `${parsedSettings.borderWidth}px` : undefined,
          borderRadius: parsedSettings.borderRadius != null ? `${parsedSettings.borderRadius}px` : undefined,
        };

        if (Component) {
          return (
            <div key={section.id || idx} style={wrapperStyle}>
              <Component
                content={parsedContent}
                settings={parsedSettings}
                title={section.title}
                id={section.id}
              />
            </div>
          );
        }

        // Generic fallback section
        return (
          <div key={section.id || idx} style={wrapperStyle}>
            <section
              data-gb-section={section.type}
              style={{
                padding: parsedSettings.padding || '4rem 2rem',
                background: parsedSettings.background || 'transparent',
                color: parsedSettings.textColor || 'inherit',
              }}
            >
              <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {section.title && <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>{section.title}</h2>}
                {(parsedContent as any).subtitle && <p style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>{(parsedContent as any).subtitle}</p>}
                {(parsedContent as any).text && <p style={{ fontSize: '1rem', lineHeight: '1.6' }}>{(parsedContent as any).text}</p>}
              </div>
            </section>
          </div>
        );
      })}
    </div>
  );
}

export function AnalyticsScripts({ settings }: { settings: Settings }) {
  if (!settings || !settings.analytics) return null;
  const { googleAnalytics, tagManager, clarity, metaPixel, linkedinTag } = settings.analytics;

  return (
    <>
      {/* Google Analytics */}
      {googleAnalytics && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalytics}`}
            strategy="afterInteractive"
          />
          <Script id="ga-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${googleAnalytics}');
            `}
          </Script>
        </>
      )}

      {/* Google Tag Manager */}
      {tagManager && (
        <Script id="gtm-init" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${tagManager}');
          `}
        </Script>
      )}

      {/* Microsoft Clarity */}
      {clarity && (
        <Script id="clarity-init" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window,document,"clarity","script","${clarity}");
          `}
        </Script>
      )}

      {/* Meta Pixel */}
      {metaPixel && (
        <Script id="meta-pixel-init" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${metaPixel}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}

      {/* LinkedIn Insight Tag */}
      {linkedinTag && (
        <>
          <Script id="linkedin-partner-id" strategy="afterInteractive">
            {`
              window._linkedin_partner_id = "${linkedinTag}";
              window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
              window._linkedin_data_partner_ids.push(window._linkedin_partner_id);
            `}
          </Script>
          <Script id="linkedin-init" strategy="afterInteractive">
            {`
              (function(l) {
              if (!l){window.lintrk = function(a,b){window.lintrk.q.push([a,b])};
              window.lintrk.q=[]}
              var s = document.getElementsByTagName("script")[0];
              var b = document.createElement("script");
              b.type = "text/javascript";b.async = true;
              b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
              s.parentNode.insertBefore(b, s);})(window.lintrk);
            `}
          </Script>
        </>
      )}
    </>
  );
}

/**
 * GlobalForm — Renders a frontend lead generation form.
 * Submits data directly to the backend database securely.
 */
export function GlobalForm({
  client,
  formType = 'contact',
  title,
  description,
  fields,
  submitText = 'Submit Now',
  onSuccess,
  onError,
  className = '',
  style = {}
}: {
  client: any;
  formType?: string;
  title?: string;
  description?: string;
  fields?: Array<{
    name: string;
    label: string;
    type: 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'checkbox';
    required?: boolean;
    placeholder?: string;
    options?: string[];
  }>;
  submitText?: string;
  onSuccess?: (result: any) => void;
  onError?: (err: any) => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  const { submit, loading, success, error } = useSubmitForm(client);
  const [formData, setFormData] = useState<Record<string, any>>({});

  const defaultFields = [
    { name: 'name', label: 'Full Name', type: 'text' as const, required: true, placeholder: 'Jane Doe' },
    { name: 'email', label: 'Email Address', type: 'email' as const, required: true, placeholder: 'jane@example.com' },
    { name: 'phone', label: 'Phone Number', type: 'tel' as const, required: false, placeholder: '+1 (555) 000-0000' },
    { name: 'message', label: 'Message', type: 'textarea' as const, required: false, placeholder: 'How can we help you?' }
  ];

  const activeFields = fields || defaultFields;

  const handleChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    for (const f of activeFields) {
      if (f.required && !formData[f.name]) {
        alert(`${f.label} is required.`);
        return;
      }
    }

    try {
      const { name, email, phone, message, ...rest } = formData;
      const result = await submit({
        formType,
        name,
        email,
        phone,
        message,
        data: Object.keys(rest).length > 0 ? JSON.stringify(rest) : undefined
      });
      if (onSuccess) onSuccess(result);
      setFormData({});
    } catch (err: any) {
      if (onError) onError(err);
    }
  };

  return (
    <div
      className={`gb-form-container ${className}`}
      style={{
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(226, 232, 240, 0.8)',
        borderRadius: '16px',
        padding: '2rem',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
        width: '100%',
        maxWidth: '500px',
        margin: '0 auto',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        boxSizing: 'border-box',
        ...style
      }}
    >
      {title && <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0.5rem 0' }}>{title}</h3>}
      {description && <p style={{ fontSize: '0.95rem', color: '#64748b', margin: '0 0 1.5rem 0', lineHeight: 1.5 }}>{description}</p>}

      {success && (
        <div style={{
          background: '#ecfdf5',
          border: '1px solid #10b981',
          borderRadius: '8px',
          color: '#065f46',
          padding: '1rem',
          marginBottom: '1.5rem',
          fontSize: '0.9rem',
          fontWeight: 500,
          display: 'flex',
          alignItems: 'center'
        }}>
          ✓ Form submitted successfully! Thank you.
        </div>
      )}

      {error && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #ef4444',
          borderRadius: '8px',
          color: '#991b1b',
          padding: '1rem',
          marginBottom: '1.5rem',
          fontSize: '0.9rem',
          fontWeight: 500
        }}>
          ✗ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {activeFields.map(field => {
          const id = `gb-field-${field.name}`;
          return (
            <div key={field.name} style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              <label htmlFor={id} style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>
                {field.label} {field.required && <span style={{ color: '#ef4444' }}>*</span>}
              </label>

              {field.type === 'textarea' ? (
                <textarea
                  id={id}
                  required={field.required}
                  placeholder={field.placeholder}
                  value={formData[field.name] || ''}
                  onChange={e => handleChange(field.name, e.target.value)}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.95rem',
                    color: '#1e293b',
                    outline: 'none',
                    minHeight: '100px',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                />
              ) : field.type === 'select' ? (
                <select
                  id={id}
                  required={field.required}
                  value={formData[field.name] || ''}
                  onChange={e => handleChange(field.name, e.target.value)}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.95rem',
                    color: '#1e293b',
                    outline: 'none',
                    backgroundColor: '#ffffff'
                  }}
                >
                  <option value="">Select option...</option>
                  {(field.options || []).map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : field.type === 'checkbox' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id={id}
                    required={field.required}
                    checked={!!formData[field.name]}
                    onChange={e => handleChange(field.name, e.target.checked)}
                    style={{
                      width: '18px',
                      height: '18px',
                      accentColor: '#4f46e5'
                    }}
                  />
                  <label htmlFor={id} style={{ fontSize: '0.9rem', color: '#475569', userSelect: 'none' }}>
                    {field.placeholder || 'I agree'}
                  </label>
                </div>
              ) : (
                <input
                  type={field.type}
                  id={id}
                  required={field.required}
                  placeholder={field.placeholder}
                  value={formData[field.name] || ''}
                  onChange={e => handleChange(field.name, e.target.value)}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.95rem',
                    color: '#1e293b',
                    outline: 'none'
                  }}
                />
              )}
            </div>
          );
        })}

        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: '0.5rem',
            padding: '0.875rem',
            borderRadius: '8px',
            border: 'none',
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            color: '#ffffff',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2), 0 2px 4px -1px rgba(79, 70, 229, 0.1)',
            transition: 'all 0.15s ease'
          }}
        >
          {loading ? 'Submitting...' : submitText}
        </button>
      </form>
    </div>
  );
}

/**
 * CTASection — Fetches active CTA campaigns from the backend
 * and displays them inline, as banners, or floating cards.
 */
export function CTASection({
  client,
  type,
  placement = 'global',
  className = '',
  style = {},
  renderCta
}: {
  client: any;
  type?: 'button' | 'floating' | 'banner';
  placement?: string;
  className?: string;
  style?: React.CSSProperties;
  renderCta?: (cta: any) => React.ReactNode;
}) {
  const { ctas, loading, error } = useCTAs(client, type ? { type } : undefined);
  const [dismissed, setDismissed] = useState<Record<string, boolean>>({});

  if (loading || error || !ctas || ctas.length === 0) return null;

  const activeCtas = ctas.filter(cta => {
    const matchesPlacement = !placement || cta.placement === 'global' || cta.placement === placement;
    const matchesType = !type || cta.type === type;
    return matchesPlacement && matchesType && !dismissed[cta.id];
  });

  if (activeCtas.length === 0) return null;

  return (
    <div className={`gb-ctas-wrapper ${className}`} style={{ ...style }}>
      {activeCtas.map(cta => {
        if (renderCta) {
          return <React.Fragment key={cta.id}>{renderCta(cta)}</React.Fragment>;
        }

        const bg = cta.bgColor || 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)';
        const textColor = cta.textColor || '#ffffff';

        if (cta.type === 'banner') {
          return (
            <div
              key={cta.id}
              style={{
                background: bg,
                color: textColor,
                padding: '2.5rem 2rem',
                borderRadius: '12px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1.5rem',
                margin: '1.5rem 0',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}
            >
              <div style={{ flex: '1 1 300px' }}>
                <h4 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>{cta.title}</h4>
              </div>
              <div>
                <a
                  href={cta.link || '#'}
                  style={{
                    display: 'inline-block',
                    backgroundColor: '#ffffff',
                    color: '#4f46e5',
                    padding: '0.875rem 1.75rem',
                    borderRadius: '8px',
                    fontWeight: 700,
                    textDecoration: 'none',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                  }}
                >
                  {cta.buttonText}
                </a>
              </div>
            </div>
          );
        }

        if (cta.type === 'floating') {
          return (
            <div
              key={cta.id}
              style={{
                position: 'fixed',
                bottom: '24px',
                right: '24px',
                width: '320px',
                background: bg.startsWith('#') ? bg : '#ffffff',
                backgroundImage: bg.startsWith('linear-gradient') ? bg : 'none',
                color: textColor,
                padding: '1.5rem',
                borderRadius: '16px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
                zIndex: 9999,
                fontFamily: 'system-ui, -apple-system, sans-serif',
                border: '1px solid rgba(255,255,255,0.2)'
              }}
            >
              <button
                onClick={() => setDismissed(prev => ({ ...prev, [cta.id]: true }))}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'transparent',
                  border: 'none',
                  color: textColor,
                  opacity: 0.7,
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              >
                ✕
              </button>
              <h4 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 1rem 0', paddingRight: '20px', lineHeight: 1.4 }}>{cta.title}</h4>
              <a
                href={cta.link || '#'}
                style={{
                  display: 'block',
                  textAlign: 'center',
                  backgroundColor: bg.startsWith('#') ? '#4f46e5' : '#ffffff',
                  color: bg.startsWith('#') ? '#ffffff' : '#4f46e5',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  fontWeight: 700,
                  textDecoration: 'none'
                }}
              >
                {cta.buttonText}
              </a>
            </div>
          );
        }

        return (
          <a
            key={cta.id}
            href={cta.link || '#'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: bg,
              color: textColor,
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              fontWeight: 600,
              textDecoration: 'none',
              boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2)',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}
          >
            {cta.title && <span style={{ marginRight: '0.5rem' }}>{cta.title}</span>}
            {cta.buttonText}
          </a>
        );
      })}
    </div>
  );
}

