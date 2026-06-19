import { useState, useEffect } from 'react';
import { GlobalBackendClient } from './client.js';
import { Page, Settings } from './types.js';

export function usePageContent(client: GlobalBackendClient, slug: string) {
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!client || !slug) return;
    setLoading(true);
    client.getPage(slug)
      .then(data => {
        setPage(data);
        setError(null);
      })
      .catch(err => {
        setError(err.message || 'Failed to fetch page content');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [client, slug]);

  return { page, loading, error };
}

export function useGlobalSettings(client: GlobalBackendClient) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!client) return;
    setLoading(true);
    client.getSettings()
      .then(data => {
        setSettings(data);
        setError(null);
      })
      .catch(err => {
        setError(err.message || 'Failed to fetch global settings');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [client]);

  return { settings, loading, error };
}
