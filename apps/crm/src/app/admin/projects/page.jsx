'use client';

import { useState, useEffect } from 'react';
import { Modal, Input } from '@/components/ui/index.jsx';
import ProjectCard from '@/components/projects/ProjectCard.jsx';

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    slug: '',
    domain: '',
  });

  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();

      if (data.projects) {
        setProjects(data.projects);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();

    setCreating(true);
    setError('');

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProject),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create project');
        return;
      }

      setNewProject({
        name: '',
        slug: '',
        domain: '',
      });

      setIsModalOpen(false);
      fetchProjects();
    } catch (error) {
      console.error(error);
      setError('Something went wrong');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <div>Loading projects...</div>;
  }

  return (
    <div className="projects-container">
      <div className="header-actions">
        <h1>Projects</h1>

        <button
          className="btn-primary"
          onClick={() => setIsModalOpen(true)}
        >
          New Project
        </button>
      </div>

      <div className="projects-grid">
        {projects.length > 0 ? (
          projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
            />
          ))
        ) : (
          <div className="empty-state">
            No projects found. Create one to get started.
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Project"
      >
        <form onSubmit={handleCreateProject}>
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <Input
            label="Project Name"
            required
            value={newProject.name}
            onChange={(e) =>
              setNewProject({
                ...newProject,
                name: e.target.value,
              })
            }
          />

          <Input
            label="Unique Slug"
            required
            value={newProject.slug}
            onChange={(e) =>
              setNewProject({
                ...newProject,
                slug: e.target.value,
              })
            }
          />

          <Input
            label="Domain (Optional)"
            value={newProject.domain}
            onChange={(e) =>
              setNewProject({
                ...newProject,
                domain: e.target.value,
              })
            }
          />

          <button
            type="submit"
            className="btn-primary"
            disabled={creating}
            style={{ marginTop: '1rem' }}
          >
            {creating ? 'Creating...' : 'Create Project'}
          </button>
        </form>
      </Modal>
    </div>
  );
}