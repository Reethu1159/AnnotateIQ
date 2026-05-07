import { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, Layers, Lock, Mail, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { AuthContext } from '../../context/auth-context';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '', remember: true });
  const [submitting, setSubmitting] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const user = await login(formData.email, formData.password);
      toast.success('Welcome back');
      navigate(user.role === 'ADMIN' ? '/admin/dashboard' : '/member/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-left">
        <div className="auth-left-content">
          <div className="logo-container">
            <Layers size={32} color="white" />
            <span className="logo-text">AnnotateIQ</span>
          </div>
          <h1 className="auth-heading">Build smarter.<br />Work better.</h1>
          <p className="auth-subtext">Run annotation, review, and quality pipelines with role-based control.</p>
          <div className="feature-list">
            <div className="feature-item"><CheckCircle size={20} className="feature-icon" /><span>Review queues for AI operations</span></div>
            <div className="feature-item"><CheckCircle size={20} className="feature-icon" /><span>Secure httpOnly cookie sessions</span></div>
            <div className="feature-item"><Users size={20} className="feature-icon" /><span>Admin and member workspaces</span></div>
          </div>
        </div>
        <div className="auth-pattern"></div>
      </div>

      <div className="auth-right">
        <div className="auth-form-container login-card">
          <h2 className="form-title">Log in</h2>
          <p className="form-subtitle">Use your AnnotateIQ workspace credentials.</p>

          <form onSubmit={handleSubmit} className="signup-form">
            <div className="input-group">
              <label className="input-label" htmlFor="email">Email Address</label>
              <div className="input-with-icon">
                <Mail size={18} />
                <input id="email" type="email" name="email" className="input-field" value={formData.email} onChange={handleChange} required />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="password">Password</label>
              <div className="input-with-icon">
                <Lock size={18} />
                <input id="password" type="password" name="password" className="input-field" value={formData.password} onChange={handleChange} required />
              </div>
            </div>

            <div className="auth-row">
              <label className="check-row">
                <input type="checkbox" name="remember" checked={formData.remember} onChange={handleChange} />
                Remember me
              </label>
              <a href="mailto:support@annotateiq.com">Forgot Password</a>
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
              {submitting ? 'Logging in...' : 'Login'}
            </button>

            <div className="auth-footer">
              Need an account? <Link to="/signup">Create one</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
