'use client';

import Link from 'next/link';

export default function ProjectCard({ project }) {
  if (!project) return null;

  return (
    <Link
      href={`/projects/${project.id}`}
      className="project-card"
    >
      <div className="card-header">
        <h2>{project.name}</h2>
      </div>

      <div className="card-body">
        <p>
          <strong>Slug:</strong> {project.slug}
        </p>

        <p>
          <strong>Domain:</strong>{' '}
          {project.domain || 'Not Connected'}
        </p>

        <p>
          <strong>Pages:</strong>{' '}
          {project._count?.pages || 0}
        </p>

        <p>
          <strong>API Key:</strong>{' '}
          {project.apiKey
            ? `${project.apiKey.substring(0, 12)}...`
            : 'Not Generated'}
        </p>
      </div>

      <div className="card-footer">
        Open Project →
      </div>
    </Link>
  );
}