import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/auth-context';
import { Layers, CheckCircle, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import './Auth.css';

const Signup = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', dob: '', gender: '',
    department: 'Engineering', role: 'MEMBER', username: '', password: '', confirmPassword: '',
    avatarColor: '#7091E6', bio: '', githubLink: '', linkedinLink: ''
  });
  
  const { signup } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    try {
      const data = await signup(formData);
      toast.success('Account created successfully!');
      navigate(data.role === 'ADMIN' ? '/admin/dashboard' : '/member/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Signup failed');
    }
  };

  const colors = ['#7091E6', '#3D52A0', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="auth-container">
      {/* Left Panel */}
      <div className="auth-left">
        <div className="auth-left-content">
          <div className="logo-container">
            <Layers size={32} color="white" />
            <span className="logo-text">AnnotateIQ</span>
          </div>
          
          <h1 className="auth-heading">Build smarter.<br/>Work better.</h1>
          <p className="auth-subtext">The ultimate precision ops platform for AI teams doing LLM annotation and data quality.</p>
          
          <div className="feature-list">
            <div className="feature-item">
              <CheckCircle size={20} className="feature-icon" />
              <span>Manage complex task pipelines</span>
            </div>
            <div className="feature-item">
              <CheckCircle size={20} className="feature-icon" />
              <span>Track team performance in real-time</span>
            </div>
            <div className="feature-item">
              <Users size={20} className="feature-icon" />
              <span>Collaborate with roles and rules</span>
            </div>
          </div>
        </div>
        
        {/* Decorative pattern */}
        <div className="auth-pattern"></div>
      </div>

      {/* Right Panel */}
      <div className="auth-right">
        <div className="auth-form-container">
          <div className="step-indicator">
            <div className={`step-dot ${step >= 1 ? 'active' : ''}`}>1</div>
            <div className={`step-line ${step >= 2 ? 'active' : ''}`}></div>
            <div className={`step-dot ${step >= 2 ? 'active' : ''}`}>2</div>
            <div className={`step-line ${step >= 3 ? 'active' : ''}`}></div>
            <div className={`step-dot ${step >= 3 ? 'active' : ''}`}>3</div>
          </div>

          <h2 className="form-title">
            {step === 1 && "Personal Info"}
            {step === 2 && "Account Setup"}
            {step === 3 && "Profile"}
          </h2>

          <form onSubmit={step === 3 ? handleSubmit : (e) => e.preventDefault()} className="signup-form">
            
            {/* STEP 1 */}
            {step === 1 && (
              <div className="step-content">
                <div className="input-group">
                  <label className="input-label">Full Name</label>
                  <input type="text" name="name" className="input-field" value={formData.name} onChange={handleChange} required />
                </div>
                <div className="input-group">
                  <label className="input-label">Email Address</label>
                  <input type="email" name="email" className="input-field" value={formData.email} onChange={handleChange} required />
                </div>
                <div className="input-group">
                  <label className="input-label">Phone Number</label>
                  <input type="tel" name="phone" className="input-field" value={formData.phone} onChange={handleChange} />
                </div>
                <div className="input-group">
                  <label className="input-label">Date of Birth</label>
                  <input type="date" name="dob" className="input-field" value={formData.dob} onChange={handleChange} />
                </div>
                <div className="input-group">
                  <label className="input-label">Gender</label>
                  <div className="radio-group">
                    <label><input type="radio" name="gender" value="Male" onChange={handleChange} /> Male</label>
                    <label><input type="radio" name="gender" value="Female" onChange={handleChange} /> Female</label>
                    <label><input type="radio" name="gender" value="Other" onChange={handleChange} /> Prefer not to say</label>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <div className="step-content">
                <div className="input-group">
                  <label className="input-label">Department</label>
                  <select name="department" className="input-field" value={formData.department} onChange={handleChange}>
                    <option value="Engineering">Engineering</option>
                    <option value="AI Ops">AI Ops</option>
                    <option value="Data Annotation">Data Annotation</option>
                    <option value="Quality Review">Quality Review</option>
                    <option value="Management">Management</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Role</label>
                  <select name="role" className="input-field" value={formData.role} onChange={handleChange}>
                    <option value="MEMBER">Member (Annotator/Reviewer)</option>
                    <option value="ADMIN">Admin (Manager)</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Username</label>
                  <input type="text" name="username" className="input-field" value={formData.username} onChange={handleChange} required />
                </div>
                <div className="input-group">
                  <label className="input-label">Password</label>
                  <input type="password" name="password" className="input-field" value={formData.password} onChange={handleChange} required minLength={8} />
                  {/* Strength meter could go here */}
                </div>
                <div className="input-group">
                  <label className="input-label">Confirm Password</label>
                  <input type="password" name="confirmPassword" className="input-field" value={formData.confirmPassword} onChange={handleChange} required />
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <div className="step-content">
                <div className="input-group">
                  <label className="input-label">Avatar Color</label>
                  <div className="color-picker">
                    {colors.map(c => (
                      <div 
                        key={c} 
                        className={`color-circle ${formData.avatarColor === c ? 'selected' : ''}`}
                        style={{ backgroundColor: c }}
                        onClick={() => setFormData({...formData, avatarColor: c})}
                      />
                    ))}
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Short Bio (optional)</label>
                  <textarea name="bio" className="input-field" rows="3" maxLength="120" value={formData.bio} onChange={handleChange}></textarea>
                </div>
                <div className="input-group">
                  <label className="input-label">GitHub Link (optional)</label>
                  <input type="url" name="githubLink" className="input-field" value={formData.githubLink} onChange={handleChange} placeholder="https://github.com/..." />
                </div>
                <div className="input-group">
                  <label className="input-label">LinkedIn Link (optional)</label>
                  <input type="url" name="linkedinLink" className="input-field" value={formData.linkedinLink} onChange={handleChange} placeholder="https://linkedin.com/in/..." />
                </div>
              </div>
            )}

            <div className="form-actions">
              {step > 1 && (
                <button type="button" className="btn btn-secondary" onClick={handleBack}>Back</button>
              )}
              {step < 3 ? (
                <button type="button" className="btn btn-primary" onClick={handleNext} style={{ marginLeft: 'auto' }}>Next</button>
              ) : (
                <button type="submit" className="btn btn-primary" style={{ marginLeft: 'auto' }}>Create Account</button>
              )}
            </div>
            
            <div className="auth-footer">
              Already have an account? <Link to="/login">Log in here</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;
