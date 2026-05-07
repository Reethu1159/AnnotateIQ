import { Calendar, Eye, Users } from 'lucide-react';
import Avatar from './Avatar';
import Badge from './Badge';

const calculateProgress = (project) => {
  const tasks = project.tasks || [];
  const total = project._count?.tasks ?? tasks.length ?? 0;
  const done = tasks.filter((task) => ['APPROVED', 'DONE'].includes(task.status)).length;
  return total > 0 ? Math.round((done / total) * 100) : 0;
};

const ProjectCard = ({ project, onView }) => {
  const progress = calculateProgress(project);
  const visibleMembers = (project.members || []).slice(0, 4);

  return (
    <article className="project-card">
      <div className="project-card-top">
        <Badge value={project.domain || 'General'} tone="domain" />
        <Badge value={project.archived ? 'Archived' : 'Active'} tone="project" />
      </div>
      <h3>{project.name}</h3>
      <p>{project.description || 'No description added yet.'}</p>

      <div className="progress-block">
        <div className="progress-label">
          <span>Progress</span>
          <strong>{progress}%</strong>
        </div>
        <div className="progress-track">
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="project-meta">
        <span><Calendar size={15} /> {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'No deadline'}</span>
        <span><Users size={15} /> {project.members?.length || 0} members</span>
      </div>

      <div className="project-card-footer">
        <div className="avatar-stack">
          {visibleMembers.map((member) => (
            <Avatar key={member.id} name={member.user?.name} color={member.user?.avatarColor} size="sm" />
          ))}
        </div>
        <button type="button" className="btn btn-secondary btn-compact" onClick={() => onView(project)}>
          <Eye size={16} />
          View Details
        </button>
      </div>
    </article>
  );
};

export default ProjectCard;
