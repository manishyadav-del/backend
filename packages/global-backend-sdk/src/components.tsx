import React, { createContext, useContext } from 'react';
import Script from 'next/script';
import { Settings, PageSection } from './types.js';

const GlobalBackendContext = createContext<any>(null);

export function GlobalBackendProvider({ children, client }: { children: React.ReactNode; client: any }) {
  return (
    <GlobalBackendContext.Provider value={client}>
      {children}
    </GlobalBackendContext.Provider>
  );
}

export function useGlobalBackend() {
  return useContext(GlobalBackendContext);
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
