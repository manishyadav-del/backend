'use client';

import React, { useEffect, useRef } from 'react';

export default function BlockEditor({ value, onChange }) {
  const editorRef = useRef(null);
  const editorInstance = useRef(null);

  useEffect(() => {
    let isDestroyed = false;

    async function initEditor() {
      try {
        const EditorJS = (await import('@editorjs/editorjs')).default;
        const Header = (await import('@editorjs/header')).default;
        const List = (await import('@editorjs/list')).default;
        const Quote = (await import('@editorjs/quote')).default;

        if (isDestroyed) return;

        let blocks = [];
        if (value && Array.isArray(value)) {
          blocks = value;
        } else if (typeof value === 'string') {
          if (value.startsWith('[')) {
            try {
              blocks = JSON.parse(value);
            } catch (e) {
              blocks = [];
            }
          }
        }

        const editor = new EditorJS({
          holder: editorRef.current,
          tools: {
            header: {
              class: Header,
              inlineToolbar: ['link'],
              config: {
                placeholder: 'Enter a heading',
                levels: [2, 3, 4],
                defaultLevel: 2
              }
            },
            list: {
              class: List,
              inlineToolbar: true,
              config: {
                defaultStyle: 'unordered'
              }
            },
            quote: {
              class: Quote,
              inlineToolbar: true,
              config: {
                quotePlaceholder: 'Enter a quote',
                captionPlaceholder: 'Author'
              }
            }
          },
          data: { blocks },
          placeholder: 'Click here or press Enter to write block content...',
          onChange: async () => {
            const savedData = await editor.save();
            if (onChange && savedData.blocks) {
              onChange(savedData.blocks);
            }
          }
        });

        editorInstance.current = editor;
      } catch (err) {
        console.error('Failed to initialize EditorJS:', err);
      }
    }

    initEditor();

    return () => {
      isDestroyed = true;
      if (editorInstance.current && typeof editorInstance.current.destroy === 'function') {
        try {
          editorInstance.current.destroy();
        } catch (e) {
          // already destroyed or not initialized yet
        }
        editorInstance.current = null;
      }
    };
  }, []);

  return (
    <div style={{
      background: '#0f172a',
      border: '1px solid #334155',
      borderRadius: '8px',
      padding: '24px',
      color: '#e2e8f0',
      minHeight: '400px'
    }}>
      <style>{`
        .codex-editor__redactor {
          padding-bottom: 80px !important;
        }
        .ce-paragraph, .ce-header, .cdx-list__item, .cdx-quote__text {
          outline: none;
        }
        .ce-toolbar__actions {
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 4px;
        }
        .ce-toolbox {
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 6px;
          color: white;
        }
        .ce-popover {
          background: #1e293b !important;
          border: 1px solid #334155 !important;
        }
        .ce-popover-item {
          color: #cbd5e1 !important;
        }
        .ce-popover-item:hover {
          background: #334155 !important;
        }
        .ce-inline-toolbar {
          background: #1e293b !important;
          border: 1px solid #334155 !important;
        }
        .ce-inline-tool {
          color: #cbd5e1 !important;
        }
        .ce-inline-tool:hover {
          background: #334155 !important;
        }
      `}</style>
      <div ref={editorRef} />
    </div>
  );
}
