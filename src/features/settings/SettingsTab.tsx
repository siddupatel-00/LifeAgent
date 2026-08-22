import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../../hooks/useQueries';
import { api } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { Moon, Sun, Monitor, Bell, Shield, User, AlertTriangle, Save, Loader2, Check, Trash2 } from 'lucide-react';
import ConfirmModal from '../../components/ui/ConfirmModal';
import CustomSelect from '../../components/ui/CustomSelect';
import { Bot } from 'lucide-react';

const AI_TONES = ['Analytical & Direct', 'Supportive & Encouraging', 'Concise & Action-Oriented', 'Deep & Philosophical', 'Playful & Witty'];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'JPY', 'CNY'];
const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Dubai', 'Asia/Kolkata',
  'Asia/Tokyo', 'Asia/Singapore', 'Australia/Sydney',
];

type SectionKey = 'profile' | 'appearance' | 'ai' | 'reminders' | 'advanced' | 'danger';

interface SettingsForm {
  name: string;
  phone: string;
  timezone: string;
  currency: string;
  week_start_day: string;
  ai_name: string;
  ai_provider: string;
  gemini_api_key: string;
  groq_api_key: string;
  ai_tone: string;
  morning_audit: boolean;
  smart_alerts: boolean;
  sync_to_cloud: boolean;
  reminders_global_enabled: boolean;
  sleep_reminder_enabled: boolean;
  sleep_reminder_time: string;
  workout_reminder_enabled: boolean;
  workout_reminder_time: string;
  summary_reminder_enabled: boolean;
  summary_reminder_time: string;
  water_target_goal: number;
  water_reminder_enabled: boolean;
  water_reminder_start: string;
  water_reminder_end: string;
  water_reminder_interval: number;
}

const DEFAULT_FORM: SettingsForm = {
  name: '',
  phone: '',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  currency: 'USD',
  week_start_day: 'Monday',
  ai_name: 'AI',
  ai_provider: 'gemini',
  gemini_api_key: '',
  groq_api_key: '',
  ai_tone: 'Analytical & Direct',
  morning_audit: true,
  smart_alerts: true,
  sync_to_cloud: true,
  reminders_global_enabled: true,
  sleep_reminder_enabled: false,
  sleep_reminder_time: '22:00',
  workout_reminder_enabled: false,
  workout_reminder_time: '07:00',
  summary_reminder_enabled: false,
  summary_reminder_time: '07:00',
  water_target_goal: 2.5,
  water_reminder_enabled: false,
  water_reminder_start: '08:00',
  water_reminder_end: '22:00',
  water_reminder_interval: 60,
};

/** Map server settings payload onto the editable form shape. */
function toFormData(s: any): SettingsForm {
  const flag = (v: unknown, fallback: boolean) => v === undefined || v === null ? fallback : (v === 1 || v === true || v === '1');
  return {
    name: s?.name ?? '',
    phone: s?.phone ?? '',
    timezone: s?.timezone && s.timezone !== 'UTC' ? s.timezone : (DEFAULT_FORM.timezone),
    currency: s?.currency ?? 'USD',
    week_start_day: s?.week_start_day ?? 'Monday',
    ai_name: s?.ai_name ?? 'AI',
    ai_provider: s?.ai_provider ?? 'gemini',
    // Only overwrite keys when the server actually returned them (avoids clobbering)
    gemini_api_key: s?.gemini_api_key ?? '',
    groq_api_key: s?.groq_api_key ?? '',
    ai_tone: s?.ai_tone ?? 'Analytical & Direct',
    morning_audit: flag(s?.morning_audit ?? s?.morningAudit, true),
    smart_alerts: flag(s?.smart_alerts ?? s?.smartAlerts, true),
    sync_to_cloud: flag(s?.sync_to_cloud ?? s?.syncToCloud, true),
    reminders_global_enabled: flag(s?.reminders_global_enabled ?? s?.remindersGlobalEnabled, true),
    sleep_reminder_enabled: flag(s?.sleep_reminder_enabled ?? s?.sleepReminderEnabled, false),
    sleep_reminder_time: s?.sleep_reminder_time ?? '22:00',
    workout_reminder_enabled: flag(s?.workout_reminder_enabled ?? s?.workoutReminderEnabled, false),
    workout_reminder_time: s?.workout_reminder_time ?? '07:00',
    summary_reminder_enabled: flag(s?.summary_reminder_enabled ?? s?.summaryReminderEnabled, false),
    summary_reminder_time: s?.summary_reminder_time ?? '07:00',
    water_target_goal: Number(s?.water_target_goal) > 0 ? Number(s.water_target_goal) : 2.5,
    water_reminder_enabled: flag(s?.water_reminder_enabled ?? s?.waterReminderEnabled, false),
    water_reminder_start: s?.water_reminder_start ?? '08:00',
    water_reminder_end: s?.water_reminder_end ?? '22:00',
    water_reminder_interval: Number(s?.water_reminder_interval) > 0 ? Number(s.water_reminder_interval) : 60,
  };
}

