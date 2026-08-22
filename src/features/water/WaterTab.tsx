import { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { useDate } from '../../hooks/useUtils';
import { Plus, Droplet, Target, Settings, Edit2, Trash2, RotateCcw, Bell, BellOff } from 'lucide-react';
import Modal from '../../components/ui/Modal';

export function WaterTab({ user }: { user: any }) {
  const { todayKey } = useDate();
  const [hydration, setHydration] = useState(0);
  const [target, setTarget] = useState(2.5);
  const [showSettings, setShowSettings] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderInterval, setReminderInterval] = useState(60);
  const [reminderStart, setReminderStart] = useState('08:00');
  const [reminderEnd, setReminderEnd] = useState('22:00');
  const [presets, setPresets] = useState([50, 150, 200, 250, 500]);
  const [customAmount, setCustomAmount] = useState('');

  const today = todayKey();
  const progress = Math.min((hydration / target) * 100, 100);

  const addWater = (ml: number) => {
    setHydration(prev => Math.min(prev + ml, target * 1000));
  };

  const handleCustomAdd = () => {
    const ml = parseInt(customAmount);
    if (!isNaN(ml) && ml > 0) {
      addWater(ml);
      setCustomAmount('');
    }
  };

  return (
    <div className="water-tab">
      <div className="tab-header">
        <h2 className="tab-title">Water Tracker</h2>
        <p className="tab-subtitle">Stay hydrated!</p>
      </div>

      <div className="water-main-card">
        <div className="water-progress-ring" style={{ '--progress': progress }}>
          <div className="progress-content">
            <span className="progress-liters">{hydration > 0 ? (hydration / 1000).toFixed(1) : '0'}</span>
            <span className="progress-target">/ {target} L</span>
            <span className="progress-percent">{Math.round(progress)}%</span>
          </div>
        </div>

        <div className="water-presets">
          {presets.map((ml) => (
            <button key={ml} onClick={() => addWater(ml)} className="preset-btn">
              <Droplet size={18} />
              <span>{ml} ml</span>
            </button>
          ))}
        </div>

        <div className="water-custom">
          <input
            type="number"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            placeholder="Custom ml"
            onKeyDown={(e) => e.key === 'Enter' && handleCustomAdd()}
          />
          <button onClick={handleCustomAdd} className="blue-btn">Add</button>
        </div>
      </div>

      <div className="water-stats">
        <div className="stat-card">
          <h4>Target</h4>
          <p>{target} L</p>
        </div>
        <div className="stat-card">
          <h4>Today</h4>
          <p>{(hydration / 1000).toFixed(1)} L</p>
        </div>
        <div className="stat-card">
          <h4>Remaining</h4>
          <p>{Math.max(0, (target * 1000 - hydration) / 1000).toFixed(1)} L</p>
        </div>
      </div>

      <button onClick={() => setShowSettings(true)} className="secondary-btn settings-btn">
        <Settings size={18} />
        <span>Reminder Settings</span>
      </button>

      <Modal isOpen={showSettings} onClose={() => setShowSettings(false)} title="Water Reminder Settings">
        <div className="settings-form">
          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={reminderEnabled}
                onChange={(e) => setReminderEnabled(e.target.checked)}
              />
              <span>Enable Reminders</span>
            </label>
          </div>
          <div className="setting-item">
            <label>Interval (minutes)</label>
            <input
              type="number"
              value={reminderInterval}
              onChange={(e) => setReminderInterval(parseInt(e.target.value) || 60)}
              min="15"
              max="240"
            />
          </div>
          <div className="setting-item">
            <label>Start Time</label>
            <input type="time" value={reminderStart} onChange={(e) => setReminderStart(e.target.value)} />
          </div>
          <div className="setting-item">
            <label>End Time</label>
            <input type="time" value={reminderEnd} onChange={(e) => setReminderEnd(e.target.value)} />
          </div>
          <div className="setting-item">
            <label>Daily Target (L)</label>
            <input
              type="number"
              step="0.1"
              value={target}
              onChange={(e) => setTarget(parseFloat(e.target.value) || 2.5)}
              min="0.5"
              max="10"
            />
          </div>
          <div className="modal-actions">
            <button onClick={() => setShowSettings(false)} className="secondary-btn">Close</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}