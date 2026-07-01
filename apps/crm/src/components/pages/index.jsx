'use client';

import { useState } from 'react';
import { Card, Button, Input } from '@/components/ui/index.jsx';

export function ContentBlockEditor({ blocks, onChange }) {
  return (
    <Card>
      <h3>Content Blocks</h3>
      <p>Manage blocks for this page.</p>
      {/* Block editing logic will go here */}
      <Button>Add Block</Button>
    </Card>
  );
}

export function SeoForm({ initialData, onSave }) {
  const [data, setData] = useState(initialData || {});

  return (
    <Card>
      <h3>SEO Metadata</h3>
      <Input label="Meta Title" value={data.metaTitle || ''} onChange={(e) => setData({...data, metaTitle: e.target.value})} />
      <div className="form-group">
        <label>Meta Description</label>
        <textarea value={data.metaDesc || ''} onChange={(e) => setData({...data, metaDesc: e.target.value})} />
      </div>
      <Button onClick={() => onSave(data)}>Save SEO</Button>
    </Card>
  );
}

export function SchemaEditor({ initialSchema, onSave }) {
  const [schemaStr, setSchemaStr] = useState(JSON.stringify(initialSchema || {}, null, 2));

  return (
    <Card>
      <h3>JSON-LD Schema</h3>
      <div className="form-group">
        <textarea 
          rows="10" 
          className="code-font" 
          value={schemaStr} 
          onChange={(e) => setSchemaStr(e.target.value)} 
        />
      </div>
      <Button onClick={() => {
        try {
          const parsed = JSON.parse(schemaStr);
          onSave(parsed);
        } catch {
          alert('Invalid JSON');
        }
      }}>Save Schema</Button>
    </Card>
  );
}
