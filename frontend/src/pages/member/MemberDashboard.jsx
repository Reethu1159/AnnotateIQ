import { useContext, useEffect, useMemo, useState } from 'react';
import { ClipboardCheck, Clock3, Sparkles, TriangleAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { AuthContext } from '../../context/auth-context';
import NotificationBell from '../../components/NotificationBell';
import Skeleton from '../../components/Skeleton';
import TaskCard from '../../components/TaskCard';
import Badge from '../../components/Badge';

const quotes = [
  'Small, consistent reviews are how great datasets get made.',
  'Quality is a workflow, not a final checkpoint.',
  'Clear labels today become better model behavior tomorrow.',
];

const MemberDashboard = () => {
  const { user } = useContext(AuthContext);
  const [dashboard, setDashboard] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const [{ data: dashboardData }, { data: projects }] = await Promise.all([
          api.get('/dashboard'),
          api.get('/projects'),
        ]);
        const taskResponses = await Promise.all(projects.map((project) => api.get(`/projects/${project.id}/tasks`).catch(() => ({ data: [] }))));
        if (active) {
          setDashboard(dashboardData);
          setTasks(taskResponses.flatMap((response) => response.data));
        }
      } catch {
        if (active) {
          setDashboard(null);
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

  const todayTasks = useMemo(() => {
    const today = new Date().toDateString();
    return tasks.filter((task) => task.dueDate && new Date(task.dueDate).toDateString() === today).slice(0, 4);
  }, [tasks]);

  const performance = useMemo(() => {
    const completed = tasks.filter((task) => ['APPROVED', 'DONE'].includes(task.status)).length;
    const rejected = tasks.filter((task) => task.status === 'REJECTED').length;
    return {
      done: completed,
      accuracy: tasks.length ? Math.round((completed / tasks.length) * 100) : 0,
      avgTime: tasks.length ? '2.4h' : '-',
      rejectionRate: tasks.length ? Math.round((rejected / tasks.length) * 100) : 0,
    };
  }, [tasks]);

  const handleStatusChange = async (task, status) => {
    try {
      await api.patch(`/tasks/${task.id}/status`, { status, submissionNotes: 'Submitted from member dashboard.' });
      toast.success('Task updated');
      setTasks((current) => current.map((item) => item.id === task.id ? { ...item, status: status === 'SUBMITTED' ? 'UNDER_REVIEW' : status } : item));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Task update failed');
    }
  };

  const handleClarify = async (task) => {
    try {
      await api.post(`/tasks/${task.id}/clarify`, { note: 'Clarification requested from dashboard.' });
      toast.success('Clarification requested');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Clarification failed');
    }
  };

  const stats = dashboard?.stats || {};

  return (
    <main className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</p>
          <h1>Good morning, {user?.name || 'Member'}</h1>
          <p className="page-subtitle">{todayTasks.length} tasks due today</p>
        </div>
        <NotificationBell />
      </header>

      <section className="quote-band">
        <Sparkles size={20} />
        <span>{quotes[new Date().getDate() % quotes.length]}</span>
      </section>

      {loading ? (
        <Skeleton rows={4} />
      ) : (
        <>
          <section className="stats-grid three">
            <article className="stat-card"><span className="stat-icon"><ClipboardCheck size={20} /></span><div><p>Assigned to Me</p><strong>{stats.assignedTasks ?? 0}</strong></div></article>
            <article className="stat-card"><span className="stat-icon"><Clock3 size={20} /></span><div><p>Completed This Week</p><strong>{stats.completedThisWeek ?? 0}</strong></div></article>
            <article className="stat-card stat-alert"><span className="stat-icon"><TriangleAlert size={20} /></span><div><p>Overdue</p><strong>{stats.overdue ?? 0}</strong></div></article>
          </section>

          <section className="member-section">
            <div className="panel-header"><h2>Today's Tasks</h2></div>
            <div className="horizontal-task-list">
              {todayTasks.map((task) => <TaskCard key={task.id} task={task} compact onStatusChange={handleStatusChange} onClarify={handleClarify} />)}
              {todayTasks.length === 0 && <div className="empty-state">No tasks due today.</div>}
            </div>
          </section>

          <section className="performance-row">
            <span><strong>{performance.done}</strong> done</span>
            <span><strong>{performance.accuracy}%</strong> accuracy</span>
            <span><strong>{performance.avgTime}</strong> avg time</span>
            <span><strong>{performance.rejectionRate}%</strong> rejection rate</span>
          </section>

          <section className="dashboard-grid">
            <article className="panel">
              <div className="panel-header"><h2>Upcoming Tasks</h2></div>
              <div className="timeline-list">
                {(dashboard?.upcomingTasks || []).map((task) => (
                  <div key={task.id} className="timeline-item">
                    <time>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}</time>
                    <span>{task.title}</span>
                    <Badge value={task.priority} tone="priority" />
                  </div>
                ))}
                {!dashboard?.upcomingTasks?.length && <div className="empty-state compact">No upcoming tasks.</div>}
              </div>
            </article>
            <article className="panel">
              <div className="panel-header"><h2>Recent Feedback</h2></div>
              <div className="feedback-list">
                {(dashboard?.recentFeedback || []).map((item) => (
                  <div key={item.id} className="feedback-card">
                    <Badge value={item.status} />
                    <strong>{item.title}</strong>
                    <p>{item.reviewFeedback}</p>
                  </div>
                ))}
                {!dashboard?.recentFeedback?.length && <div className="empty-state compact">No reviewed feedback yet.</div>}
              </div>
            </article>
          </section>
        </>
      )}
    </main>
  );
};

export default MemberDashboard;
