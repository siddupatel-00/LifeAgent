import { safeStorage } from '../utils/safeStorage';
import React, { useState } from 'react';
import TimeButton from './TimeButton';
import { Check, User, Bot, Save, LogOut, AlertTriangle, Bell } from 'lucide-react';
import CustomSelect from './CustomSelect';
import ConfirmModal from './ConfirmModal';
import { getApiUrl } from '../utils/apiConfig';
import { regenerateAllReminders } from '../utils/reminderScheduler';

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
  setChatResetTime,
  onResetAllAccountData,
  onDeleteAccount,
  habits = [],
  calendarEvents = []
}) => {
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmReset = async () => {
    setIsResetting(true);
    try {
      if (onResetAllAccountData) {
        await onResetAllAccountData();
      }
    } catch (e) {
      console.error('Error during reset:', e);
    } finally {
      setIsResetting(false);
      setShowResetModal(false);
    }
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      if (onDeleteAccount) {
        await onDeleteAccount();
      }
    } catch (e) {
      console.error('Error during account deletion:', e);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    // Regenerate OS alarms immediately before network call so swipe-kill doesn't drop alarm schedule updates
    regenerateAllReminders({
      habits: {
        habits: Array.isArray(habits) ? habits : [],
        daily7pmEnabled: userProfile?.habit_7pm_reminder_enabled !== 0
          && userProfile?.habit_7pm_reminder_enabled !== false,
        userName: userProfile?.name || 'User',
      },
      events: Array.isArray(calendarEvents) ? calendarEvents : [],
      waterSettings: {
        enabled: userProfile.waterReminderEnabled !== undefined ? !!userProfile.waterReminderEnabled : (userProfile.water_reminder_enabled !== 0 && userProfile.water_reminder_enabled !== false),
        startTime: userProfile.water_reminder_start || '08:00',
        endTime: userProfile.water_reminder_end || '22:00',
        intervalMinutes: userProfile.water_reminder_interval || 60,
        goal: userProfile.water_target_goal || 2.5,
        hydration: 0,
      },
      sleepSettings: {
        enabled: userProfile.sleepReminderEnabled !== undefined ? !!userProfile.sleepReminderEnabled : (userProfile.sleep_reminder_enabled !== 0 && userProfile.sleep_reminder_enabled !== false),
        reminderTime: userProfile.sleepReminderTime || userProfile.sleep_reminder_time || '22:00',
      },
      workoutSettings: {
        enabled: userProfile.workoutReminderEnabled !== undefined ? !!userProfile.workoutReminderEnabled : (userProfile.workout_reminder_enabled !== 0 && userProfile.workout_reminder_enabled !== false),
        reminderTime: userProfile.workoutReminderTime || userProfile.workout_reminder_time || '07:00',
        repeatRule: userProfile.workoutReminderRepeat || userProfile.workout_reminder_repeat || { type: 'daily' },
      },
      summarySettings: {
        enabled: userProfile.summaryReminderEnabled !== undefined ? !!userProfile.summaryReminderEnabled : (userProfile.summary_reminder_enabled !== 0 && userProfile.summary_reminder_enabled !== false),
        reminderTime: userProfile.summaryReminderTime || userProfile.summary_reminder_time || '07:00',
        userName: userProfile.name || 'User',
      },
      globalEnabled: userProfile.remindersGlobalEnabled !== false && userProfile.reminders_global_enabled !== 0,
    }).catch(console.error);

    if (token) {
      try {
        const res = await fetch(getApiUrl('/api/settings'), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ 
            ...userProfile, 
            phone: userProfile.phone || '', 
            timezone: userProfile.timezone || 'UTC', 
            ai_name: aiName?.trim() || 'AI', 
            gemini_api_key: geminiApiKey, 
            groq_api_key: groqApiKey, 
            ai_provider: aiProvider, 
            theme: themeMode, 
            currency: userProfile.currency, 
            chat_reset_time: chatResetTime,
            ai_tone: userProfile.aiTone || userProfile.ai_tone || 'Analytical & Direct',
            aiTone: userProfile.aiTone || userProfile.ai_tone || 'Analytical & Direct',
            morning_audit: userProfile.morningAudit !== undefined ? (userProfile.morningAudit ? 1 : 0) : (userProfile.morning_audit !== undefined ? (userProfile.morning_audit ? 1 : 0) : 1),
            morningAudit: userProfile.morningAudit !== undefined ? !!userProfile.morningAudit : (userProfile.morning_audit !== undefined ? userProfile.morning_audit !== 0 : true),
            smart_alerts: userProfile.smartAlerts !== undefined ? (userProfile.smartAlerts ? 1 : 0) : (userProfile.smart_alerts !== undefined ? (userProfile.smart_alerts ? 1 : 0) : 1),
            smartAlerts: userProfile.smartAlerts !== undefined ? !!userProfile.smartAlerts : (userProfile.smart_alerts !== undefined ? userProfile.smart_alerts !== 0 : true),
            auto_open_ai_sidechat: userProfile.auto_open_ai_sidechat !== false ? 1 : 0,
            week_start_day: userProfile.weekStartDay || userProfile.week_start_day || 'Monday',
            weekStartDay: userProfile.weekStartDay || userProfile.week_start_day || 'Monday',
            sync_to_cloud: userProfile.syncToCloud !== false ? 1 : 0,
            syncToCloud: userProfile.syncToCloud !== false,
            // Reminder fields
            remindersGlobalEnabled: !!userProfile.remindersGlobalEnabled,
            sleepReminderEnabled: !!userProfile.sleepReminderEnabled,
            sleepReminderTime: userProfile.sleepReminderTime || userProfile.sleep_reminder_time || '22:00',
            workoutReminderEnabled: !!userProfile.workoutReminderEnabled,
            workoutReminderTime: userProfile.workoutReminderTime || userProfile.workout_reminder_time || '07:00',
            workoutReminderRepeat: userProfile.workoutReminderRepeat || userProfile.workout_reminder_repeat || '{"type":"daily"}',
            summaryReminderEnabled: !!userProfile.summaryReminderEnabled,
            summaryReminderTime: userProfile.summaryReminderTime || userProfile.summary_reminder_time || '07:00',
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
    <>
      <style>{`
        .settings-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 18px;
          background: var(--bg-card);
          border-radius: 6px;
          border: 1px solid var(--border-color);
          gap: 16px;
          flex-wrap: wrap;
          width: 100%;
          box-sizing: border-box;
        }
        .settings-input {
          width: 100%;
          max-width: 320px;
          padding: 10px 14px;
          border-radius: 6px;
          background: var(--bg-main);
          color: var(--text-main);
          border: 1px solid var(--border-color);
          font-size: 0.88rem;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.15s ease;
        }
        .settings-input:focus {
          border-color: #d8f277;
        }
        @media (max-width: 768px) {
          .settings-input {
            max-width: 100%;
          }
        }
      `}</style>
    <div style={{ width: '100%', paddingBottom: '100px', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
        <div>
          <h3 style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: '1.45rem', fontWeight: 600, margin: 0, letterSpacing: '-0.02em' }}>Settings & System Preferences</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', marginTop: '4px', margin: 0 }}>Configure profile metadata, AI model providers, notification alerts, and data rules.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {settingsSaved && (
            <span style={{ font: "500 0.72rem 'DM Mono', monospace", background: '#d8f277', color: '#11110f', padding: '4px 10px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              <Check size={14} /> Saved
            </span>
          )}
          {handleLogout && (
            <button 
              type="button" 
              onClick={handleLogout} 
              style={{ 
                background: 'rgba(239, 111, 62, 0.1)', 
                color: '#ef6f3e', 
                border: '1px solid rgba(239, 111, 62, 0.3)', 
                padding: '8px 16px', 
                borderRadius: '6px', 
                font: "600 0.82rem 'DM Sans', sans-serif", 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                transition: 'all 0.15s'
              }}
            >
              <LogOut size={15} /> Sign Out
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        
        {/* SECTION 1: General Profile Details */}
        <div>
          <h4 style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: '1.1rem', fontWeight: 600, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
            <User size={17} color="#d8f277" /> General Profile
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            
            <div className="settings-row">
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>Full Name</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Your primary display name inside the dashboard.</div>
              </div>
              <input 
                type="text" 
                value={userProfile.name || ''} 
                onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })} 
                className="settings-input"
              />
            </div>

            <div className="settings-row">
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>Handle / Username</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Unique username shown across headers and export logs.</div>
              </div>
              <input 
                type="text" 
                value={userProfile.handle || ''} 
                onChange={(e) => setUserProfile({ ...userProfile, handle: e.target.value })} 
                className="settings-input"
                style={{ font: "500 0.85rem 'DM Mono', monospace" }}
              />
            </div>

            <div className="settings-row">
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>Email Address</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Used for security confirmations and account backup.</div>
              </div>
              <input 
                type="email" 
                value={userProfile.email || ''} 
                onChange={(e) => setUserProfile({ ...userProfile, email: e.target.value })} 
                className="settings-input"
                style={{ font: "500 0.85rem 'DM Mono', monospace" }}
              />
            </div>

            <div className="settings-row">
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>Phone Number</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Contact number for SMS dispatch and urgent reminders.</div>
              </div>
              <input 
                type="tel" 
                value={userProfile.phone || ''} 
                placeholder="+1 234 567 8900"
                onChange={(e) => setUserProfile({ ...userProfile, phone: e.target.value })} 
                className="settings-input"
                style={{ font: "500 0.85rem 'DM Mono', monospace" }}
              />
            </div>

            <div className="settings-row">
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>First Day of the Week</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sets the starting column for the 7-day habit matrix and weekly planners.</div>
              </div>
              <CustomSelect 
                value={userProfile.weekStartDay || userProfile.week_start_day || 'Monday'} 
                onChange={(e) => setUserProfile({ ...userProfile, weekStartDay: e.target.value, week_start_day: e.target.value })} 
                className="settings-input"
                options={[
                  { value: "Monday", label: "Monday" },
                  { value: "Tuesday", label: "Tuesday" },
                  { value: "Wednesday", label: "Wednesday" },
                  { value: "Thursday", label: "Thursday" },
                  { value: "Friday", label: "Friday" },
                  { value: "Saturday", label: "Saturday" },
                  { value: "Sunday", label: "Sunday" }
                ]}
              />
            </div>

            <div className="settings-row">
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>Timezone</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Primary timezone for audit calculations and streak resets.</div>
              </div>
              <CustomSelect 
                value={userProfile.timezone || 'UTC'} 
                onChange={(e) => setUserProfile({ ...userProfile, timezone: e.target.value })} 
                className="settings-input"
                style={{ font: "500 0.82rem 'DM Mono', monospace" }}
                options={[
                  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
                  { value: "Asia/Kolkata", label: "Asia/Kolkata (IST +5:30)" },
                  { value: "America/New_York", label: "America/New_York (EST -5:00 / EDT -4:00)" },
                  { value: "America/Los_Angeles", label: "America/Los_Angeles (PST -8:00 / PDT -7:00)" },
                  { value: "Europe/London", label: "Europe/London (GMT / BST)" },
                  { value: "Europe/Paris", label: "Europe/Paris (CET +1:00)" },
                  { value: "Asia/Tokyo", label: "Asia/Tokyo (JST +9:00)" },
                  { value: "Australia/Sydney", label: "Australia/Sydney (AEST +10:00)" }
                ]}
              />
            </div>

            <div className="settings-row">
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>Currency Symbol</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Default currency indicator in Money Tracker & Analytics.</div>
              </div>
              <CustomSelect 
                value={userProfile.currency || '$'} 
                onChange={(e) => setUserProfile({ ...userProfile, currency: e.target.value })} 
                className="settings-input"
                style={{ font: "500 0.85rem 'DM Mono', monospace" }}
                options={[
                  { value: "$", label: "Dollar ($)" },
                  { value: "₹", label: "Rupee (₹)" },
                  { value: "€", label: "Euro (€)" },
                  { value: "£", label: "Pound (£)" }
                ]}
              />
            </div>

            <div className="settings-row">
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>Display Theme Mode</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Workspace appearance theme.</div>
              </div>
              <CustomSelect 
                value={themeMode || 'pc'}
                onChange={(e) => setThemeMode(e.target.value)} 
                className="settings-input"
                options={[
                  { value: "dark", label: "Dark Mode" },
                  { value: "night", label: "🌙 Night Mode" },
                  { value: "light", label: "Light Mode" },
                  { value: "pc", label: "PC / System" }
                ]}
              />
            </div>

            <div className="settings-row">
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>Accent Color Theme</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tactile accent highlight color.</div>
              </div>
              <CustomSelect 
                value={typeof window !== 'undefined' ? (safeStorage.getItem('themeColor') || 'blue') : 'blue'}
                onChange={(e) => {
                  safeStorage.setItem('themeColor', e.target.value);
                  document.documentElement.setAttribute('data-color-theme', e.target.value);
                  window.dispatchEvent(new Event('storage'));
                }} 
                className="settings-input"
                options={[
                  { value: "blue", label: "Acid Lime & Ink (Editorial)" },
                  { value: "professional", label: "Black & White" },
                  { value: "pink", label: "Vibrant Rose" },
                  { value: "neon", label: "Neon Tech" },
                  { value: "emerald", label: "Emerald Pine" }
                ]}
              />
            </div>

          </div>
        </div>

        {/* SECTION 2: AI Agent & Features */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '22px' }}>
          <h4 style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: '1.1rem', fontWeight: 600, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
            <Bot size={17} color="#d8f277" /> AI Intelligence & Behavior
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            
            <div className="settings-row">
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>Assistant Name</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Name shown in AI companion chats and autonomous audits.</div>
              </div>
              <input 
                type="text" 
                value={aiName || ''} 
                placeholder="LifeAgent AI..."
                onChange={(e) => setAiName(e.target.value)} 
                onBlur={() => { if (!aiName?.trim()) setAiName('AI'); }}
                className="settings-input"
              />
            </div>

            <div className="settings-row">
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>AI Model Provider</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Underlying neural intelligence backend.</div>
              </div>
              <CustomSelect 
                value={aiProvider} 
                onChange={(e) => setAiProvider(e.target.value)} 
                className="settings-input"
                options={[
                  { value: "gemini", label: "Google Gemini" },
                  { value: "groq", label: "Groq (Llama 3)" }
                ]}
              />
            </div>

            <div className="settings-row">
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>AI Daily Chat Reset Hour</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Time when context window refreshes daily for crisp interactions.</div>
              </div>
              <CustomSelect 
                value={chatResetTime} 
                onChange={(e) => setChatResetTime(e.target.value)} 
                className="settings-input"
                style={{ font: "500 0.82rem 'DM Mono', monospace" }}
                options={[...Array(24)].map((_, i) => {
                  const hour = i.toString().padStart(2, '0');
                  return {
                    value: `${hour}:00`,
                    label: i === 0 ? 'Midnight (12:00 AM)' : i < 12 ? `${i}:00 AM` : i === 12 ? 'Noon (12:00 PM)' : `${i - 12}:00 PM`
                  };
                })}
              />
            </div>

            <div className="settings-row">
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>Gemini API Key</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Free key from aistudio.google.com for Gemini Pro 2.5 intelligence.</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input 
                  type="password" 
                  value={geminiApiKey} 
                  placeholder="AIzaSy..."
                  onChange={(e) => setGeminiApiKey(e.target.value)} 
                  className="settings-input"
                  style={{ font: "500 0.85rem 'DM Mono', monospace" }}
                />
                {geminiApiKey && <span style={{ font: "500 0.72rem 'DM Mono', monospace", color: '#d8f277' }}>● ACTIVE</span>}
              </div>
            </div>

            <div className="settings-row">
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>Groq API Key</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Free key from console.groq.com for ultra-fast Llama-3-70b.</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input 
                  type="password" 
                  value={groqApiKey} 
                  placeholder="gsk_..."
                  onChange={(e) => setGroqApiKey(e.target.value)} 
                  className="settings-input"
                  style={{ font: "500 0.85rem 'DM Mono', monospace" }}
                />
                {groqApiKey && <span style={{ font: "500 0.72rem 'DM Mono', monospace", color: '#d8f277' }}>● ACTIVE</span>}
              </div>
            </div>

            <div className="settings-row">
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>Daily Morning Audit Summary</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Automated morning schedule breakdown and spending audit generated at 7:00 AM.</div>
              </div>
              <div
                onClick={() => {
                  const val = !(userProfile.morningAudit !== undefined ? !!userProfile.morningAudit : (userProfile.morning_audit !== undefined ? userProfile.morning_audit !== 0 : false));
                  setUserProfile({ ...userProfile, morningAudit: val, morning_audit: val ? 1 : 0 });
                }}
                style={{
                  width: '46px', height: '24px', borderRadius: '12px', cursor: 'pointer', flexShrink: 0,
                  background: (userProfile.morningAudit !== undefined ? !!userProfile.morningAudit : (userProfile.morning_audit !== undefined ? userProfile.morning_audit !== 0 : false)) ? '#d8f277' : 'var(--border-color)',
                  position: 'relative', transition: 'background 0.2s'
                }}
              >
                <div style={{
                  position: 'absolute', top: '2px',
                  left: (userProfile.morningAudit !== undefined ? !!userProfile.morningAudit : (userProfile.morning_audit !== undefined ? userProfile.morning_audit !== 0 : false)) ? '24px' : '2px',
                  width: '20px', height: '20px', borderRadius: '50%',
                  background: (userProfile.morningAudit !== undefined ? !!userProfile.morningAudit : (userProfile.morning_audit !== undefined ? userProfile.morning_audit !== 0 : false)) ? '#11110f' : '#fff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  transition: 'left 0.2s'
                }} />
              </div>
            </div>

            <div className="settings-row">
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>Real-Time Habit Streak Alerts</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Notify before midnight when a study pomodoro or gym streak is about to break.</div>
              </div>
              <div
                onClick={() => {
                  const val = !(userProfile.smartAlerts !== undefined ? !!userProfile.smartAlerts : (userProfile.smart_alerts !== undefined ? userProfile.smart_alerts !== 0 : false));
                  setUserProfile({ ...userProfile, smartAlerts: val, smart_alerts: val ? 1 : 0 });
                }}
                style={{
                  width: '46px', height: '24px', borderRadius: '12px', cursor: 'pointer', flexShrink: 0,
                  background: (userProfile.smartAlerts !== undefined ? !!userProfile.smartAlerts : (userProfile.smart_alerts !== undefined ? userProfile.smart_alerts !== 0 : false)) ? '#d8f277' : 'var(--border-color)',
                  position: 'relative', transition: 'background 0.2s'
                }}
              >
                <div style={{
                  position: 'absolute', top: '2px',
                  left: (userProfile.smartAlerts !== undefined ? !!userProfile.smartAlerts : (userProfile.smart_alerts !== undefined ? userProfile.smart_alerts !== 0 : false)) ? '24px' : '2px',
                  width: '20px', height: '20px', borderRadius: '50%',
                  background: (userProfile.smartAlerts !== undefined ? !!userProfile.smartAlerts : (userProfile.smart_alerts !== undefined ? userProfile.smart_alerts !== 0 : false)) ? '#11110f' : '#fff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  transition: 'left 0.2s'
                }} />
              </div>
            </div>

            <div className="settings-row">
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>Auto-Open AI Side Chat</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Keep the companion drawer visible when switching between tabs.</div>
              </div>
              <div
                onClick={() => {
                  const val = !(userProfile.auto_open_ai_sidechat === true);
                  setUserProfile({ ...userProfile, auto_open_ai_sidechat: val });
                }}
                style={{
                  width: '46px', height: '24px', borderRadius: '12px', cursor: 'pointer', flexShrink: 0,
                  background: (userProfile.auto_open_ai_sidechat === true) ? '#d8f277' : 'var(--border-color)',
                  position: 'relative', transition: 'background 0.2s'
                }}
              >
                <div style={{
                  position: 'absolute', top: '2px',
                  left: (userProfile.auto_open_ai_sidechat === true) ? '24px' : '2px',
                  width: '20px', height: '20px', borderRadius: '50%',
                  background: (userProfile.auto_open_ai_sidechat === true) ? '#11110f' : '#fff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  transition: 'left 0.2s'
                }} />
              </div>
            </div>

            <div className="settings-row">
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>AI Personality & Tone</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Choose response styling for daily critiques and encouragement.</div>
              </div>
              <CustomSelect 
                value={userProfile.aiTone || userProfile.ai_tone || 'Analytical & Direct'}
                onChange={(e) => {
                  const val = e.target.value;
                  setUserProfile({ ...userProfile, aiTone: val, ai_tone: val });
                }}
                className="settings-input"
                options={[
                  { value: "Analytical & Direct", label: "Analytical & Direct" },
                  { value: "Encouraging & Supportive", label: "Encouraging & Supportive" },
                  { value: "Minimalist Executive", label: "Minimalist Executive" }
                ]}
              />
            </div>

          </div>
        </div>

        {/* SECTION 2.5: Reminders & Notifications */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '22px' }}>
          <h4 style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: '1.1rem', fontWeight: 600, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
            <Bell size={17} color="#d8f277" /> Reminders & Notifications
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

            {/* Master switch */}
            <div className="settings-row">
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>Enable All Local Reminders</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Master switch for all device notifications. Toggling ON automatically reschedules pending alarms.</div>
              </div>
              <div
                onClick={() => {
                  const val = !userProfile.remindersGlobalEnabled;
                  setUserProfile({ ...userProfile, remindersGlobalEnabled: val });
                }}
                style={{
                  width: '46px', height: '24px', borderRadius: '12px', cursor: 'pointer', flexShrink: 0,
                  background: userProfile.remindersGlobalEnabled ? '#d8f277' : 'var(--border-color)',
                  position: 'relative', transition: 'background 0.2s'
                }}
              >
                <div style={{
                  position: 'absolute', top: '2px',
                  left: userProfile.remindersGlobalEnabled ? '24px' : '2px',
                  width: '20px', height: '20px', borderRadius: '50%',
                  background: userProfile.remindersGlobalEnabled ? '#11110f' : '#fff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  transition: 'left 0.2s'
                }} />
              </div>
            </div>

            {/* Sleep Reminder */}
            <div className="settings-row">
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>Bedtime & Sleep Reminder</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Nightly prompt to wind down and hit your sleep target.</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <TimeButton 
                  value={userProfile.sleepReminderTime || userProfile.sleep_reminder_time || '22:00'}
                  onChange={(val) => setUserProfile({ ...userProfile, sleepReminderTime: val })}
                  disabled={!userProfile.sleepReminderEnabled}
                  style={{
                    background: 'var(--bg-main)', border: '1px solid var(--border-color)',
                    borderRadius: '6px', color: 'var(--text-main)', padding: '6px 10px',
                    font: "500 0.85rem 'DM Mono', monospace", opacity: userProfile.sleepReminderEnabled ? 1 : 0.4
                  }}
                />
                <div
                  onClick={() => setUserProfile({ ...userProfile, sleepReminderEnabled: !userProfile.sleepReminderEnabled })}
                  style={{
                    width: '46px', height: '24px', borderRadius: '12px', cursor: 'pointer', flexShrink: 0,
                    background: userProfile.sleepReminderEnabled ? '#d8f277' : 'var(--border-color)',
                    position: 'relative', transition: 'background 0.2s'
                  }}
                >
                  <div style={{
                    position: 'absolute', top: '2px',
                    left: userProfile.sleepReminderEnabled ? '24px' : '2px',
                    width: '20px', height: '20px', borderRadius: '50%',
                    background: userProfile.sleepReminderEnabled ? '#11110f' : '#fff',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                    transition: 'left 0.2s'
                  }} />
                </div>
              </div>
            </div>

            {/* Workout Reminder */}
            <div className="settings-row">
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>Workout Session Reminder</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Daily reminder to log your daily training session.</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <TimeButton 
                  value={userProfile.workoutReminderTime || userProfile.workout_reminder_time || '07:00'}
                  onChange={(val) => setUserProfile({ ...userProfile, workoutReminderTime: val })}
                  disabled={!userProfile.workoutReminderEnabled}
                  style={{
                    background: 'var(--bg-main)', border: '1px solid var(--border-color)',
                    borderRadius: '6px', color: 'var(--text-main)', padding: '6px 10px',
                    font: "500 0.85rem 'DM Mono', monospace", opacity: userProfile.workoutReminderEnabled ? 1 : 0.4
                  }}
                />
                <div
                  onClick={() => setUserProfile({ ...userProfile, workoutReminderEnabled: !userProfile.workoutReminderEnabled })}
                  style={{
                    width: '46px', height: '24px', borderRadius: '12px', cursor: 'pointer', flexShrink: 0,
                    background: userProfile.workoutReminderEnabled ? '#d8f277' : 'var(--border-color)',
                    position: 'relative', transition: 'background 0.2s'
                  }}
                >
                  <div style={{
                    position: 'absolute', top: '2px',
                    left: userProfile.workoutReminderEnabled ? '24px' : '2px',
                    width: '20px', height: '20px', borderRadius: '50%',
                    background: userProfile.workoutReminderEnabled ? '#11110f' : '#fff',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                    transition: 'left 0.2s'
                  }} />
                </div>
              </div>
            </div>

            {/* Morning Summary Reminder */}
            <div className="settings-row">
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>Morning Calendar Summary</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Morning notification previewing all today's events.</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <TimeButton 
                  value={userProfile.summaryReminderTime || userProfile.summary_reminder_time || '07:00'}
                  onChange={(val) => setUserProfile({ ...userProfile, summaryReminderTime: val })}
                  disabled={!userProfile.summaryReminderEnabled}
                  style={{
                    background: 'var(--bg-main)', border: '1px solid var(--border-color)',
                    borderRadius: '6px', color: 'var(--text-main)', padding: '6px 10px',
                    font: "500 0.85rem 'DM Mono', monospace", opacity: userProfile.summaryReminderEnabled ? 1 : 0.4
                  }}
                />
                <div
                  onClick={() => setUserProfile({ ...userProfile, summaryReminderEnabled: !userProfile.summaryReminderEnabled })}
                  style={{
                    width: '46px', height: '24px', borderRadius: '12px', cursor: 'pointer', flexShrink: 0,
                    background: userProfile.summaryReminderEnabled ? '#d8f277' : 'var(--border-color)',
                    position: 'relative', transition: 'background 0.2s'
                  }}
                >
                  <div style={{
                    position: 'absolute', top: '2px',
                    left: userProfile.summaryReminderEnabled ? '24px' : '2px',
                    width: '20px', height: '20px', borderRadius: '50%',
                    background: userProfile.summaryReminderEnabled ? '#11110f' : '#fff',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                    transition: 'left 0.2s'
                  }} />
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* SECTION 3: Account & Data Preferences */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '22px' }}>
          <h4 style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: '1.1rem', fontWeight: 600, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', letterSpacing: '-0.01em' }}>
            <Save size={17} color="#d8f277" /> Data Sync & Backup
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div className="settings-row">
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>Sync to Cloud Database</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Persistent remote database synchronization to ensure zero data loss.</div>
              </div>
              <div
                onClick={() => {
                  const val = !(userProfile.syncToCloud !== false);
                  setUserProfile({ ...userProfile, syncToCloud: val, sync_to_cloud: val ? 1 : 0 });
                }}
                style={{
                  width: '46px', height: '24px', borderRadius: '12px', cursor: 'pointer', flexShrink: 0,
                  background: (userProfile.syncToCloud !== false) ? '#d8f277' : 'var(--border-color)',
                  position: 'relative', transition: 'background 0.2s'
                }}
              >
                <div style={{
                  position: 'absolute', top: '2px',
                  left: (userProfile.syncToCloud !== false) ? '24px' : '2px',
                  width: '20px', height: '20px', borderRadius: '50%',
                  background: (userProfile.syncToCloud !== false) ? '#11110f' : '#fff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  transition: 'left 0.2s'
                }} />
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--border-color)', paddingTop: '18px' }}>
          <button type="submit" style={{ padding: '10px 24px', borderRadius: '6px', font: "600 0.84rem 'DM Sans', sans-serif", background: 'var(--ink)', color: '#d8f277', border: '1px solid var(--border-color)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <Save size={16} /> Save Changes
          </button>
        </div>

      </form>

      {/* SESSION & LOGOUT */}
      <div style={{ marginTop: '40px', borderTop: '1px dashed var(--border-color)', paddingTop: '24px' }}>
        <h4 style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: '1.05rem', fontWeight: 600, color: '#ef6f3e', marginBottom: '6px' }}>
          Account Session
        </h4>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '16px' }}>
          Terminates the active authenticated session and returns to the welcome screen.
        </p>
        <button 
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 20px', borderRadius: '6px',
            border: '1px solid rgba(239, 111, 62, 0.3)', background: 'rgba(239, 111, 62, 0.1)',
            color: '#ef6f3e', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
            transition: 'all 0.15s'
          }}
        >
          <LogOut size={16} /> Log Out of LifeAgent
        </button>
      </div>

      {/* DANGER ZONE SECTION */}
      <div style={{ marginTop: '40px', borderTop: '1px solid rgba(239, 111, 62, 0.3)', paddingTop: '24px' }}>
        <h4 style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: '1.05rem', fontWeight: 600, color: '#ef6f3e', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <AlertTriangle size={17} /> Danger Zone
        </h4>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '16px', lineHeight: '1.5' }}>
          Permanently erase all your logged data or delete your account records completely.
        </p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            type="button"
            onClick={() => setShowResetModal(true)}
            disabled={isResetting || isDeleting}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 18px', borderRadius: '6px',
              border: '1px solid #ef6f3e', background: '#ef6f3e',
              color: '#ffffff', fontWeight: 600, fontSize: '0.84rem', cursor: (isResetting || isDeleting) ? 'not-allowed' : 'pointer',
              opacity: (isResetting || isDeleting) ? 0.7 : 1,
              transition: 'all 0.15s'
            }}
          >
            ⚠️ Reset All Logged Data
          </button>

          <button 
            type="button"
            onClick={() => setShowDeleteModal(true)}
            disabled={isResetting || isDeleting}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 18px', borderRadius: '6px',
              border: '1px solid rgba(239, 111, 62, 0.4)', background: 'transparent',
              color: '#ef6f3e', fontWeight: 600, fontSize: '0.84rem', cursor: (isResetting || isDeleting) ? 'not-allowed' : 'pointer',
              opacity: (isResetting || isDeleting) ? 0.7 : 1,
              transition: 'all 0.15s'
            }}
          >
            🗑️ Delete Account Permanently
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={showResetModal}
        title="Reset All Account Data?"
        message="Permanently delete all your logged workouts, habits, transactions, notes, sleep logs, and history to reset your account to a completely fresh state. This action cannot be undone."
        confirmText={isResetting ? "Resetting..." : "Yes, Reset Everything"}
        cancelText="Cancel"
        type="danger"
        onConfirm={handleConfirmReset}
        onCancel={() => !isResetting && setShowResetModal(false)}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Account Permanently?"
        message="Permanently delete your entire LifeAgent user profile, login credentials, and all logged data. You will be immediately logged out and your user record removed from the database."
        confirmText={isDeleting ? "Deleting Account..." : "Yes, Delete My Account"}
        cancelText="Cancel"
        type="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => !isDeleting && setShowDeleteModal(false)}
      />

      {/* LIFEAGENT V2.4 FOOTER */}
      <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid var(--border-color)', textAlign: 'center', font: "400 0.75rem 'DM Mono', monospace", color: 'var(--text-muted)' }}>
        LIFEAGENT V2.4 • PRO EDITION
      </div>

    </div>
    </>
  );
};

export default SettingsPanel;
