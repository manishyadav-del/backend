import React, { createContext, useContext } from 'react';

const GlobalBackendContext = createContext(null);

export function DynamicRenderer({ sections, components = {} }) {
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
              padding: parsedSettings.padding || '4rem 2rem',
              background: parsedSettings.background || 'transparent',
              color: parsedSettings.textColor || 'inherit',
            }}
          >
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              {section.title && <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>{section.title}</h2>}
              {parsedContent.subtitle && <p style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>{parsedContent.subtitle}</p>}
              {parsedContent.text && <p style={{ fontSize: '1rem', lineHeight: '1.6' }}>{parsedContent.text}</p>}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export function SchemaScript({ schema }) {
  if (!schema || Object.keys(schema).length === 0) {
    return null;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function GlobalBackendProvider({ children, client }) {
  return (
    <GlobalBackendContext.Provider value={client}>
      {children}
    </GlobalBackendContext.Provider>
  );
}

export function useGlobalBackend() {
  const context = useContext(GlobalBackendContext);
  return context;
}
