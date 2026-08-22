import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { api } from '../services/api';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Loader2, KeyRound, CheckCircle2, ArrowLeft } from 'lucide-react';

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setToken, setUser } = useAuthStore();
  
  const isLogin = location.pathname.includes('/login');
  const [authMode, setAuthMode] = useState<'normal' | 'forgot'>('normal');
  const [resetStep, setResetStep] = useState<1 | 2 | 3>(1);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Reset states
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      let result;
      if (isLogin) {
        result = await api.auth.login(email, password);
      } else {
        if (!name.trim()) {
          setError('Please enter your name');
          setIsLoading(false);
          return;
        }
        result = await api.auth.register({ name, email, password });
      }

      setToken(result.token);
      setUser(result.user);
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return setError('Please enter your email address');
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const res = await api.auth.forgotPassword(resetEmail.trim());
      setSuccessMsg(res.message || '6-digit reset code sent to your email.');
      setResetStep(2);
    } catch (err: any) {
      setError(err.message || 'Account not found');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetCode.trim()) return setError('Please enter the 6-digit reset code');
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const res = await api.auth.verifyResetCode(resetEmail.trim(), resetCode.trim());
      setSuccessMsg(res.message || 'Reset code verified!');
      setResetStep(3);
    } catch (err: any) {
      setError(err.message || 'Invalid or expired code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) return setError('Password must be at least 6 characters');
    if (newPassword !== confirmPassword) return setError('Passwords do not match');
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const res = await api.auth.resetPassword(resetEmail.trim(), resetCode.trim(), newPassword);
      setSuccessMsg(res.message || 'Password reset successfully! Returning to sign in...');
      setTimeout(() => {
        setAuthMode('normal');
        setResetStep(1);
        setResetEmail('');
        setResetCode('');
        setNewPassword('');
        setConfirmPassword('');
        setSuccessMsg('');
        navigate('/login');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemo = async () => {
    setIsLoading(true);
    try {
      const result = await api.auth.login('demo@lifeagent.app', 'demo123');
      setToken(result.token);
      setUser(result.user);
      navigate('/dashboard', { replace: true });
    } catch {
      setError('Demo account not available');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">LifeAgent</h1>
          <p className="auth-subtitle">
            {authMode === 'forgot'
              ? 'Reset your password'
              : (isLogin ? 'Welcome back' : 'Create your account')}
          </p>
        </div>

        {error && <div className="auth-error">{error}</div>}
        {successMsg && (
          <div className="auth-error" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
            <CheckCircle2 size={16} /> {successMsg}
          </div>
        )}

        {authMode === 'forgot' ? (
          resetStep === 1 ? (
            <form onSubmit={handleForgotPassword} className="auth-form">
              <div className="auth-field">
                <label htmlFor="reset-email" className="auth-label">Email or Username</label>
                <div className="auth-input-wrapper">
                  <Mail className="auth-input-icon" />
                  <input
                    id="reset-email"
                    type="text"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="auth-input"
                    required
                    autoFocus
                  />
                </div>
              </div>
              <button type="submit" className="auth-submit blue-btn" disabled={isLoading}>
                {isLoading ? <><Loader2 className="auth-spinner" size={18} /> Sending...</> : 'Send Reset Code'}
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('normal'); setError(''); setSuccessMsg(''); }}
                className="secondary-btn"
                style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <ArrowLeft size={16} /> Back to Sign In
              </button>
            </form>
          ) : resetStep === 2 ? (
            <form onSubmit={handleVerifyCode} className="auth-form">
              <div className="auth-field">
                <label htmlFor="reset-code" className="auth-label">6-Digit Reset Code</label>
                <div className="auth-input-wrapper">
                  <KeyRound className="auth-input-icon" />
                  <input
                    id="reset-code"
                    type="text"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    placeholder="123456"
                    className="auth-input"
                    required
                    autoFocus
                    style={{ letterSpacing: '4px', textAlign: 'center', fontFamily: "'DM Mono', monospace" }}
                  />
                </div>
              </div>
              <button type="submit" className="auth-submit blue-btn" disabled={isLoading}>
                {isLoading ? <><Loader2 className="auth-spinner" size={18} /> Verifying...</> : 'Verify Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="auth-form">
              <div className="auth-field">
                <label htmlFor="new-pw" className="auth-label">New Password</label>
                <div className="auth-input-wrapper">
                  <Lock className="auth-input-icon" />
                  <input
                    id="new-pw"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="auth-input"
                    required
                    autoFocus
                  />
                </div>
              </div>
              <div className="auth-field">
                <label htmlFor="confirm-pw" className="auth-label">Confirm Password</label>
                <div className="auth-input-wrapper">
                  <Lock className="auth-input-icon" />
                  <input
                    id="confirm-pw"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="auth-input"
                    required
                  />
                </div>
              </div>
              <button type="submit" className="auth-submit blue-btn" disabled={isLoading}>
                {isLoading ? <><Loader2 className="auth-spinner" size={18} /> Saving...</> : 'Save New Password'}
              </button>
            </form>
          )
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            {!isLogin && (
              <div className="auth-field">
                <label htmlFor="name" className="auth-label">Name</label>
                <div className="auth-input-wrapper">
                  <User className="auth-input-icon" />
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="auth-input"
                    required
                    autoComplete="name"
                  />
                </div>
              </div>
            )}

            <div className="auth-field">
              <label htmlFor="email" className="auth-label">Email</label>
              <div className="auth-input-wrapper">
                <Mail className="auth-input-icon" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="auth-input"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="auth-field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="password" className="auth-label">Password</label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => { setAuthMode('forgot'); setResetStep(1); setError(''); setSuccessMsg(''); setResetEmail(email); }}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="auth-input-wrapper">
                <Lock className="auth-input-icon" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="auth-input"
                  required
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="auth-toggle-password"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="auth-submit blue-btn" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="auth-spinner" size={18} />
                  <span>{isLogin ? 'Signing in...' : 'Creating account...'}</span>
                </>
              ) : (
                <>
                  <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        )}

        {authMode === 'normal' && (
          <>
            <div className="auth-divider">
              <span>or</span>
            </div>

            <button onClick={handleDemo} className="auth-demo secondary-btn" disabled={isLoading}>
              Try Demo Account
            </button>

            <p className="auth-switch">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}
              <button
                onClick={() => { navigate(isLogin ? '/auth' : '/login'); setError(''); }}
                className="auth-switch-link"
              >
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}