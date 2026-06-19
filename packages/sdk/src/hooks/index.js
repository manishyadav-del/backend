import { useState, useEffect } from 'react';
import { useGlobalBackend } from '../components/index.jsx';

function getEffectiveClient(clientOverride, contextClient) {
  return clientOverride || contextClient;
}

export function usePageContent(slug, clientOverride = null) {
  const contextClient = useGlobalBackend();
  const client = getEffectiveClient(clientOverride, contextClient);

  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!client || !slug) return;
    setLoading(true);
    client.getPage(slug)
      .then(data => {
        setPage(data.page || data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [client, slug]);

  return { page, loading, error };
}

export function useGlobalSettings(clientOverride = null) {
  const contextClient = useGlobalBackend();
  const client = getEffectiveClient(clientOverride, contextClient);

  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!client) return;
    setLoading(true);
    client.getGlobalSettings()
      .then(data => {
        setSettings(data.settings || data.data || data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [client]);

  return { settings, loading, error };
}

export function useSitemap(clientOverride = null) {
  const contextClient = useGlobalBackend();
  const client = getEffectiveClient(clientOverride, contextClient);

  const [sitemap, setSitemap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!client) return;
    setLoading(true);
    client.getSitemap()
      .then(data => {
        setSitemap(data.sitemap || data.pages || data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [client]);

  return { sitemap, loading, error };
}
