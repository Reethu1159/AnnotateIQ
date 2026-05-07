import { useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ClipboardList, Search, Users } from 'lucide-react';
import api from '../../api/axios';
import { AuthContext } from '../../context/auth-context';
import Avatar from '../../components/Avatar';
import Badge from '../../components/Badge';
import Skeleton from '../../components/Skeleton';

const getProgress = (tasks = []) => {
  if (tasks.length === 0) return 0;
  const done = tasks.filter((task) => ['APPROVED', 'DONE'].includes(task.status)).length;
  return Math.round((done / tasks.length) * 100);
};

const MemberProjects = () => {
  const [projects, setProjects] = useState([]);
  const [tasksByProject, setTasksByProject] = useState({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const { data: projectData } = await api.get('/projects');
        const taskResponses = await Promise.all(projectData.map((project) => api.get(`/projects/${project.id}/tasks`).catch(() => ({ data: [] }))));
        const taskMap = projectData.reduce((map, project, index) => {
          map[project.id] = taskResponses[index].data;
          return map;
        }, {});

        if (active) {
          setProjects(projectData);
          setTasksByProject(taskMap);
        }
      } catch {
        if (active) {
          setProjects([]);
          setTasksByProject({});
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  const filteredProjects = useMemo(() => projects.filter((project) => (
    project.name.toLowerCase().includes(search.toLowerCase())
  )), [projects, search]);

  return (
    <main className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Member</p>
          <h1>My Projects</h1>
        </div>
      </header>

      <section className="toolbar single">
        <label className="search-field">
          <Search size={18} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search projects" />
        </label>
      </section>

      {loading ? (
        <Skeleton rows={4} />
      ) : (
        <section className="project-grid">
          {filteredProjects.map((project) => {
            const tasks = tasksByProject[project.id] || [];
            const membership = project.members?.find((member) => member.user?.id === user?.id);
            const personalProgress = getProgress(tasks);
            const overallProgress = project._count?.tasks ? personalProgress : getProgress(project.tasks || tasks);

            return (
              <article key={project.id} className="member-project-card">
                <div className="project-card-top">
                  <Badge value={project.domain || 'General'} tone="domain" />
                  <Badge value={membership?.role || 'MEMBER'} tone="role" />
                </div>
                <h3>{project.name}</h3>
                <p>{project.description || 'No description added yet.'}</p>
                <div className="project-meta">
                  <span><Calendar size={15} /> {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'No deadline'}</span>
                  <span><Users size={15} /> {project.members?.length || 0}</span>
                  <span><ClipboardList size={15} /> {tasks.length}</span>
                </div>
                <div className="progress-block">
                  <div className="progress-label"><span>My Progress</span><strong>{personalProgress}%</strong></div>
                  <div className="progress-track"><span style={{ width: `${personalProgress}%` }} /></div>
                </div>
                <div className="progress-block">
                  <div className="progress-label"><span>Overall Progress</span><strong>{overallProgress}%</strong></div>
                  <div className="progress-track"><span style={{ width: `${overallProgress}%` }} /></div>
                </div>
                <div className="project-card-footer">
                  <div className="avatar-stack">
                    {(project.members || []).slice(0, 4).map((member) => (
                      <Avatar key={member.id} name={member.user?.name} color={member.user?.avatarColor} size="sm" />
                    ))}
                  </div>
                  <Link to={`/member/tasks?project=${project.id}`} className="btn btn-secondary btn-compact">View My Tasks</Link>
                </div>
              </article>
            );
          })}
          {filteredProjects.length === 0 && <div className="empty-state">No projects assigned yet.</div>}
        </section>
      )}
    </main>
  );
};

export default MemberProjects;
