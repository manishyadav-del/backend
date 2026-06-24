import React, { createContext, useContext, useState, useEffect } from 'react';
import Script from 'next/script';
import { Settings, PageSection } from './types.js';
import { useComponentData } from './hooks.js';

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

        let parsedContent = {};
        try {
          parsedContent = typeof section.content === 'string' ? JSON.parse(section.content) : section.content || {};
        } catch (e) {
          parsedContent = section.content || {};
        }

        let parsedSettings = {};
        try {
          parsedSettings = typeof section.settings === 'string' ? JSON.parse(section.settings) : section.settings || {};
        } catch (e) {
          parsedSettings = section.settings || {};
        }

        if (Component) {
          return (
            <Component
              key={section.id || idx}
              content={parsedContent}
              settings={parsedSettings}
              title={section.title}
              id={section.id}
            />
          );
        }

        // Generic fallback section
        return (
          <section
            key={section.id || idx}
            data-gb-section={section.type}
            style={{
              padding: (parsedSettings as any).padding || '4rem 2rem',
              background: (parsedSettings as any).background || 'transparent',
              color: (parsedSettings as any).textColor || 'inherit',
            }}
          >
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              {section.title && <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>{section.title}</h2>}
              {(parsedContent as any).subtitle && <p style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>{(parsedContent as any).subtitle}</p>}
              {(parsedContent as any).text && <p style={{ fontSize: '1rem', lineHeight: '1.6' }}>{(parsedContent as any).text}</p>}
            </div>
          </section>
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
