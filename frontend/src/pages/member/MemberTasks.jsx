import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core';
import { Search } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Badge from '../../components/Badge';
import Skeleton from '../../components/Skeleton';
import TaskCard from '../../components/TaskCard';

const columns = [
  { id: 'TODO', title: 'Todo', statuses: ['TODO', 'ACCEPTED', 'REJECTED'] },
  { id: 'IN_PROGRESS', title: 'In Progress', statuses: ['IN_PROGRESS'] },
  { id: 'UNDER_REVIEW', title: 'Under Review', statuses: ['UNDER_REVIEW', 'SUBMITTED', 'APPROVED'] },
  { id: 'DONE', title: 'Done', statuses: ['DONE'] },
];

const statusByColumn = {
  TODO: 'ACCEPTED',
  IN_PROGRESS: 'IN_PROGRESS',
  UNDER_REVIEW: 'SUBMITTED',
  DONE: 'DONE',
};

const DraggableTask = ({ task, children }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: task.id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {children}
    </div>
  );
};

const DroppableColumn = ({ column, children }) => {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <section ref={setNodeRef} className={`kanban-column ${isOver ? 'drag-over' : ''}`}>
      <h2>{column.title}</h2>
      {children}
    </section>
  );
};

const MemberTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState({ search: '', project: searchParams.get('project') || 'All', priority: 'All' });
  const [submitTaskId, setSubmitTaskId] = useState(null);
  const [submissionNotes, setSubmissionNotes] = useState('');

  const loadTasks = async () => {
    try {
      const { data: projectData } = await api.get('/projects');
      const taskResponses = await Promise.all(projectData.map((project) => api.get(`/projects/${project.id}/tasks`).catch(() => ({ data: [] }))));
      setProjects(projectData);
      setTasks(taskResponses.flatMap((response) => response.data));
    } catch {
      setProjects([]);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const { data: projectData } = await api.get('/projects');
        const taskResponses = await Promise.all(projectData.map((project) => api.get(`/projects/${project.id}/tasks`).catch(() => ({ data: [] }))));
        if (active) {
          setProjects(projectData);
          setTasks(taskResponses.flatMap((response) => response.data));
        }
      } catch {
        if (active) {
          setProjects([]);
          setTasks([]);
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

  const filteredTasks = useMemo(() => tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(filters.search.toLowerCase());
    const matchesProject = filters.project === 'All' || task.projectId === filters.project;
    const matchesPriority = filters.priority === 'All' || task.priority === filters.priority;
    return matchesSearch && matchesProject && matchesPriority;
  }), [filters, tasks]);

  const handleStatusChange = async (task, status, notes) => {
    try {
      await api.patch(`/tasks/${task.id}/status`, { status, submissionNotes: notes });
      toast.success('Task moved');
      loadTasks();
      setSubmitTaskId(null);
      setSubmissionNotes('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Status update failed');
    }
  };

  const handleClarify = async (task) => {
    try {
      await api.post(`/tasks/${task.id}/clarify`, { note: 'I need clarification on this task.' });
      toast.success('Clarification requested');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Clarification failed');
    }
  };

  const handleDragEnd = ({ active, over }) => {
    if (!over) return;
    const task = tasks.find((item) => item.id === active.id);
    if (!task) return;
    const nextStatus = statusByColumn[over.id];
    if (!nextStatus || nextStatus === task.status) return;

    if (nextStatus === 'SUBMITTED') {
      setSubmitTaskId(task.id);
      return;
    }

    handleStatusChange(task, nextStatus);
  };

  const completedTasks = filteredTasks.filter((task) => ['DONE', 'APPROVED'].includes(task.status));

  return (
    <main className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Member</p>
          <h1>My Tasks</h1>
        </div>
      </header>

      <section className="toolbar">
        <label className="search-field">
          <Search size={18} />
          <input value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} placeholder="Search tasks" />
        </label>
        <select className="input-field" value={filters.project} onChange={(event) => setFilters({ ...filters, project: event.target.value })}>
          <option value="All">All Projects</option>
          {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
        </select>
        <select className="input-field" value={filters.priority} onChange={(event) => setFilters({ ...filters, priority: event.target.value })}>
          <option>All</option>
          <option>LOW</option>
          <option>MEDIUM</option>
          <option>HIGH</option>
          <option>CRITICAL</option>
        </select>
      </section>

      {loading ? (
        <Skeleton rows={4} />
      ) : (
        <DndContext onDragEnd={handleDragEnd}>
          <section className="kanban-board">
            {columns.map((column) => {
              const columnTasks = filteredTasks.filter((task) => column.statuses.includes(task.status));
              return (
                <DroppableColumn key={column.id} column={column}>
                  {columnTasks.map((task) => (
                    <DraggableTask key={task.id} task={task}>
                      <TaskCard task={task} onStatusChange={task.status === 'IN_PROGRESS' ? () => setSubmitTaskId(task.id) : handleStatusChange} onClarify={handleClarify} />
                      {submitTaskId === task.id && (
                        <form className="inline-submit" onSubmit={(event) => {
                          event.preventDefault();
                          handleStatusChange(task, 'SUBMITTED', submissionNotes);
                        }}>
                          <textarea className="input-field" rows="3" value={submissionNotes} onChange={(event) => setSubmissionNotes(event.target.value)} placeholder="Submission notes" required />
                          <button type="submit" className="btn btn-primary btn-compact">Submit</button>
                        </form>
                      )}
                    </DraggableTask>
                  ))}
                  {columnTasks.length === 0 && <div className="empty-state compact">No tasks.</div>}
                </DroppableColumn>
              );
            })}
          </section>
        </DndContext>
      )}

      <section className="panel mt-md">
        <div className="panel-header"><h2>Completed History</h2></div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Project</th>
                <th>Status</th>
                <th>Completed</th>
              </tr>
            </thead>
            <tbody>
              {completedTasks.map((task) => (
                <tr key={task.id}>
                  <td>{task.title}</td>
                  <td>{task.project?.name || 'Project'}</td>
                  <td><Badge value={task.status} /></td>
                  <td>{task.completedAt ? new Date(task.completedAt).toLocaleDateString() : 'Recently'}</td>
                </tr>
              ))}
              {completedTasks.length === 0 && <tr><td colSpan="4">No completed tasks yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
};

export default MemberTasks;
