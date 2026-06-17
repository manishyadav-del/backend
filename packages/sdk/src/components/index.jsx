import React from 'react';

export function DynamicRenderer({ blocks }) {
  if (!blocks || !Array.isArray(blocks)) {
    return null;
  }

  return (
    <div className="global-backend-content">
      {blocks.map((block, index) => {
        // Here we would map block types to actual React components
        // e.g. if block.type === 'hero' return <Hero {...block.props} />
        return (
          <div key={index} data-block-type={block.type}>
            {/* Placeholder for dynamic block */}
            <p>Block type: {block.type}</p>
          </div>
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

export function GlobalBackendProvider({ children, config }) {
  // Provider could setup React Context for global settings in the SDK
  return (
    <div className="global-backend-provider">
      {children}
    </div>
  );
}
