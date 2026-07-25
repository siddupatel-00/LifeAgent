import React from 'react';
import { Check, User, Bot, Save, LogOut } from 'lucide-react';

const SettingsPanel = ({
  userProfile,
  setUserProfile,
  aiName,
  setAiName,
  aiProvider,
  setAiProvider,
  geminiApiKey,
  setGeminiApiKey,
  groqApiKey,
  setGroqApiKey,
  themeMode,
  setThemeMode,
  token,
  showToast,
  handleLogout,
  settingsSaved,
  setSettingsSaved,
  chatResetTime,
  setChatResetTime
}) => {
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (token) {
      try {
        const res = await fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ 
            ...userProfile, 
            phone: userProfile.phone || '', 
            timezone: userProfile.timezone || 'UTC', 
            ai_name: aiName, 
            gemini_api_key: geminiApiKey, 
            groq_api_key: groqApiKey, 
            ai_provider: aiProvider, 
            theme: themeMode, 
            currency: userProfile.currency, 
            chat_reset_time: chatResetTime 
          })
        });
        if (res.ok) {
          setSettingsSaved(true);
          showToast('Settings Saved Successfully', 'success');
          setTimeout(() => setSettingsSaved(false), 3000);
        } else {
          console.error('Settings save failed:', res.status);
          showToast('Failed to Save Settings', 'error');
        }
      } catch (err) {
        console.error('Settings save failed:', err);
        showToast('Failed to Save Settings', 'error');
      }
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
        <div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>General Settings & Preferences</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Customize your personal profile details, AI agent behavior, and workspace rules.</p>
        </div>
        {settingsSaved && (
          <span style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', padding: '6px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Check size={16} /> Saved Successfully
          </span>
        )}
      </div>

      <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* SECTION 1: General Profile Details */}
        <div>
          <h4 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-blue)' }}>
            <User size={18} /> General Profile Details
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', background: 'var(--bg-main)', borderRadius: '14px', border: '1px solid var(--border-color)', gap: '20px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>Full Name</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Your primary display name inside the dashboard.</div>
              </div>
              <input 
                type="text" 
                value={userProfile.name || ''} 
                onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })} 
                style={{ width: '320px', padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '0.95rem', fontWeight: 600, outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', background: 'var(--bg-main)', borderRadius: '14px', border: '1px solid var(--border-color)', gap: '20px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>Handle / Username</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Your unique public handle shown in the header.</div>
              </div>
              <input 
                type="text" 
                value={userProfile.handle || ''} 
                onChange={(e) => setUserProfile({ ...userProfile, handle: e.target.value })} 
                style={{ width: '320px', padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '0.95rem', fontWeight: 600, outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', background: 'var(--bg-main)', borderRadius: '14px', border: '1px solid var(--border-color)', gap: '20px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>Email Address</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Used for account notifications and VIP early access alerts.</div>
              </div>
              <input 
                type="email" 
                value={userProfile.email || ''} 
                onChange={(e) => setUserProfile({ ...userProfile, email: e.target.value })} 
                style={{ width: '320px', padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '0.95rem', fontWeight: 600, outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', background: 'var(--bg-main)', borderRadius: '14px', border: '1px solid var(--border-color)', gap: '20px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>Phone Number</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Your contact phone number for SMS notifications and security alerts.</div>
              </div>
              <input 
                type="tel" 
                value={userProfile.phone || ''} 
                placeholder="+1 234 567 8900"
                onChange={(e) => setUserProfile({ ...userProfile, phone: e.target.value })} 
                style={{ width: '320px', padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '0.95rem', fontWeight: 600, outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', background: 'var(--bg-main)', borderRadius: '14px', border: '1px solid var(--border-color)', gap: '20px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>Timezone</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Select your primary timezone for automated audits and reminders.</div>
              </div>
              <select 
                value={userProfile.timezone || 'UTC'} 
                onChange={(e) => setUserProfile({ ...userProfile, timezone: e.target.value })} 
                style={{ width: '320px', padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '0.95rem', fontWeight: 600, outline: 'none' }}
              >
                <option value="UTC">UTC (Coordinated Universal Time)</option>
                <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                <option value="America/New_York">America/New_York (EST -5:00 / EDT -4:00)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (PST -8:00 / PDT -7:00)</option>
                <option value="Europe/London">Europe/London (GMT / BST)</option>
                <option value="Europe/Paris">Europe/Paris (CET +1:00)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (JST +9:00)</option>
                <option value="Australia/Sydney">Australia/Sydney (AEST +10:00)</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', background: 'var(--bg-main)', borderRadius: '14px', border: '1px solid var(--border-color)', gap: '20px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>Currency Preference</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Choose your default currency for the Money Tracker.</div>
              </div>
              <select 
                value={userProfile.currency || '$'} 
                onChange={(e) => setUserProfile({ ...userProfile, currency: e.target.value })} 
                style={{ width: '320px', padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '0.95rem', fontWeight: 600, outline: 'none', appearance: 'none' }}
              >
                <option value="$">Dollar ($)</option>
                <option value="₹">Rupee (₹)</option>
                <option value="€">Euro (€)</option>
                <option value="£">Pound (£)</option>
              </select>
            </div>

          </div>
        </div>

        {/* SECTION 2: AI Agent & Features */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
          <h4 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-blue)' }}>
            <Bot size={18} /> Personal AI Assistant Features
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', background: 'var(--bg-main)', borderRadius: '14px', border: '1px solid var(--border-color)', gap: '20px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>AI Assistant Name</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Customize what your AI friend is called across your entire dashboard (default: AI).</div>
              </div>
              <input 
                type="text" 
                value={aiName} 
                placeholder="Enter assistant name..."
                onChange={(e) => setAiName(e.target.value || 'AI')} 
                style={{ width: '320px', padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '0.95rem', fontWeight: 600, outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', background: 'var(--bg-main)', borderRadius: '14px', border: '1px solid var(--border-color)', gap: '20px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>Preferred AI Provider</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Choose which AI brain powers your dashboard assistant.</div>
              </div>
              <select 
                value={aiProvider} 
                onChange={(e) => setAiProvider(e.target.value)} 
                style={{ width: '320px', padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '0.95rem', fontWeight: 600, outline: 'none', appearance: 'none' }}
              >
                <option value="gemini">Google Gemini</option>
                <option value="groq">Groq (Llama 3)</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', background: 'var(--bg-main)', borderRadius: '14px', border: '1px solid var(--border-color)', gap: '20px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>AI Chat Reset Time</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Choose when your daily AI chat history resets.</div>
              </div>
              <select 
                value={chatResetTime} 
                onChange={(e) => setChatResetTime(e.target.value)} 
                style={{ width: '320px', padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '0.95rem', fontWeight: 600, outline: 'none', appearance: 'none' }}
              >
                <option value="00:00">12:00 AM (Midnight)</option>
                <option value="06:00">6:00 AM</option>
              </select>
            </div>


            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', background: 'var(--bg-main)', borderRadius: '14px', border: '1px solid var(--border-color)', gap: '20px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>Gemini API Key</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Enter your free Google Gemini API key to enable real AI responses. Get one at aistudio.google.com</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input 
                  type="password" 
                  value={geminiApiKey} 
                  placeholder="AIzaSy..."
                  onChange={(e) => setGeminiApiKey(e.target.value)} 
                  style={{ width: '320px', padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '0.95rem', fontWeight: 600, outline: 'none' }}
                />
                {geminiApiKey && <span style={{ color: '#22c55e', fontWeight: 700, fontSize: '0.85rem' }}>● Connected</span>}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', background: 'var(--bg-main)', borderRadius: '14px', border: '1px solid var(--border-color)', gap: '20px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>Groq API Key</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Enter your free Groq API key for ultra-fast Llama 3 responses. Get one at console.groq.com</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input 
                  type="password" 
                  value={groqApiKey} 
                  placeholder="gsk_..."
                  onChange={(e) => setGroqApiKey(e.target.value)} 
                  style={{ width: '320px', padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '0.95rem', fontWeight: 600, outline: 'none' }}
                />
                {groqApiKey && <span style={{ color: '#22c55e', fontWeight: 700, fontSize: '0.85rem' }}>● Connected</span>}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', background: 'var(--bg-main)', borderRadius: '14px', border: '1px solid var(--border-color)', gap: '20px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>Daily Morning Audit Summary</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>AI automatically generates a schedule & spendings audit every morning at 7:00 AM.</div>
              </div>
              <input 
                type="checkbox" 
                checked={userProfile.morningAudit} 
                onChange={(e) => setUserProfile({ ...userProfile, morningAudit: e.target.checked })}
                style={{ width: '22px', height: '22px', accentColor: 'var(--accent-blue)', cursor: 'pointer' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', background: 'var(--bg-main)', borderRadius: '14px', border: '1px solid var(--border-color)', gap: '20px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>Real-Time Smart Streak Alerts</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Notify instantly when a study pomodoro or gym habit streak is about to expire.</div>
              </div>
              <input 
                type="checkbox" 
                checked={userProfile.smartAlerts} 
                onChange={(e) => setUserProfile({ ...userProfile, smartAlerts: e.target.checked })}
                style={{ width: '22px', height: '22px', accentColor: 'var(--accent-blue)', cursor: 'pointer' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', background: 'var(--bg-main)', borderRadius: '14px', border: '1px solid var(--border-color)', gap: '20px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>Personal AI Assistant Tone & Personality</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Choose how strict, encouraging, or concise the AI audits your metrics.</div>
              </div>
              <select 
                value={userProfile.aiTone}
                onChange={(e) => setUserProfile({ ...userProfile, aiTone: e.target.value })}
                style={{ width: '320px', padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '0.92rem', fontWeight: 600, outline: 'none', cursor: 'pointer' }}
              >
                <option value="Analytical & Direct">Analytical & Direct</option>
                <option value="Encouraging & Supportive">Encouraging & Supportive</option>
                <option value="Minimalist Executive">Minimalist Executive</option>
              </select>
            </div>

          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
          <button type="submit" className="blue-btn" style={{ padding: '14px 28px' }}>
            <Save size={18} /> Save Changes
          </button>
        </div>

      </form>

      {/* DOWN BELOW: LOGOUT OPTION AS REQUESTED */}
      <div style={{ marginTop: '48px', borderTop: '2px dashed var(--border-color)', paddingTop: '32px' }}>
        <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ef4444', marginBottom: '8px' }}>
          Account Session
        </h4>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '20px' }}>
          Logging out will close your active dashboard session and return you to the public storefront.
        </p>
        <button 
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '14px 24px', borderRadius: '14px',
            border: '1px solid #ef4444', background: 'rgba(239, 68, 68, 0.1)',
            color: '#ef4444', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <LogOut size={18} /> Log Out of LifeAgent
        </button>
      </div>

      {/* LIFEAGENT V2.4 FOOTER INSIDE SETTINGS */}
      <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid var(--border-color)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, opacity: 0.8 }}>
        LifeAgent v2.4 • Pro Edition
      </div>

    </div>
  );
};

export default SettingsPanel;
