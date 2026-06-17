'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function SitemapPreviewPage({ params }) {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const { projectId } = params;

  // We reuse the standard pages list but filter for published
  useEffect(() => {
    fetch(`/api/pages?projectId=${projectId}`)
      .then(res => res.json())
      .then(data => {
        if (data.pages) {
          setPages(data.pages.filter(p => p.status === 'PUBLISHED'));
        }
        setLoading(false);
      });
  }, [projectId]);

  if (loading) return <div>Loading sitemap...</div>;

  return (
    <div className="sitemap-preview">
      <div className="breadcrumbs">
        <Link href={`/projects/${projectId}`}>&larr; Back to Project</Link>
      </div>
      
      <h1>Sitemap Preview</h1>
      <p>This is a preview of the URLs that will be included in the dynamic XML sitemap served to search engines.</p>
      
      <div className="card code-font bg-dark">
        <pre>
{`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(p => `  <url>
    <loc>https://example.com${p.slug}</loc>
    <lastmod>${new Date(p.updatedAt).toISOString()}</lastmod>
  </url>`).join('\n')}
</urlset>`}
        </pre>
      </div>
    </div>
  );
}
