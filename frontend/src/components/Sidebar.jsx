import { useContext, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { ClipboardList, FolderKanban, LayoutDashboard, LogOut, Menu, Settings, Users, Layers, X } from 'lucide-react';
import { AuthContext } from '../context/auth-context';
import Avatar from './Avatar';

const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/projects', label: 'Projects', icon: FolderKanban },
  { to: '/admin/tasks', label: 'Tasks', icon: ClipboardList },
  { to: '/admin/team', label: 'Team Members', icon: Users },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

const memberLinks = [
  { to: '/member/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/member/tasks', label: 'My Tasks', icon: ClipboardList },
  { to: '/member/projects', label: 'Projects', icon: FolderKanban },
  { to: '/member/settings', label: 'Settings', icon: Settings },
];

const Sidebar = () => {
  const { user, logout } = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const links = user?.role === 'ADMIN' ? adminLinks : memberLinks;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      <button type="button" className="mobile-menu-button" onClick={() => setOpen((current) => !current)} aria-label="Toggle navigation" title="Toggle navigation">
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>
      <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="sidebar-brand">
        <Layers size={28} />
        <span>AnnotateIQ</span>
      </div>

      <nav className="sidebar-nav" aria-label="Primary navigation">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink key={link.to} to={link.to} onClick={() => setOpen(false)} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <Icon size={18} />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-user">
        <Avatar name={user?.name} color={user?.avatarColor} />
        <div>
          <strong>{user?.name}</strong>
          <span>{user?.role}</span>
        </div>
      </div>

      <button type="button" className="sidebar-logout" onClick={handleLogout}>
        <LogOut size={18} />
        <span>Logout</span>
      </button>
      </aside>
    </>
  );
};

export default Sidebar;
