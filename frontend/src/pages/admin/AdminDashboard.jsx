import { useContext, useEffect, useMemo, useState } from 'react';
import { CheckCircle, ClipboardList, FolderKanban, Plus, TriangleAlert, UserPlus, Users } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { AuthContext } from '../../context/auth-context';
import Badge from '../../components/Badge';
import NotificationBell from '../../components/NotificationBell';
import Skeleton from '../../components/Skeleton';

const COLORS = ['#7091E6', '#3D52A0', '#B8E8CC', '#F5E8EF', '#B8CCE8', '#FFF0E8'];

const StatCard = ({ icon: Icon, label, value, alert }) => (
  <article className={`stat-card ${alert ? 'stat-alert' : ''}`}>
    <span className="stat-icon"><Icon size={20} /></span>
    <div>
      <p>{label}</p>
      <strong>{value}</strong>
    </div>
  </article>
);

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      try {
        const { data } = await api.get('/dashboard');
        if (active) setDashboard(data);
      } catch {
        if (active) setDashboard(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadDashboard();
    return () => {
      active = false;
    };
  }, []);

  const distribution = useMemo(() => (
    dashboard?.taskDistribution?.map((item) => ({
      name: item.status,
      value: item._count.status,
    })) || []
  ), [dashboard]);

  const handleApprove = async (task) => {
    try {
      await api.patch(`/tasks/${task.id}/status`, { status: 'APPROVED', reviewFeedback: 'Approved from dashboard.' });
      toast.success('Task approved');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Approval failed');
    }
  };

  const stats = dashboard?.stats || {};

  return (
    <main className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</p>
          <h1>Good morning, {user?.name || 'Admin'}</h1>
        </div>
        <NotificationBell />
      </header>

      <section className="stats-grid">
        <StatCard icon={FolderKanban} label="Total Projects" value={stats.totalProjects ?? 0} />
        <StatCard icon={ClipboardList} label="Total Tasks" value={stats.totalTasks ?? 0} />
        <StatCard icon={TriangleAlert} label="Overdue Tasks" value={stats.overdueTasks ?? 0} alert />
        <StatCard icon={Users} label="Team Members" value={stats.teamCount ?? 0} />
      </section>

      {loading && <Skeleton rows={4} />}

      {!loading && <section className="dashboard-grid">
        <article className="panel panel-wide">
          <div className="panel-header">
            <h2>Recent Tasks</h2>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Project</th>
                  <th>Assignee</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {(dashboard?.recentTasks || []).map((task) => (
                  <tr key={task.id}>
                    <td>{task.title}</td>
                    <td>{task.project?.name || 'Unassigned'}</td>
                    <td>{task.assignee?.name || 'Open'}</td>
                    <td><Badge value={task.status} /></td>
                    <td>
                      <button type="button" className="btn btn-secondary btn-compact" onClick={() => handleApprove(task)} disabled={task.status !== 'UNDER_REVIEW'}>
                        <CheckCircle size={15} />
                        Approve
                      </button>
                    </td>
                  </tr>
                ))}
                {!loading && !dashboard?.recentTasks?.length && (
                  <tr><td colSpan="5">No recent tasks yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <h2>Task Distribution</h2>
          </div>
          <div className="chart-box">
            {distribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={distribution} dataKey="value" nameKey="name" innerRadius={54} outerRadius={82} paddingAngle={3}>
                    {distribution.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state compact">No task data.</div>
            )}
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <h2>Top Performers</h2>
          </div>
          <div className="mini-list">
            {(dashboard?.topPerformers || []).map((member, index) => (
              <div key={member.id} className="mini-list-row">
                <span>{index + 1}</span>
                <strong>{member.name}</strong>
                <em>{member.completed} done</em>
              </div>
            ))}
            {!dashboard?.topPerformers?.length && <div className="empty-state compact">No members ranked yet.</div>}
          </div>
        </article>

        <article className="panel panel-wide">
          <div className="panel-header">
            <h2>Activity Feed</h2>
          </div>
          <div className="activity-feed">
            {(dashboard?.activityFeed || []).map((activity) => (
              <div key={activity.id} className="activity-item">
                <span />
                <div>
                  <strong>{activity.user?.name || 'System'}</strong>
                  <p>{activity.action} on {activity.task?.title}</p>
                </div>
                <time>{new Date(activity.createdAt).toLocaleDateString()}</time>
              </div>
            ))}
            {!dashboard?.activityFeed?.length && <div className="empty-state compact">No activity yet.</div>}
          </div>
        </article>

        <article className="panel">
          <div className="panel-header">
            <h2>Quick Actions</h2>
          </div>
          <div className="quick-actions">
            <a className="quick-action" href="/admin/projects"><Plus size={18} /> Create Project</a>
            <a className="quick-action" href="/admin/tasks"><ClipboardList size={18} /> Create Task</a>
            <a className="quick-action" href="/admin/team"><UserPlus size={18} /> Add Member</a>
          </div>
        </article>
      </section>}
    </main>
  );
};

export default AdminDashboard;
