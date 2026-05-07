import { useEffect, useMemo, useState } from 'react';
import { Download, Eye, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import Skeleton from '../../components/Skeleton';

const emptyTask = {
  title: '',
  description: '',
  type: 'ANNOTATION',
  projectId: '',
  assigneeId: '',
  priority: 'MEDIUM',
  dueDate: '',
  estimatedHours: 2,
  guidelinesUrl: '',
};

const AdminTasks = () => {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState(emptyTask);
  const [filters, setFilters] = useState({ search: '', project: 'All', status: 'All', assignee: 'All', priority: 'All', dueFrom: '', dueTo: '' });
  const [selectedIds, setSelectedIds] = useState([]);

  const loadData = async () => {
    try {
      const [{ data: projectData }, { data: userData }] = await Promise.all([
        api.get('/projects'),
        api.get('/users'),
      ]);
      setProjects(projectData);
      setUsers(userData);

      const taskResults = await Promise.all(projectData.map((project) => api.get(`/projects/${project.id}/tasks`).catch(() => ({ data: [] }))));
      setTasks(taskResults.flatMap((result) => result.data));
    } catch {
      setProjects([]);
      setUsers([]);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    const fetchData = async () => {
      try {
        const [{ data: projectData }, { data: userData }] = await Promise.all([
          api.get('/projects'),
          api.get('/users'),
        ]);
        const taskResults = await Promise.all(projectData.map((project) => api.get(`/projects/${project.id}/tasks`).catch(() => ({ data: [] }))));

        if (active) {
          setProjects(projectData);
          setUsers(userData);
          setTasks(taskResults.flatMap((result) => result.data));
        }
      } catch {
        if (active) {
          setProjects([]);
          setUsers([]);
          setTasks([]);
        }
      }
    };

    fetchData();
    return () => {
      active = false;
    };
  }, []);

  const filteredTasks = useMemo(() => tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(filters.search.toLowerCase());
    const matchesProject = filters.project === 'All' || task.projectId === filters.project;
    const matchesStatus = filters.status === 'All' || task.status === filters.status;
    const matchesAssignee = filters.assignee === 'All' || task.assigneeId === filters.assignee;
    const matchesPriority = filters.priority === 'All' || task.priority === filters.priority;
    const dueTime = task.dueDate ? new Date(task.dueDate).getTime() : null;
    const matchesFrom = !filters.dueFrom || (dueTime && dueTime >= new Date(filters.dueFrom).getTime());
    const matchesTo = !filters.dueTo || (dueTime && dueTime <= new Date(filters.dueTo).getTime());
    return matchesSearch && matchesProject && matchesStatus && matchesAssignee && matchesPriority && matchesFrom && matchesTo;
  }), [filters, tasks]);

  const rejectedTasks = tasks.filter((task) => task.status === 'REJECTED');

  const handleChange = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    try {
      await api.post(`/projects/${formData.projectId}/tasks`, {
        ...formData,
        assigneeId: formData.assigneeId || null,
        dueDate: formData.dueDate || null,
        estimatedHours: Number(formData.estimatedHours),
      });
      toast.success('Task created');
      setModalOpen(false);
      setFormData(emptyTask);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Task creation failed');
    }
  };

  const handleDelete = async (task) => {
    try {
      await api.delete(`/tasks/${task.id}`);
      toast.success('Task deleted');
      setTasks((current) => current.filter((item) => item.id !== task.id));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Delete failed');
    }
  };

  const handleBatchDelete = async () => {
    try {
      await Promise.all(selectedIds.map((taskId) => api.delete(`/tasks/${taskId}`)));
      toast.success('Selected tasks deleted');
      setTasks((current) => current.filter((task) => !selectedIds.includes(task.id)));
      setSelectedIds([]);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Batch delete failed');
    }
  };

  const handleBatchPriority = async () => {
    try {
      await Promise.all(selectedIds.map((taskId) => api.patch(`/tasks/${taskId}`, { priority: 'HIGH' })));
      toast.success('Selected tasks moved to high priority');
      loadData();
      setSelectedIds([]);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Priority update failed');
    }
  };

  const handleBatchReassign = async () => {
    const assignee = users.find((user) => user.role === 'MEMBER') || users[0];
    if (!assignee) {
      toast.error('No team member available');
      return;
    }

    try {
      await Promise.all(selectedIds.map((taskId) => api.patch(`/tasks/${taskId}/assign`, { assigneeId: assignee.id })));
      toast.success(`Selected tasks assigned to ${assignee.name}`);
      loadData();
      setSelectedIds([]);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Batch reassignment failed');
    }
  };

  const handleExport = () => {
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/dashboard/export`;
  };

  const toggleSelected = (taskId) => {
    setSelectedIds((current) => current.includes(taskId) ? current.filter((id) => id !== taskId) : [...current, taskId]);
  };

  return (
    <main className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Tasks</h1>
        </div>
        <div className="header-actions">
          <button type="button" className="btn btn-secondary" onClick={handleExport}>
            <Download size={18} />
            Export CSV
          </button>
          <button type="button" className="btn btn-primary" onClick={() => setModalOpen(true)}>
            <Plus size={18} />
            Create Task
          </button>
        </div>
      </header>

      <section className="toolbar task-toolbar">
        <label className="search-field">
          <Search size={18} />
          <input value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} placeholder="Search tasks" />
        </label>
        <select className="input-field" value={filters.project} onChange={(event) => setFilters({ ...filters, project: event.target.value })}>
          <option value="All">All Projects</option>
          {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
        </select>
        <select className="input-field" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
          <option>All</option>
          <option>TODO</option>
          <option>ACCEPTED</option>
          <option>IN_PROGRESS</option>
          <option>UNDER_REVIEW</option>
          <option>APPROVED</option>
          <option>REJECTED</option>
          <option>DONE</option>
        </select>
        <select className="input-field" value={filters.assignee} onChange={(event) => setFilters({ ...filters, assignee: event.target.value })}>
          <option value="All">All Assignees</option>
          {users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
        </select>
        <select className="input-field" value={filters.priority} onChange={(event) => setFilters({ ...filters, priority: event.target.value })}>
          <option>All</option>
          <option>LOW</option>
          <option>MEDIUM</option>
          <option>HIGH</option>
          <option>CRITICAL</option>
        </select>
        <input type="date" className="input-field" value={filters.dueFrom} onChange={(event) => setFilters({ ...filters, dueFrom: event.target.value })} aria-label="Due from" />
        <input type="date" className="input-field" value={filters.dueTo} onChange={(event) => setFilters({ ...filters, dueTo: event.target.value })} aria-label="Due to" />
      </section>

      {selectedIds.length > 0 && (
        <section className="batch-bar">
          <strong>{selectedIds.length} selected</strong>
          <button type="button" className="btn btn-secondary btn-compact" onClick={handleBatchReassign}>Reassign</button>
          <button type="button" className="btn btn-secondary btn-compact" onClick={handleBatchPriority}>Change Priority</button>
          <button type="button" className="btn btn-danger btn-compact" onClick={handleBatchDelete}>Delete</button>
        </section>
      )}

      {loading ? <Skeleton rows={4} /> : <section className="panel">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th><span className="sr-only">Select</span></th>
                <th>Title</th>
                <th>Type</th>
                <th>Project</th>
                <th>Assignee</th>
                <th>Priority</th>
                <th>Due Date</th>
                <th>Est Hours</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map((task) => (
                <tr key={task.id}>
                  <td><input type="checkbox" checked={selectedIds.includes(task.id)} onChange={() => toggleSelected(task.id)} /></td>
                  <td>{task.title}</td>
                  <td><Badge value={task.type} tone="type" /></td>
                  <td>{task.project?.name || projects.find((project) => project.id === task.projectId)?.name || 'Project'}</td>
                  <td>{task.assignee?.name || 'Open'}</td>
                  <td><Badge value={task.priority} tone="priority" /></td>
                  <td>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'None'}</td>
                  <td>{task.estimatedHours || '-'}</td>
                  <td><Badge value={task.status} /></td>
                  <td>
                    <div className="row-actions">
                      <button type="button" className="icon-button" onClick={() => setSelectedTask(task)} aria-label="View" title="View"><Eye size={16} /></button>
                      <button type="button" className="icon-button" aria-label="Edit" title="Edit"><Pencil size={16} /></button>
                      <button type="button" className="icon-button danger" onClick={() => handleDelete(task)} aria-label="Delete" title="Delete"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTasks.length === 0 && <tr><td colSpan="10">No tasks match the current filters.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>}

      <section className="rejected-section">
        <h2>Rejected Tasks</h2>
        {rejectedTasks.map((task) => (
          <div key={task.id} className="rejected-row">
            <span>{task.title}</span>
            <em>{task.reviewFeedback || 'Needs rework'}</em>
          </div>
        ))}
        {rejectedTasks.length === 0 && <p className="text-muted">No rejected tasks right now.</p>}
      </section>

      <Modal title="Create Task" open={modalOpen} onClose={() => setModalOpen(false)} size="lg">
        <form className="form-grid" onSubmit={handleCreate}>
          <label className="input-group span-2">
            <span className="input-label">Title</span>
            <input className="input-field" value={formData.title} onChange={(event) => handleChange('title', event.target.value)} required />
          </label>
          <label className="input-group span-2">
            <span className="input-label">Description</span>
            <textarea className="input-field" rows="3" value={formData.description} onChange={(event) => handleChange('description', event.target.value)} />
          </label>
          <label className="input-group">
            <span className="input-label">Project</span>
            <select className="input-field" value={formData.projectId} onChange={(event) => handleChange('projectId', event.target.value)} required>
              <option value="">Select project</option>
              {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
            </select>
          </label>
          <label className="input-group">
            <span className="input-label">Assignee</span>
            <select className="input-field" value={formData.assigneeId} onChange={(event) => handleChange('assigneeId', event.target.value)}>
              <option value="">Open</option>
              {users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
            </select>
          </label>
          <label className="input-group">
            <span className="input-label">Type</span>
            <select className="input-field" value={formData.type} onChange={(event) => handleChange('type', event.target.value)}>
              <option>ANNOTATION</option>
              <option>EVALUATION</option>
              <option>DATA_OPS</option>
              <option>PROMPT_ENGINEERING</option>
              <option>QA</option>
            </select>
          </label>
          <label className="input-group">
            <span className="input-label">Priority</span>
            <select className="input-field" value={formData.priority} onChange={(event) => handleChange('priority', event.target.value)}>
              <option>LOW</option>
              <option>MEDIUM</option>
              <option>HIGH</option>
              <option>CRITICAL</option>
            </select>
          </label>
          <label className="input-group">
            <span className="input-label">Due Date</span>
            <input type="date" className="input-field" value={formData.dueDate} onChange={(event) => handleChange('dueDate', event.target.value)} />
          </label>
          <label className="input-group">
            <span className="input-label">Est Hours</span>
            <input type="number" min="0.1" step="0.1" className="input-field" value={formData.estimatedHours} onChange={(event) => handleChange('estimatedHours', event.target.value)} />
          </label>
          <label className="input-group span-2">
            <span className="input-label">Guidelines Link</span>
            <input type="url" className="input-field" value={formData.guidelinesUrl} onChange={(event) => handleChange('guidelinesUrl', event.target.value)} />
          </label>
          <div className="modal-actions span-2">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Task</button>
          </div>
        </form>
      </Modal>

      <aside className={`drawer ${selectedTask ? 'open' : ''}`}>
        {selectedTask && (
          <>
            <button type="button" className="icon-button drawer-close" onClick={() => setSelectedTask(null)} aria-label="Close" title="Close">
              <X size={18} />
            </button>
            <Badge value={selectedTask.status} />
            <h2>{selectedTask.title}</h2>
            <p>{selectedTask.description || 'No description.'}</p>
            <div className="status-flow">{'TODO -> ACCEPTED -> IN_PROGRESS -> SUBMITTED -> UNDER_REVIEW -> APPROVED -> DONE'}</div>
            <div className="drawer-section">
              <h3>Submission Notes</h3>
              <p>{selectedTask.submissionNotes || 'No submission notes yet.'}</p>
            </div>
            <div className="drawer-section">
              <h3>Admin Review</h3>
              <p>{selectedTask.reviewFeedback || 'No feedback yet.'}</p>
            </div>
          </>
        )}
      </aside>
    </main>
  );
};

export default AdminTasks;
