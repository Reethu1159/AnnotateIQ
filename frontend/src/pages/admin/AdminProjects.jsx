import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Avatar from '../../components/Avatar';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import ProjectCard from '../../components/ProjectCard';
import Skeleton from '../../components/Skeleton';

const emptyProject = {
  name: '',
  description: '',
  domain: 'General',
  deadline: '',
  taskQuota: 12,
};

const AdminProjects = () => {
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState('');
  const [domain, setDomain] = useState('All');
  const [status, setStatus] = useState('Active');
  const [selectedProject, setSelectedProject] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState(emptyProject);
  const [loading, setLoading] = useState(true);

  const loadProjects = async () => {
    try {
      const { data } = await api.get('/projects');
      setProjects(data);
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    api.get('/projects')
      .then(({ data }) => {
        if (active) setProjects(data);
      })
      .catch(() => {
        if (active) setProjects([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredProjects = useMemo(() => projects.filter((project) => {
    const matchesSearch = project.name.toLowerCase().includes(search.toLowerCase());
    const matchesDomain = domain === 'All' || project.domain === domain;
    const matchesStatus = status === 'All' || (status === 'Archived' ? project.archived : !project.archived);
    return matchesSearch && matchesDomain && matchesStatus;
  }), [domain, projects, search, status]);

  const completedProjects = projects.filter((project) => project.archived);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await api.post('/projects', {
        ...formData,
        deadline: formData.deadline || null,
        taskQuota: Number(formData.taskQuota),
      });
      toast.success('Project created');
      setModalOpen(false);
      setFormData(emptyProject);
      loadProjects();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Project creation failed');
    }
  };

  return (
    <main className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Projects</h1>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setModalOpen(true)}>
          <Plus size={18} />
          New Project
        </button>
      </header>

      <section className="toolbar">
        <label className="search-field">
          <Search size={18} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search projects" />
        </label>
        <select value={domain} onChange={(event) => setDomain(event.target.value)} className="input-field">
          <option>All</option>
          <option>Medical</option>
          <option>Legal</option>
          <option>Finance</option>
          <option>Coding</option>
          <option>General</option>
        </select>
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="input-field">
          <option>All</option>
          <option>Active</option>
          <option>Archived</option>
        </select>
      </section>

      {loading ? <Skeleton rows={4} /> : <section className="project-grid">
        {filteredProjects.map((project) => (
          <ProjectCard key={project.id} project={project} onView={setSelectedProject} />
        ))}
        {filteredProjects.length === 0 && <div className="empty-state">No projects match the current filters.</div>}
      </section>}

      <details className="completed-section">
        <summary>Completed Projects ({completedProjects.length})</summary>
        <div className="completed-list">
          {completedProjects.map((project) => <span key={project.id}>{project.name}</span>)}
        </div>
      </details>

      <Modal title="Create Project" open={modalOpen} onClose={() => setModalOpen(false)}>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="input-group">
            <span className="input-label">Name</span>
            <input className="input-field" value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} required />
          </label>
          <label className="input-group">
            <span className="input-label">Domain</span>
            <select className="input-field" value={formData.domain} onChange={(event) => setFormData({ ...formData, domain: event.target.value })}>
              <option>Medical</option>
              <option>Legal</option>
              <option>Finance</option>
              <option>Coding</option>
              <option>General</option>
            </select>
          </label>
          <label className="input-group span-2">
            <span className="input-label">Description</span>
            <textarea className="input-field" rows="3" value={formData.description} onChange={(event) => setFormData({ ...formData, description: event.target.value })} />
          </label>
          <label className="input-group">
            <span className="input-label">Deadline</span>
            <input type="date" className="input-field" value={formData.deadline} onChange={(event) => setFormData({ ...formData, deadline: event.target.value })} />
          </label>
          <label className="input-group">
            <span className="input-label">Task Quota</span>
            <input type="number" min="1" className="input-field" value={formData.taskQuota} onChange={(event) => setFormData({ ...formData, taskQuota: event.target.value })} />
          </label>
          <div className="modal-actions span-2">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create</button>
          </div>
        </form>
      </Modal>

      <aside className={`drawer ${selectedProject ? 'open' : ''}`}>
        {selectedProject && (
          <>
            <button type="button" className="icon-button drawer-close" onClick={() => setSelectedProject(null)} aria-label="Close" title="Close">
              <X size={18} />
            </button>
            <Badge value={selectedProject.domain || 'General'} tone="domain" />
            <h2>{selectedProject.name}</h2>
            <p>{selectedProject.description || 'No description available.'}</p>
            <div className="drawer-section">
              <h3>Members</h3>
              {(selectedProject.members || []).map((member) => (
                <div key={member.id} className="member-row">
                  <Avatar name={member.user?.name} color={member.user?.avatarColor} />
                  <div>
                    <strong>{member.user?.name}</strong>
                    <span>{member.role}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="drawer-section">
              <h3>Tasks</h3>
              {(selectedProject.tasks || []).slice(0, 8).map((task) => (
                <div key={task.id} className="task-mini-row">
                  <span>{task.title}</span>
                  <Badge value={task.status} />
                </div>
              ))}
              {!selectedProject.tasks?.length && <p className="text-muted">Open project details after backend Phase 3 data is loaded to see tasks.</p>}
            </div>
          </>
        )}
      </aside>
    </main>
  );
};

export default AdminProjects;
