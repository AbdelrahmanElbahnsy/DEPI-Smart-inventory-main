import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import AnimatedPage from '../components/layout/AnimatedPage.jsx';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(email, password);
    
    if (result.success) {
      toast.success('Welcome back! Logged in successfully');
      navigate('/');
    } else {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      toast.error(result.message || 'Invalid credentials. Please try again.');
    }
  };

  return (
    <AnimatedPage>
      <div className="auth-page">
        {/* Animated Background Orbs */}
        <div className="orb-container">
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />
        </div>

        <div className={`auth-card ${isShaking ? 'shake' : ''}`}>
          <div className="auth-logo">
            <div className="auth-logo-icon">SI</div>
            <h1>SmartInventory</h1>
          </div>
          
          <h2 className="auth-title">Sign In</h2>
          <p className="auth-subtitle">Enter your credentials to manage your inventory</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-wrapper">
                <Mail className="input-icon" size={18} />
                <input 
                  className="form-input" 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="name@company.com" 
                  required 
                  id="login-email" 
                />
              </div>
            </div>

            <div className="form-group">
              <div className="flex-between">
                <label className="form-label">Password</label>
                <Link to="/forgot-password" style={{ fontSize: '12px', color: 'var(--accent-primary)', marginBottom: '6px' }}>
                  Forgot password?
                </Link>
              </div>
              <div className="input-wrapper">
                <Lock className="input-icon" size={18} />
                <input 
                  className="form-input" 
                  type={showPassword ? 'text' : 'password'} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="••••••••" 
                  required 
                  id="login-password" 
                />
                <button 
                  type="button" 
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="auth-submit" disabled={loading} id="login-submit">
              {loading ? (
                <span className="flex-center gap-2">
                  <div className="loader-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                  Authenticating...
                </span>
              ) : (
                <span className="flex-center gap-2">
                  Sign In <ArrowRight size={16} />
                </span>
              )}
            </button>
          </form>

          <p className="auth-footer">
            New to SmartInventory? <Link to="/register">Create an account</Link>
          </p>
        </div>
      </div>
    </AnimatedPage>
  );
}