export function SettingsTab() {
  const { settings, isLoading } = useSettings();
  const { themeMode, setThemeMode, logout } = useAuthStore();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<SectionKey>('profile');
  const [formData, setFormData] = useState<SettingsForm>(DEFAULT_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Seed the form once real settings arrive
  useEffect(() => {
    if (settings) {
      setFormData(toFormData(settings));
    }
  }, [settings]);

  const setField = <K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setSaveState('idle');
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveState('idle');
    setSaveError('');
    try {
      await api.settings.update(formData);
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2500);
    } catch (err: any) {
      setSaveState('error');
      setSaveError(err.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await api.settings.deleteAccount();
      logout();
      navigate('/', { replace: true });
    } catch (err: any) {
      setSaveError(err.message || 'Failed to delete account');
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleResetData = async () => {
    setIsDeleting(true);
    try {
      await api.settings.resetData();
      window.location.reload();
    } catch (err: any) {
      setSaveError(err.message || 'Failed to reset data');
      setIsDeleting(false);
      setShowResetModal(false);
    }
  };

  const sections: { key: SectionKey; label: string; icon: any }[] = [
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
                <input id="name" type="text" value={formData.name} onChange={(e) => setField('name', e.target.value)} />
              </div>
              <div className="form-field">
                <label htmlFor="email">Email</label>
                <input id="email" type="email" value={settings?.email || ''} disabled />
              </div>
              <div className="form-field">
                <label htmlFor="phone">Phone (optional)</label>
                <input id="phone" type="tel" value={formData.phone} onChange={(e) => setField('phone', e.target.value)} />
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="timezone">Timezone</label>
                  <CustomSelect id="timezone" value={formData.timezone} onChange={(e) => setField('timezone', e.target.value)} options={TIMEZONES.map(tz => ({ value: tz, label: tz }))} />
                </div>
                <div className="form-field">
                  <label htmlFor="currency">Currency</label>
                  <CustomSelect id="currency" value={formData.currency} onChange={(e) => setField('currency', e.target.value)} options={CURRENCIES.map(c => ({ value: c, label: c }))} />
                </div>
              </div>
              <div className="form-field">
                <label htmlFor="week_start_day">Week Starts On</label>
                <CustomSelect id="week_start_day" value={formData.week_start_day} onChange={(e) => setField('week_start_day', e.target.value)} options={['Monday', 'Sunday'].map(d => ({ value: d, label: d }))} />
              </div>
            </SettingsSection>
          )}

          {activeSection === 'appearance' && (
            <SettingsSection title="Appearance" description="Customize how LifeAgent looks">
              <div className="setting-group">
                <h4>Theme</h4>
                <div className="theme-options">
                  {(['dark', 'light', 'pc'] as const).map((mode) => (
                    <button
                      key={mode}
                      className={`theme-option ${themeMode === mode ? 'active' : ''}`}
                      onClick={() => setThemeMode(mode)}
                    >
                      {mode === 'dark' && <Moon size={20} />}
                      {mode === 'light' && <Sun size={20} />}
                      {mode === 'pc' && <Monitor size={20} />}
                      <span>{mode === 'pc' ? 'System' : mode.charAt(0).toUpperCase() + mode.slice(1)}</span>
                    </button>
                  ))}
                </div>
              </div>
            </SettingsSection>
          )}

          {activeSection === 'ai' && (
            <SettingsSection title="AI Coach" description="Configure your AI assistant">
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="ai_name">AI Name</label>
                  <input id="ai_name" type="text" value={formData.ai_name} onChange={(e) => setField('ai_name', e.target.value)} />
                </div>
                <div className="form-field">
                  <label htmlFor="ai_provider">Provider</label>
                  <CustomSelect id="ai_provider" value={formData.ai_provider} onChange={(e) => setField('ai_provider', e.target.value)} options={[{ value: 'gemini', label: 'Google Gemini' }, { value: 'groq', label: 'Groq' }]} />
                </div>
              </div>
              <div className="form-field">
                <label htmlFor="ai_tone">Tone</label>
                <CustomSelect id="ai_tone" value={formData.ai_tone} onChange={(e) => setField('ai_tone', e.target.value)} options={AI_TONES.map(t => ({ value: t, label: t }))} />
              </div>
              {formData.ai_provider === 'gemini' && (
                <div className="form-field">
                  <label htmlFor="gemini_api_key">Gemini API Key</label>
                  <input id="gemini_api_key" type="password" autoComplete="off" value={formData.gemini_api_key} onChange={(e) => setField('gemini_api_key', e.target.value)} placeholder="Enter your Gemini API key" />
                  <small className="field-hint">Stored securely on the server — used there for chat, never exposed to other apps.</small>
                </div>
              )}
              {formData.ai_provider === 'groq' && (
                <div className="form-field">
                  <label htmlFor="groq_api_key">Groq API Key</label>
                  <input id="groq_api_key" type="password" autoComplete="off" value={formData.groq_api_key} onChange={(e) => setField('groq_api_key', e.target.value)} placeholder="Enter your Groq API key" />
                  <small className="field-hint">Stored securely on the server — used there for chat.</small>
                </div>
              )}
            </SettingsSection>
          )}

          {activeSection === 'reminders' && (
            <SettingsSection title="Reminders" description="Configure notifications and reminders">
              <div className="setting-group">
                <ToggleField
                  label="Enable All Reminders"
                  checked={formData.reminders_global_enabled}
                  onChange={(v) => setField('reminders_global_enabled', v)}
                />
              </div>

              <div className="setting-group">
                <h4>Water Reminders</h4>
                <ToggleField
                  label="Enabled"
                  checked={formData.water_reminder_enabled}
                  onChange={(v) => setField('water_reminder_enabled', v)}
                />
                {formData.water_reminder_enabled && (
                  <>
                    <div className="form-row">
                      <div className="form-field">
                        <label htmlFor="water_reminder_start">Start</label>
                        <input id="water_reminder_start" type="time" value={formData.water_reminder_start} onChange={(e) => setField('water_reminder_start', e.target.value)} />
                      </div>
                      <div className="form-field">
                        <label htmlFor="water_reminder_end">End</label>
                        <input id="water_reminder_end" type="time" value={formData.water_reminder_end} onChange={(e) => setField('water_reminder_end', e.target.value)} />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-field">
                        <label htmlFor="water_reminder_interval">Interval (min)</label>
                        <input id="water_reminder_interval" type="number" value={formData.water_reminder_interval} onChange={(e) => setField('water_reminder_interval', Number(e.target.value))} min="15" max="240" />
                      </div>
                      <div className="form-field">
                        <label htmlFor="water_target_goal">Daily Goal (L)</label>
                        <input id="water_target_goal" type="number" step="0.1" value={formData.water_target_goal} onChange={(e) => setField('water_target_goal', Number(e.target.value))} min="0.5" max="10" />
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="setting-group">
                <h4>Sleep Reminder</h4>
                <ToggleField
                  label="Enabled"
                  checked={formData.sleep_reminder_enabled}
                  onChange={(v) => setField('sleep_reminder_enabled', v)}
                />
                {formData.sleep_reminder_enabled && (
                  <div className="form-field">
                    <label htmlFor="sleep_reminder_time">Time</label>
                    <input id="sleep_reminder_time" type="time" value={formData.sleep_reminder_time} onChange={(e) => setField('sleep_reminder_time', e.target.value)} />
                  </div>
                )}
              </div>

              <div className="setting-group">
                <h4>Workout Reminder</h4>
                <ToggleField
                  label="Enabled"
                  checked={formData.workout_reminder_enabled}
                  onChange={(v) => setField('workout_reminder_enabled', v)}
                />
                {formData.workout_reminder_enabled && (
                  <div className="form-field">
                    <label htmlFor="workout_reminder_time">Time</label>
                    <input id="workout_reminder_time" type="time" value={formData.workout_reminder_time} onChange={(e) => setField('workout_reminder_time', e.target.value)} />
                  </div>
                )}
              </div>

              <div className="setting-group">
                <h4>Daily Summary</h4>
                <ToggleField
                  label="Enabled"
                  checked={formData.summary_reminder_enabled}
                  onChange={(v) => setField('summary_reminder_enabled', v)}
                />
                {formData.summary_reminder_enabled && (
                  <div className="form-field">
                    <label htmlFor="summary_reminder_time">Time</label>
                    <input id="summary_reminder_time" type="time" value={formData.summary_reminder_time} onChange={(e) => setField('summary_reminder_time', e.target.value)} />
                  </div>
                )}
              </div>
            </SettingsSection>
          )}

          {activeSection === 'advanced' && (
            <SettingsSection title="Advanced" description="Advanced settings and preferences">
              <div className="setting-group">
                <ToggleField label="Morning Audit" checked={formData.morning_audit} onChange={(v) => setField('morning_audit', v)} />
              </div>
              <div className="setting-group">
                <ToggleField label="Smart Alerts" checked={formData.smart_alerts} onChange={(v) => setField('smart_alerts', v)} />
              </div>
              <div className="setting-group">
                <ToggleField label="Sync to Cloud" checked={formData.sync_to_cloud} onChange={(v) => setField('sync_to_cloud', v)} />
              </div>
            </SettingsSection>
          )}

          {activeSection === 'danger' && (
            <SettingsSection title="Danger Zone" description="Irreversible actions">
              {saveError && activeSection === 'danger' && <div className="form-error">{saveError}</div>}
              <div className="danger-actions">
                <div className="danger-item">
                  <div className="danger-info">
                    <h4><Trash2 size={15} /> Reset All Data</h4>
                    <p>Clear all your data but keep your account. This cannot be undone.</p>
                  </div>
                  <button onClick={() => setShowResetModal(true)} className="secondary-btn">Reset Data</button>
                </div>
                <div className="danger-item">
                  <div className="danger-info">
                    <h4><AlertTriangle size={15} /> Delete Account</h4>
                    <p>Permanently delete your account and all data. This cannot be undone.</p>
                  </div>
                  <button onClick={() => setShowDeleteModal(true)} className="contrast-btn">Delete Account</button>
                </div>
              </div>
            </SettingsSection>
          )}

          {activeSection !== 'danger' && (
            <div className="settings-actions">
              <button onClick={handleSave} className="blue-btn" disabled={isSaving}>
                {isSaving ? (
                  <><Loader2 size={18} className="spin" /> Saving...</>
                ) : saveState === 'saved' ? (
                  <><Check size={18} /> Saved</>
                ) : (
                  <><Save size={18} /> Save Changes</>
                )}
              </button>
              {saveState === 'error' && <span className="form-error inline">{saveError}</span>}
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={handleResetData}
        isLoading={isDeleting}
        title="Reset All Data"
        message="This will delete all your habits, tasks, transactions, workouts, sleep logs, notes, and events. Your account will remain. Are you sure?"
        confirmText="Reset Everything"
        confirmClass="contrast-btn"
        icon="danger"
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
        isLoading={isDeleting}
        title="Delete Account"
        message="This will permanently delete your account and ALL data. This action is irreversible. Are you absolutely sure?"
        confirmText="Delete My Account"
        confirmClass="contrast-btn"
        icon="danger"
      />
    </div>
  );
}

function ToggleField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="toggle-label">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
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

export default SettingsTab;
