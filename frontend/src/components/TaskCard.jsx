import { CalendarClock, CheckCircle, CirclePlay, HelpCircle, Send } from 'lucide-react';
import Badge from './Badge';

const actionByStatus = {
  TODO: { label: 'Accept Task', next: 'ACCEPTED', icon: CheckCircle },
  ACCEPTED: { label: 'Start Work', next: 'IN_PROGRESS', icon: CirclePlay },
  IN_PROGRESS: { label: 'Submit Work', next: 'SUBMITTED', icon: Send },
  REJECTED: { label: 'Accept Rework', next: 'ACCEPTED', icon: CheckCircle },
};

const getDeadline = (dueDate) => {
  if (!dueDate) return { label: 'No deadline', urgent: false, overdue: false };

  const due = new Date(dueDate);
  const diffMs = due.getTime() - Date.now();
  const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));

  if (diffMs < 0) return { label: 'Overdue', urgent: true, overdue: true };
  if (diffHours <= 24) return { label: `${diffHours}h left`, urgent: true, overdue: false };
  return { label: due.toLocaleDateString(), urgent: false, overdue: false };
};

const TaskCard = ({ task, compact = false, onStatusChange, onClarify }) => {
  const deadline = getDeadline(task.dueDate);
  const action = actionByStatus[task.status];
  const ActionIcon = action?.icon;

  return (
    <article className={`task-card ${compact ? 'task-card-compact' : ''} ${deadline.urgent ? 'task-urgent' : ''}`}>
      <div className="task-card-header">
        <Badge value={task.priority} tone="priority" />
        <Badge value={task.status} />
      </div>
      <h3>{task.title}</h3>
      {!compact && <p>{task.description || 'No task description provided.'}</p>}
      <div className="task-card-meta">
        <span><CalendarClock size={15} /> {deadline.label}</span>
        <Badge value={task.type || 'ANNOTATION'} tone="type" />
      </div>
      {!compact && task.project?.name && <span className="project-chip">{task.project.name}</span>}
      <div className="task-card-actions">
        {action && (
          <button type="button" className="btn btn-primary btn-compact" onClick={() => onStatusChange?.(task, action.next)}>
            <ActionIcon size={15} />
            {action.label}
          </button>
        )}
        <button type="button" className="icon-button" onClick={() => onClarify?.(task)} aria-label="Request clarification" title="Request clarification">
          <HelpCircle size={16} />
        </button>
      </div>
    </article>
  );
};

export default TaskCard;
