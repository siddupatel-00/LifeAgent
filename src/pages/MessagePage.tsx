import { useState } from 'react';
import { Send, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export default function MessagePage() {
  const [activeForm, setActiveForm] = useState<'contact' | 'waitlist'>('contact');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    setError('');

    try {
      if (activeForm === 'contact') {
        await api.founder.submitMessage(formData);
      } else {
        await api.founder.waitlist({ name: formData.name, email: formData.email });
      }
      setStatus('success');
      setFormData({ name: '', email: '', message: '' });
    } catch (err: any) {
      setStatus('error');
      setError(err.message || 'Submission failed. Please try again.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const isWaitlist = window.location.pathname.includes('/waitlist');

  return (
    <div className="message-page">
      <div className="message-container">
        <div className="message-card">
          <div className="message-header">
            <h1 className="message-title">
              {isWaitlist ? 'Join the Waitlist' : 'Drop a Message'}
            </h1>
            <p className="message-subtitle">
              {isWaitlist 
                ? 'Be the first to know when we launch new features'
                : "We'd love to hear from you. Send us a note and we'll get back to you."}
            </p>
          </div>

          {status === 'success' && (
            <div className="success-message">
              <CheckCircle2 size={24} style={{ color: 'var(--accent-blue)' }} />
              <span>{isWaitlist ? 'You\'re on the list!' : 'Message sent successfully!'}</span>
            </div>
          )}

          {status === 'error' && (
            <div className="error-message">
              <AlertCircle size={24} style={{ color: 'var(--orange)' }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="message-form">
            <div className="form-field">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your name"
                required
                disabled={status === 'submitting'}
              />
            </div>

            <div className="form-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                disabled={status === 'submitting'}
              />
            </div>

            {!isWaitlist && (
              <div className="form-field">
                <label htmlFor="message">Message</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="What's on your mind?"
                  rows={5}
                  required
                  disabled={status === 'submitting'}
                />
              </div>
            )}

            <button type="submit" className="blue-btn message-submit" disabled={status === 'submitting'}>
              {status === 'submitting' ? (
                <>
                  <Loader2 size={18} className="spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send size={18} />
                  <span>{isWaitlist ? 'Join Waitlist' : 'Send Message'}</span>
                </>
              )}
            </button>
          </form>

          <div className="message-footer">
            <p>Have questions? Check our <a href="/faq" target="_blank" rel="noopener noreferrer">FAQ</a> or email us directly at <a href="mailto:hello@lifeagent.app">hello@lifeagent.app</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}