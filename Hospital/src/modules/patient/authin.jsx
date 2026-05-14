import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn } from 'lucide-react';
import { api, saveSession } from '../../services/api';
import "../../styles/authin.css";

const AuthIn = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', credentials);
      saveSession(data.data);
      if (data.data.user.role === 'doctor') {
        localStorage.setItem('isDoctorLoggedIn', 'true');
        navigate('/doctor/dashboard');
      } else {
        localStorage.setItem('isLoggedIn', 'true');
        navigate('/patient/dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      {/* Side Panel - Same as AuthUp for consistency */}
      <div className="auth-side-panel">
        <div className="side-content">
          <h1>Welcome <br />Back.</h1>
          <p>Access your personalized health dashboard, check your latest test results, and stay connected with your doctors.</p>
        </div>
      </div>

      <div className="auth-form-container">
        <div className="form-card">
          <header className="form-header">
            <h2>Sign In</h2>
            <p>Don't have an account? <Link to="/signup">Patient sign up</Link> or <Link to="/doctor/signup">Doctor sign up</Link></p>
          </header>

          <form onSubmit={handleLogin} className="login-form">
            {error && <p className="form-error">{error}</p>}
            <div className="input-field">
              <label>Email Address</label>
              <div className="input-icon-wrapper">
                <Mail size={18} className="input-icon" />
                <input 
                  name="email"
                  type="email" 
                  placeholder="name@example.com" 
                  required 
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="input-field">
              <div className="label-row">
                <label>Password</label>
                <Link to="/forgot-password" style={{fontSize: '12px', color: 'var(--accent)'}}>Forgot?</Link>
              </div>
              <div className="input-icon-wrapper">
                <Lock size={18} className="input-icon" />
                <input 
                  name="password"
                  type="password" 
                  placeholder="********" 
                  required 
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-options">
              <label className="checkbox-container">
                <input type="checkbox" />
                <span className="checkmark"></span>
                Remember me
              </label>
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Signing in...' : 'Login to Portal'} <LogIn size={18} />
            </button>
          </form>

          <div className="divider">
            <span>Or continue with</span>
          </div>

          <div className="social-login">
            <button className="social-btn" onClick={() => navigate('/signup')}>Google</button>
            <button className="social-btn" onClick={() => navigate('/signup')}>Apple</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthIn;
