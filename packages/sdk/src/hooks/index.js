import { useState, useEffect } from 'react';
import { GlobalBackendClient } from '../client.js';

export function usePageContent(client, slug) {
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!client || !slug) return;

    client.getPage(slug)
      .then(data => {
        setPage(data.page);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [client, slug]);

  return { page, loading, error };
}

export function useGlobalSettings(client) {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!client) return;

    client.getGlobalSettings()
      .then(data => {
        setSettings(data.settings);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [client]);

  return { settings, loading, error };
}
