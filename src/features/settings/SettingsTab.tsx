import { useState } from 'react';
import { useSettings } from '../../hooks/useQueries';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { Moon, Sun, Monitor, Bell, Shield, User, Mail, Lock, Key, Trash2, AlertTriangle, Save, Loader2 } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import ConfirmModal from '../../components/ui/ConfirmModal';
import CustomSelect from '../../components/ui/CustomSelect';

const AI_TONES = ['Analytical & Direct', 'Supportive & Encouraging', 'Concise & Action-Oriented', 'Deep & Philosophical', 'Playful & Witty'];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'JPY', 'CNY'];
const TIMEZONES = ['UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Tokyo', 'Asia/Singapore', 'Australia/Sydney'];

export function SettingsTab({ user }: { user: any }) {
  const { settings, isLoading, updateSettings, deleteAccount, resetData } = useSettings();
  const { themeMode, setThemeMode } = useAuthStore();
  const [activeSection, setActiveSection] = useState<'profile' | 'appearance' | 'ai' | 'reminders' | 'advanced' | 'danger'>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    timezone: user?.timezone || 'UTC',
    currency: user?.currency || 'USD',
    ai_name: user?.ai_name || 'AI',
    ai_provider: user?.ai_provider || 'gemini',
    gemini_api_key: user?.gemini_api_key || '',
    groq_api_key: user?.groq_api_key || '',
    ai_tone: user?.ai_tone || 'Analytical & Direct',
    morning_audit: user?.morning_audit !== false,
    smart_alerts: user?.smart_alerts !== false,
    auto_open_ai_sidechat: user?.auto_open_ai_sidechat !== false,
    week_start_day: user?.week_start_day || 'Monday',
    sync_to_cloud: user?.sync_to_cloud !== false,
    reminders_global_enabled: user?.reminders_global_enabled !== false,
    sleep_reminder_enabled: user?.sleep_reminder_enabled !== false,
    sleep_reminder_time: user?.sleep_reminder_time || '22:00',
    workout_reminder_enabled: user?.workout_reminder_enabled !== false,
    workout_reminder_time: user?.workout_reminder_time || '07:00',
    workout_reminder_repeat: user?.workout_reminder_repeat || '{"type":"daily"}',
    summary_reminder_enabled: user?.summary_reminder_enabled !== false,
    summary_reminder_time: user?.summary_reminder_time || '07:00',
    water_reminder_enabled: user?.water_reminder_enabled !== false,
    water_reminder_start: user?.water_reminder_start || '08:00',
    water_reminder_end: user?.water_reminder_end || '22:00',
    water_reminder_interval: user?.water_reminder_interval || 60,
    water_target_goal: user?.water_target_goal || 2.5,
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings(formData);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const sections = [
    { key: 'profile', label: 'Profile', icon: User },
    { key: 'appearance', label: 'Appearance', icon: Monitor },
    { key: 'ai', label: 'AI Coach', icon: Bot },
    { key: 'reminders', label: 'Reminders', icon: Bell },
    { key: 'advanced', label: 'Advanced', icon: Shield },
    { key: 'danger', label: 'Danger Zone', icon: AlertTriangle },
  ];

  if (isLoading) return <div className="loading-state">Loading settings...</div>;

  return (
    <div className="settings-tab">
      <div className="tab-header">
        <h2 className="tab-title">Settings</h2>
        <p className="tab-subtitle">Customize your LifeAgent experience</p>
      </div>

      <div className="settings-layout">
        <nav className="settings-sidebar" aria-label="Settings sections">
          {sections.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              className={`settings-nav-item ${activeSection === key ? 'active' : ''}`}
              onClick={() => setActiveSection(key)}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="settings-content">
          {activeSection === 'profile' && (
            <SettingsSection title="Profile" description="Manage your personal information">
              <div className="form-field">
                <label htmlFor="name">Name</label>
                <input id="name" type="text" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} />
              </div>
              <div className="form-field">
                <label htmlFor="email">Email</label>
                <input id="email" type="email" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} disabled />
              </div>
              <div className="form-field">
                <label htmlFor="phone">Phone (optional)</label>
                <input id="phone" type="tel" value={formData.phone} onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))} />
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="timezone">Timezone</label>
                  <CustomSelect id="timezone" value={formData.timezone} onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))} options={TIMEZONES.map(tz => ({ value: tz, label: tz }))} />
                </div>
                <div className="form-field">
                  <label htmlFor="currency">Currency</label>
                  <CustomSelect id="currency" value={formData.currency} onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))} options={CURRENCIES.map(c => ({ value: c, label: c }))} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="week_start_day">Week Starts On</label>
                  <CustomSelect id="week_start_day" value={formData.week_start_day} onChange={(e) => setFormData(prev => ({ ...prev, week_start_day: e.target.value }))} options={['Monday', 'Sunday'].map(d => ({ value: d, label: d }))} />
                </div>
              </div>
            </SettingsSection>
          )}

          {activeSection === 'appearance' && (
            <SettingsSection title="Appearance" description="Customize how LifeAgent looks">
              <div className="setting-group">
                <h4>Theme</h4>
                <div className="theme-options">
                  {['dark', 'light', 'pc'].map((mode) => (
                    <button
                      key={mode}
                      className={`theme-option ${themeMode === mode ? 'active' : ''}`}
                      onClick={() => setThemeMode(mode as any)}
                    >
                      {mode === 'dark' && <Moon size={20} />}
                      {mode === 'light' && <Sun size={20} />}
                      {mode === 'pc' && <Monitor size={20} />}
                      <span>{mode.charAt(0).toUpperCase() + mode.slice(1)}</span>
                    </button>
                  ))}
                </div>
              </div>
            </SettingsSection>
          )}

          {activeSection === 'ai' && (
            <SettingsSection title="AI Coach" description="Configure your AI assistant">
              <div className="form-field">
                <label htmlFor="ai_name">AI Name</label>
                <input id="ai_name" type="text" value={formData.ai_name} onChange={(e) => setFormData(prev => ({ ...prev, ai_name: e.target.value }))} />
              </div>
              <div className="form-field">
                <label htmlFor="ai_provider">Provider</label>
                <CustomSelect id="ai_provider" value={formData.ai_provider} onChange={(e) => setFormData(prev => ({ ...prev, ai_provider: e.target.value }))} options={[{ value: 'gemini', label: 'Google Gemini' }, { value: 'groq', label: 'Groq' }]} />
              </div>
              <div className="form-field">
                <label htmlFor="ai_tone">Tone</label>
                <CustomSelect id="ai_tone" value={formData.ai_tone} onChange={(e) => setFormData(prev => ({ ...prev, ai_tone: e.target.value }))} options={AI_TONES.map(t => ({ value: t, label: t }))} />
              </div>
              {formData.ai_provider === 'gemini' && (
                <div className="form-field">
                  <label htmlFor="gemini_api_key">Gemini API Key</label>
                  <input id="gemini_api_key" type="password" value={formData.gemini_api_key} onChange={(e) => setFormData(prev => ({ ...prev, gemini_api_key: e.target.value }))} placeholder="Enter your API key" />
                </div>
              )}
              {formData.ai_provider === 'groq' && (
                <div className="form-field">
                  <label htmlFor="groq_api_key">Groq API Key</label>
                  <input id="groq_api_key" type="password" value={formData.groq_api_key} onChange={(e) => setFormData(prev => ({ ...prev, groq_api_key: e.target.value }))} placeholder="Enter your API key" />
                </div>
              )}
            </SettingsSection>
          )}

          {activeSection === 'reminders' && (
            <SettingsSection title="Reminders" description="Configure notifications and reminders">
              <div className="setting-group">
                <label className="toggle-label">
                  <input type="checkbox" checked={formData.reminders_global_enabled} onChange={(e) => setFormData(prev => ({ ...prev, reminders_global_enabled: e.target.checked }))} />
                  <span>Enable All Reminders</span>
                </label>
              </div>
              <div className="setting-group">
                <h4>Daily Habit Check-in (7 PM)</h4>
                <label className="toggle-label">
                  <input type="checkbox" checked={formData.sleep_reminder_enabled} onChange={(e) => setFormData(prev => ({ ...prev, sleep_reminder_enabled: e.target.checked }))} />
                  <span>Enabled</span>
                </label>
                <div className="form-field">
                  <label htmlFor="sleep_reminder_time">Time</label>
                  <input id="sleep_reminder_time" type="time" value={formData.sleep_reminder_time} onChange={(e) => setFormData(prev => ({ ...prev, sleep_reminder_time: e.target.value }))} />
                </div>
              </div>
              <div className="setting-group">
                <h4>Water Reminders</h4>
                <label className="toggle-label">
                  <input type="checkbox" checked={formData.water_reminder_enabled} onChange={(e) => setFormData(prev => ({ ...prev, water_reminder_enabled: e.target.checked }))} />
                  <span>Enabled</span>
                </label>
                <div className="form-row">
                  <div className="form-field">
                    <label htmlFor="water_reminder_start">Start</label>
                    <input id="water_reminder_start" type="time" value={formData.water_reminder_start} onChange={(e) => setFormData(prev => ({ ...prev, water_reminder_start: e.target.value }))} />
                  </div>
                  <div className="form-field">
                    <label htmlFor="water_reminder_end">End</label>
                    <input id="water_reminder_end" type="time" value={formData.water_reminder_end} onChange={(e) => setFormData(prev => ({ ...prev, water_reminder_end: e.target.value }))} />
                  </div>
                </div>
                <div className="form-field">
                  <label htmlFor="water_reminder_interval">Interval (minutes)</label>
                  <input id="water_reminder_interval" type="number" value={formData.water_reminder_interval} onChange={(e) => setFormData(prev => ({ ...prev, water_reminder_interval: Number(e.target.value) }))} min="15" max="240" />
                </div>
                <div className="form-field">
                  <label htmlFor="water_target_goal">Daily Goal (L)</label>
                  <input id="water_target_goal" type="number" step="0.1" value={formData.water_target_goal} onChange={(e) => setFormData(prev => ({ ...prev, water_target_goal: Number(e.target.value) }))} min="0.5" max="10" />
                </div>
              </div>
            </SettingsSection>
          )}

          {activeSection === 'advanced' && (
            <SettingsSection title="Advanced" description="Advanced settings and preferences">
              <div className="setting-group">
                <label className="toggle-label">
                  <input type="checkbox" checked={formData.morning_audit} onChange={(e) => setFormData(prev => ({ ...prev, morning_audit: e.target.checked }))} />
                  <span>Morning Audit</span>
                </label>
              </div>
              <div className="setting-group">
                <label className="toggle-label">
                  <input type="checkbox" checked={formData.smart_alerts} onChange={(e) => setFormData(prev => ({ ...prev, smart_alerts: e.target.checked }))} />
                  <span>Smart Alerts</span>
                </label>
              </div>
              <div className="setting-group">
                <label className="toggle-label">
                  <input type="checkbox" checked={formData.auto_open_ai_sidechat} onChange={(e) => setFormData(prev => ({ ...prev, auto_open_ai_sidechat: e.target.checked }))} />
                  <span>Auto-open AI Chat</span>
                </label>
              </div>
              <div className="setting-group">
                <label className="toggle-label">
                  <input type="checkbox" checked={formData.sync_to_cloud} onChange={(e) => setFormData(prev => ({ ...prev, sync_to_cloud: e.target.checked }))} />
                  <span>Sync to Cloud</span>
                </label>
              </div>
            </SettingsSection>
          )}

          {activeSection === 'danger' && (
            <SettingsSection title="Danger Zone" description="Irreversible actions">
              <div className="danger-actions">
                <div className="danger-item">
                  <div className="danger-info">
                    <h4>Reset All Data</h4>
                    <p>Clear all your data but keep your account. This cannot be undone.</p>
                  </div>
                  <button onClick={() => setShowResetModal(true)} className="secondary-btn">Reset Data</button>
                </div>
                <div className="danger-item">
                  <div className="danger-info">
                    <h4>Delete Account</h4>
                    <p>Permanently delete your account and all data. This cannot be undone.</p>
                  </div>
                  <button onClick={() => setShowDeleteModal(true)} className="contrast-btn">Delete Account</button>
                </div>
              </div>
            </SettingsSection>
          )}

          <div className="settings-actions">
            <button onClick={handleSave} className="blue-btn" disabled={isSaving}>
              {isSaving ? <Loader2 size={18} className="spin" /> : <><Save size={18} /> Save Changes</>}
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={async () => { await resetData(); setShowResetModal(false); }}
        title="Reset All Data"
        message="This will delete all your habits, transactions, workouts, sleep logs, notes, and events. Your account will remain. Are you sure?"
        confirmText="Reset Everything"
        confirmClass="contrast-btn"
        icon="danger"
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={async () => { await deleteAccount(); setShowDeleteModal(false); }}
        title="Delete Account"
        message="This will permanently delete your account and ALL data. This action is irreversible. Are you absolutely sure?"
        confirmText="Delete My Account"
        confirmClass="contrast-btn"
        icon="danger"
      />
    </div>
  );
}

function SettingsSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="settings-section">
      <div className="section-header">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <div className="section-content">
        {children}
      </div>
    </div>
  );
}

// Need to import Bot
import { Bot } from 'lucide-react';