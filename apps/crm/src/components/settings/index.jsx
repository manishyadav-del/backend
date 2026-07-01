'use client';

import { useState } from 'react';
import { Card, Button, Input } from '@/components/ui/index.jsx';

export function HeaderBuilder({ initialConfig, onSave }) {
  const [config, setConfig] = useState(initialConfig || {});

  return (
    <Card>
      <h3>Header Configuration</h3>
      <Input label="Logo URL" value={config.logo || ''} onChange={(e) => setConfig({...config, logo: e.target.value})} />
      {/* Nav links builder logic */}
      <Button onClick={() => onSave(config)}>Save Header</Button>
    </Card>
  );
}

export function FooterBuilder({ initialConfig, onSave }) {
  const [config, setConfig] = useState(initialConfig || {});

  return (
    <Card>
      <h3>Footer Configuration</h3>
      <Input label="Copyright Text" value={config.copyright || ''} onChange={(e) => setConfig({...config, copyright: e.target.value})} />
      {/* Footer columns logic */}
      <Button onClick={() => onSave(config)}>Save Footer</Button>
    </Card>
  );
}

export function AnalyticsConfig({ initialConfig, onSave }) {
  const [config, setConfig] = useState(initialConfig || {});

  return (
    <Card>
      <h3>Analytics & Custom Scripts</h3>
      <Input label="Google Analytics ID" value={config.gaTrackingId || ''} onChange={(e) => setConfig({...config, gaTrackingId: e.target.value})} />
      <Input label="Clarity Tracking ID" value={config.clarityTrackingId || ''} onChange={(e) => setConfig({...config, clarityTrackingId: e.target.value})} />
      <div className="form-group">
        <label>Custom Head Scripts</label>
        <textarea rows="4" value={config.customHeadScripts || ''} onChange={(e) => setConfig({...config, customHeadScripts: e.target.value})} />
      </div>
      <Button onClick={() => onSave(config)}>Save Analytics</Button>
    </Card>
  );
}
