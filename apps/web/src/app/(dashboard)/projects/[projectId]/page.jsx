'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ProjectOverviewPage({ params }) {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const { projectId } = params;

  useEffect(() => {
    fetch(`/api/projects/${projectId}`)
      .then(res => res.json())
      .then(data => {
        if (data.project) setProject(data.project);
        setLoading(false);
      });
  }, [projectId]);

  if (loading) return <div>Loading project...</div>;
  if (!project) return <div>Project not found</div>;

  return (
    <div className="project-overview">
      <h1>{project.name}</h1>
      
      <div className="api-key-section card">
        <h3>API Key</h3>
        <code className="api-key-display">{project.apiKey}</code>
        <p className="help-text">Use this key in your Next.js frontend SDK to connect to this project.</p>
      </div>

      <div className="modules-grid">
        <Link href={`/projects/${project.id}/pages`} className="module-card">
          <h3>Pages & Content</h3>
          <p>Manage {project._count.pages} synced pages, edit content blocks, and SEO.</p>
        </Link>
        
        <Link href={`/projects/${project.id}/global-settings`} className="module-card">
          <h3>Global Settings</h3>
          <p>Configure Header, Footer, and Analytics scripts.</p>
        </Link>
        
        <Link href={`/projects/${project.id}/sitemap`} className="module-card">
          <h3>Sitemap</h3>
          <p>View the dynamic XML sitemap generated for this project.</p>
        </Link>
      </div>
    </div>
  );
}
