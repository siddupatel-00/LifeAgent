import { useState } from 'react';
import { useBodyStats } from '../../hooks/useQueries';
import { useAuthStore } from '../../stores/authStore';
import { useDate } from '../../hooks/useUtils';
import { Plus, Droplet, Minus, RotateCcw, CheckCircle2 } from 'lucide-react';

const PRESETS = [150, 250, 500];

export function WaterTab() {
  const user = useAuthStore((s) => s.user);
  const { bodyStats, createBodyStat, updateBodyStat } = useBodyStats();
  const { todayKey } = useDate();
  const [customAmount, setCustomAmount] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const target = (user?.water_target_goal || 2.5) * 1000; // ml
  const today = todayKey();
  const todayStat = bodyStats.find(s => s.date === today);
  const hydration = Math.min(todayStat?.hydration ? todayStat.hydration * 1000 : 0, target);
  const progress = Math.min((hydration / target) * 100, 100);
  const goalReached = hydration >= target;

  const saveHydration = async (ml: number) => {
    if (isSaving) return;
    setIsSaving(true);
    const liters = Math.round((ml / 1000) * 100) / 100;
    try {
      if (todayStat) {
        await updateBodyStat({ id: todayStat.id, data: { hydration: liters } });
      } else {
        await createBodyStat({ date: today, hydration: liters });
      }
    } catch {
      // stat stays unchanged on failure
    } finally {
      setIsSaving(false);
    }
  };

  const addWater = (ml: number) => saveHydration(Math.min(hydration + ml, target));

  const handleCustomAdd = () => {
    const ml = parseInt(customAmount);
    if (!Number.isNaN(ml) && ml > 0 && ml <= 2000) {
      addWater(ml);
      setCustomAmount('');
    }
  };

  return (
    <div className="water-tab">
      <div className="tab-header">
        <h2 className="tab-title">Water</h2>
        <p className="tab-subtitle">{goalReached ? 'Goal reached — nice work!' : 'Stay hydrated!'}</p>
      </div>

      <div className="water-main-card">
        <div className="water-progress-ring" style={{ '--progress': progress } as React.CSSProperties}>
          <div className="progress-content">
            <span className="progress-liters">{(hydration / 1000).toFixed(2)}</span>
            <span className="progress-target">/ {(target / 1000).toFixed(1)} L</span>
            <span className={`progress-percent ${goalReached ? 'goal-hit' : ''}`}>
              {goalReached && <CheckCircle2 size={16} />} {Math.round(progress)}%
            </span>
          </div>
        </div>

        <div className="water-presets">
          <button onClick={() => addWater(-50)} className="preset-btn small" aria-label="Remove 50 ml" disabled={isSaving}>
            <Minus size={18} />
          </button>
          {PRESETS.map((ml) => (
            <button key={ml} onClick={() => addWater(ml)} className="preset-btn" disabled={isSaving}>
              <Droplet size={17} />
              <span>{ml} ml</span>
            </button>
          ))}
          <button onClick={() => saveHydration(0)} className="preset-btn small" aria-label="Reset today" disabled={isSaving || !todayStat}>
            <RotateCcw size={17} />
          </button>
        </div>

        <div className="water-custom">
          <input
            type="number"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            placeholder="Custom ml"
            onKeyDown={(e) => e.key === 'Enter' && handleCustomAdd()}
            min="1"
            max="2000"
          />
          <button onClick={handleCustomAdd} className="blue-btn" disabled={isSaving}>Add</button>
        </div>
      </div>

      <div className="water-stats">
        <div className="stat-card">
          <h4>Target</h4>
          <p>{(target / 1000).toFixed(1)} L</p>
        </div>
        <div className="stat-card">
          <h4>Today</h4>
          <p>{(hydration / 1000).toFixed(2)} L</p>
        </div>
        <div className="stat-card">
          <h4>Remaining</h4>
          <p>{Math.max(0, (target - hydration) / 1000).toFixed(2)} L</p>
        </div>
      </div>

      <p className="water-hint">Your daily intake is saved to Body Stats and syncs across devices.</p>
    </div>
  );
}

export default WaterTab;
