import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import api from '../../api/axios';
import Avatar from '../../components/Avatar';
import Badge from '../../components/Badge';
import Skeleton from '../../components/Skeleton';

const getStats = (member) => {
  const tasks = member.assignedTasks || [];
  const completed = tasks.filter((task) => ['APPROVED', 'DONE'].includes(task.status)).length;
  const active = tasks.filter((task) => !['APPROVED', 'DONE'].includes(task.status)).length;
  const accuracy = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

  return {
    assigned: tasks.length,
    completed,
    active,
    accuracy,
    onTime: completed ? Math.min(98, 82 + completed) : 0,
  };
};

const AdminTeam = () => {
  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('All');
  const [selectedMember, setSelectedMember] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadMembers = async () => {
      try {
        const { data } = await api.get('/users');
        if (active) setMembers(data);
      } catch {
        if (active) setMembers([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadMembers();
    return () => {
      active = false;
    };
  }, []);

  const departments = useMemo(() => ['All', ...new Set(members.map((member) => member.department).filter(Boolean))], [members]);

  const filteredMembers = useMemo(() => members.filter((member) => {
    const matchesSearch = [member.name, member.email].join(' ').toLowerCase().includes(search.toLowerCase());
    const matchesDepartment = department === 'All' || member.department === department;
    return matchesSearch && matchesDepartment;
  }), [department, members, search]);

  const leaderboard = useMemo(() => [...members]
    .map((member) => ({ ...member, stats: getStats(member) }))
    .sort((a, b) => b.stats.completed - a.stats.completed)
    .slice(0, 8), [members]);

  return (
    <main className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Admin</p>
          <h1>Team Members</h1>
        </div>
        <button type="button" className="btn btn-primary">
          <Plus size={18} />
          Add Member
        </button>
      </header>

      <section className="toolbar">
        <label className="search-field">
          <Search size={18} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search members" />
        </label>
        <select className="input-field" value={department} onChange={(event) => setDepartment(event.target.value)}>
          {departments.map((item) => <option key={item}>{item}</option>)}
        </select>
      </section>

      {loading ? <Skeleton rows={4} /> : <section className="member-grid">
        {filteredMembers.map((member) => {
          const stats = getStats(member);
          return (
            <article key={member.id} className="member-card">
              <div className="member-card-top">
                <Avatar name={member.name} color={member.avatarColor} size="lg" />
                <Badge value={member.role} tone="role" />
              </div>
              <h3>{member.name}</h3>
              <p>{member.email}</p>
              <span className="department-pill">{member.department || 'Unassigned'}</span>
              <div className="member-stats">
                <span><strong>{stats.assigned}</strong> assigned</span>
                <span><strong>{stats.completed}</strong> completed</span>
                <span><strong>{stats.accuracy}%</strong> accuracy</span>
                <span><strong>{stats.onTime}%</strong> on-time</span>
              </div>
              <div className="member-card-actions">
                <button type="button" className="btn btn-secondary btn-compact" onClick={() => setSelectedMember(member)}>View Profile</button>
                <button type="button" className="btn btn-danger btn-compact">Remove</button>
              </div>
            </article>
          );
        })}
        {filteredMembers.length === 0 && <div className="empty-state">No team members match the current filters.</div>}
      </section>}

      <section className="panel">
        <div className="panel-header">
          <h2>Leaderboard</h2>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Member</th>
                <th>Completed</th>
                <th>Active</th>
                <th>Accuracy</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((member, index) => (
                <tr key={member.id}>
                  <td>{index + 1}</td>
                  <td>{member.name}</td>
                  <td>{member.stats.completed}</td>
                  <td>{member.stats.active}</td>
                  <td>{member.stats.accuracy}%</td>
                </tr>
              ))}
              {leaderboard.length === 0 && <tr><td colSpan="5">No leaderboard data yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <aside className={`drawer ${selectedMember ? 'open' : ''}`}>
        {selectedMember && (
          <>
            <button type="button" className="icon-button drawer-close" onClick={() => setSelectedMember(null)} aria-label="Close" title="Close">
              <X size={18} />
            </button>
            <Avatar name={selectedMember.name} color={selectedMember.avatarColor} size="lg" />
            <h2>{selectedMember.name}</h2>
            <p>{selectedMember.email}</p>
            <div className="drawer-section">
              <h3>Performance</h3>
              <div className="performance-bars">
                <span style={{ width: `${getStats(selectedMember).accuracy}%` }} />
              </div>
              <p>{getStats(selectedMember).accuracy}% completion accuracy</p>
            </div>
            <div className="drawer-section">
              <h3>Active Tasks</h3>
              {(selectedMember.assignedTasks || []).filter((task) => !['APPROVED', 'DONE'].includes(task.status)).slice(0, 6).map((task) => (
                <div key={task.id} className="task-mini-row">
                  <span>{task.id}</span>
                  <Badge value={task.status} />
                </div>
              ))}
            </div>
          </>
        )}
      </aside>
    </main>
  );
};

export default AdminTeam;
