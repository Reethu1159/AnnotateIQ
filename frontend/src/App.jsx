import { useContext } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthContext } from './context/auth-context';
import Sidebar from './components/Sidebar';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProjects from './pages/admin/AdminProjects';
import AdminTasks from './pages/admin/AdminTasks';
import AdminTeam from './pages/admin/AdminTeam';
import MemberDashboard from './pages/member/MemberDashboard';
import MemberProjects from './pages/member/MemberProjects';
import MemberTasks from './pages/member/MemberTasks';
import Settings from './pages/shared/Settings';
import './App.css';

const LoadingScreen = () => (
  <div className="app-loading">
    <div className="loading-mark">AIQ</div>
    <p>Loading workspace</p>
  </div>
);

const RequireAuth = ({ allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'ADMIN' ? '/admin/dashboard' : '/member/dashboard'} replace />;
  }

  return <Outlet />;
};

const AppLayout = () => (
  <div className="app-layout">
    <Sidebar />
    <div className="app-content">
      <Outlet />
    </div>
  </div>
);

const HomeRedirect = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;

  return <Navigate to={user.role === 'ADMIN' ? '/admin/dashboard' : '/member/dashboard'} replace />;
};

const App = () => (
  <>
    <Toaster position="top-right" toastOptions={{ duration: 2600 }} />
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route element={<RequireAuth allowedRoles={['ADMIN']} />}>
        <Route path="/admin" element={<AppLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="projects" element={<AdminProjects />} />
          <Route path="tasks" element={<AdminTasks />} />
          <Route path="team" element={<AdminTeam />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Route>

      <Route element={<RequireAuth allowedRoles={['MEMBER']} />}>
        <Route path="/member" element={<AppLayout />}>
          <Route index element={<Navigate to="/member/dashboard" replace />} />
          <Route path="dashboard" element={<MemberDashboard />} />
          <Route path="tasks" element={<MemberTasks />} />
          <Route path="projects" element={<MemberProjects />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </>
);

export default App;
