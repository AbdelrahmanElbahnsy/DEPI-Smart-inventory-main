import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import AnimatedPage from '../components/layout/AnimatedPage.jsx';

export default function Login() {
  const [email, setEmail] = useState('admin@inventory.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await login(email, password);
    if (result.success) {
      toast.success('Welcome back! Logged in successfully');
      navigate('/');
    } else {
      setError(result.message);
      toast.error(result.message || 'Login failed');
    }
  };

  return (
    <AnimatedPage>
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">SI</div>
          <h1>SmartInventory</h1>
        </div>
        <h2 className="auth-title">Welcome Back</h2>
        <p className="auth-subtitle">Sign in to access your dashboard</p>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" required id="login-email" />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required id="login-password" />
          </div>
          <button type="submit" className="auth-submit" disabled={loading} id="login-submit">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="auth-footer">
          Don&apos;t have an account? <Link to="/register">Create one</Link>
        </p>

        <div className="auth-demo-info">
          <strong>Demo Credentials</strong>
          Admin: admin@inventory.com / admin123<br />
          Manager: manager@inventory.com / manager123
        </div>
      </div>
    </div>
    </AnimatedPage>
  );
}
