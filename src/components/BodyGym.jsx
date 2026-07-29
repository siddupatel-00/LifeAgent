import React, { useState, useEffect, useCallback } from 'react';
import { Dumbbell, Target, Plus, Trash2, Activity, Flame, Clock, Check, Edit2 } from 'lucide-react';
import { todayKey } from '../utils/date';
import CustomSelect from './CustomSelect';

class BodyGymErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("BodyGym Error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '12px', color: 'var(--accent-blue)' }}>Body & Gym Panel</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>{this.state.error?.toString()}</p>
          <button className="blue-btn" style={{ margin: '0 auto' }} onClick={() => this.setState({ hasError: false })}>Reload Panel</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function BodyGym(props) {
  return (
    <BodyGymErrorBoundary>
      <BodyGymInner {...props} />
    </BodyGymErrorBoundary>
  );
}

function BodyGymInner({ token, showToast, bodyStats = [], setBodyStats }) {
  const [activeSubTab, setActiveSubTab] = useState('today'); // 'today', 'workouts', 'stats'
  const [workouts, setWorkouts] = useState([]);

  // Workout Split Rotation State
  const [workoutSettings, setWorkoutSettings] = useState({ split_type: 'weekly', templates: null });
  const [splitList, setSplitList] = useState(() => {
    try {
      const saved = localStorage.getItem('gym_workout_split');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      { name: 'Push Day', exercises: [] }, 
      { name: 'Leg Day', exercises: [] }, 
      { name: 'Pull Day', exercises: [] }, 
      { name: 'Cardio / Running', exercises: [] }, 
      { name: 'Rest & Recovery', exercises: [] }
    ];
  });
  const [isEditSplitOpen, setIsEditSplitOpen] = useState(false);
  const [newSplitName, setNewSplitName] = useState('');

  const saveSplitList = (newList) => {
    setSplitList(newList);
    try {
      localStorage.setItem('gym_workout_split', JSON.stringify(newList));
    } catch (e) {}
  };

  // Auto-rotation based on calendar day index or completed workouts
  const todayStr = todayKey();
  const totalWorkoutsCount = workouts.length;
  
  let todaySplitIdx = 0;
  if (workoutSettings.split_type === 'rotational') {
    todaySplitIdx = totalWorkoutsCount % splitList.length;
  } else {
    const todayDateObj = new Date(todayStr);
    const daysEpoch = Math.floor(todayDateObj.getTime() / (1000 * 60 * 60 * 24));
    todaySplitIdx = Math.abs(daysEpoch) % splitList.length;
  }

  const todayWorkoutTitle = (splitList[todaySplitIdx]?.name || splitList[todaySplitIdx]) || 'Workout';
  const tomorrowWorkoutTitle = (splitList[(todaySplitIdx + 1) % splitList.length]?.name || splitList[(todaySplitIdx + 1) % splitList.length]) || 'Workout';
  const dayAfterWorkoutTitle = (splitList[(todaySplitIdx + 2) % splitList.length]?.name || splitList[(todaySplitIdx + 2) % splitList.length]) || 'Workout';

  // Workout form state
  const [isAddWorkoutOpen, setIsAddWorkoutOpen] = useState(false);
  const [workoutForm, setWorkoutForm] = useState({
    title: '', category: 'General', duration_mins: '', calories: '', notes: ''
  });

  // Body stats form state
  const [isAddStatsOpen, setIsAddStatsOpen] = useState(false);
  const [statsForm, setStatsForm] = useState({
    weight: '', target_weight: '', protein: '', target_protein: '', hydration: ''
  });
  const [statsHistoryFilter, setStatsHistoryFilter] = useState('7days');

  const fetchWorkouts = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/fitness?type=workouts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWorkouts(data);
      }
    } catch (e) {
      console.error(e);
    }
  }, [token]);

  const fetchStats = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/fitness?type=body-stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBodyStats(data);
      }
    } catch (e) {
      console.error(e);
    }
  }, [token, setBodyStats]);

  useEffect(() => {
    fetchWorkouts();
    fetchStats();
    
    // Fetch settings for workout templates
    if (token) {
      fetch('/api/settings', { headers: { 'Authorization': `Bearer ${token}` } })
        .then(r => r.json())
        .then(data => {
          setWorkoutSettings({ split_type: data.workout_split_type || 'weekly', templates: data.workout_templates });
          if (data.workout_templates) {
            try {
              const parsed = JSON.parse(data.workout_templates);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setSplitList(parsed);
              }
            } catch (e) {}
          }
        });
    }
  }, [fetchWorkouts, fetchStats, token]);

  // Derived metrics for body stats
  const statsList = Array.isArray(bodyStats) ? bodyStats : (bodyStats ? [bodyStats] : []);
  const latestStat = statsList.length > 0 ? statsList[0] : null;
  const todayStat = statsList.find(s => s.date === todayStr) || latestStat || null;
  
  const currentProtein = Number(todayStat?.protein) || 0;
  const targetWeight = Number(latestStat?.target_weight) || 0;
  const targetProteinGoal = Number(latestStat?.target_protein) || (targetWeight > 0 ? Math.round(targetWeight * 2) : 150);
  const proteinPercentComplete = Math.min(100, Math.max(0, Math.round((currentProtein / targetProteinGoal) * 100)));

  // Check if today's scheduled workout has been logged
  const todayLoggedWorkout = workouts.find(w => w.date === todayStr);
  const isTodayCompleted = !!todayLoggedWorkout;

  const handleQuickCompleteToday = async () => {
    if (isTodayCompleted) return;
    try {
      const payload = {
        title: typeof todayWorkoutTitle === 'string' ? todayWorkoutTitle : todayWorkoutTitle.name,
        category: 'Strength',
        duration_mins: 45,
        calories: 320,
        notes: `Completed scheduled ${typeof todayWorkoutTitle === 'string' ? todayWorkoutTitle : todayWorkoutTitle.name}`,
        date: todayStr
      };
      
      const res = await fetch('/api/fitness?type=workouts', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        showToast(`🎉 ${typeof todayWorkoutTitle === 'string' ? todayWorkoutTitle : todayWorkoutTitle.name} Completed!`, 'success');
        fetchWorkouts();
        
        // Save exercises to metrics
        const currentSplit = splitList[todaySplitIdx];
        if (currentSplit && currentSplit.exercises && currentSplit.exercises.length > 0) {
          for (const ex of currentSplit.exercises) {
            await fetch('/api/analytics?type=metrics', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({
                date: todayStr,
                metric_type: 'workout',
                metric_name: ex.name,
                metric_value: ex.sets
              })
            });
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddWorkout = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...workoutForm,
        duration_mins: Number(workoutForm.duration_mins) || 0,
        calories: Number(workoutForm.calories) || 0,
        date: todayKey()
      };
      
      const res = await fetch('/api/fitness?type=workouts', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        showToast('Workout Added', 'success');
        closeWorkoutModal();
        fetchWorkouts();
      }
    } catch (e) {
      console.error(e);
      showToast('Error adding workout', 'error');
    }
  };

  const handleDeleteWorkout = async (id) => {
    try {
      const res = await fetch('/api/fitness?type=workouts', {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        showToast('Workout Deleted', 'success');
        fetchWorkouts();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openStatsModal = () => {
    setStatsForm({
      weight: todayStat?.weight ?? latestStat?.weight ?? '',
      target_weight: todayStat?.target_weight ?? latestStat?.target_weight ?? '',
      protein: todayStat?.protein ?? '',
      target_protein: todayStat?.target_protein ?? latestStat?.target_protein ?? '',
      hydration: todayStat?.hydration ?? ''
    });
    setIsAddStatsOpen(true);
  };

  const closeStatsModal = () => {
    setIsAddStatsOpen(false);
    setStatsForm({ weight: '', target_weight: '', protein: '', target_protein: '', hydration: '' });
  };

  const closeWorkoutModal = () => {
    setIsAddWorkoutOpen(false);
    setWorkoutForm({ title: '', category: 'General', duration_mins: '', calories: '', notes: '' });
  };

  const handleAddStats = async (e) => {
    e.preventDefault();
    try {
      const today = todayKey();
      const existingTodayStat = Array.isArray(bodyStats) ? bodyStats.find(s => s.date === today) : null;
      const isUpdating = !!existingTodayStat;
      
      const payload = {
        ...(isUpdating ? { id: existingTodayStat.id } : {}),
        weight: Number(statsForm.weight) || 0,
        target_weight: Number(statsForm.target_weight) || 0,
        protein: Number(statsForm.protein) || 0,
        target_protein: Number(statsForm.target_protein) || 0,
        hydration: Number(statsForm.hydration) || 0,
        date: today
      };
      
      const res = await fetch('/api/fitness?type=body-stats', {
        method: isUpdating ? 'PUT' : 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        showToast('Stats Updated', 'success');
        closeStatsModal();
        fetchStats();
      }
    } catch (e) {
      console.error(e);
      showToast('Error adding stats', 'error');
    }
  };

  const handleDeleteStat = async (id) => {
    try {
      const res = await fetch('/api/fitness?type=body-stats', {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        showToast('Stats Deleted', 'success');
        fetchStats();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Derived metrics for workouts
  const totalWorkouts = workouts.length;
  const totalDuration = workouts.reduce((acc, w) => acc + (w.duration_mins || 0), 0) / 60;
  const totalCalories = workouts.reduce((acc, w) => acc + (w.calories || 0), 0);
  
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const thisWeekCount = workouts.filter(w => new Date(w.date) >= oneWeekAgo).length;

  const statsArray = Array.isArray(bodyStats) ? bodyStats : (bodyStats ? [bodyStats] : []);
  const last7Days = statsArray.slice(0, 7).reverse();
  const maxWeight = Math.max(...last7Days.map(s => s.weight || 0), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Sub-tab navigation: Today | Workouts | Body Stats */}
      <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
        <button 
          onClick={() => setActiveSubTab('today')}
          style={{ 
            background: 'none', border: 'none', padding: '8px 16px', cursor: 'pointer',
            fontSize: '1rem', fontWeight: activeSubTab === 'today' ? 700 : 500,
            color: activeSubTab === 'today' ? 'var(--accent-blue)' : 'var(--text-muted)',
            borderBottom: activeSubTab === 'today' ? '2px solid var(--accent-blue)' : 'none'
          }}
        >
          Today
        </button>
        <button 
          onClick={() => setActiveSubTab('workouts')}
          style={{ 
            background: 'none', border: 'none', padding: '8px 16px', cursor: 'pointer',
            fontSize: '1rem', fontWeight: activeSubTab === 'workouts' ? 700 : 500,
            color: activeSubTab === 'workouts' ? 'var(--accent-blue)' : 'var(--text-muted)',
            borderBottom: activeSubTab === 'workouts' ? '2px solid var(--accent-blue)' : 'none'
          }}
        >
          Workouts
        </button>
        <button 
          onClick={() => setActiveSubTab('stats')}
          style={{ 
            background: 'none', border: 'none', padding: '8px 16px', cursor: 'pointer',
            fontSize: '1rem', fontWeight: activeSubTab === 'stats' ? 700 : 500,
            color: activeSubTab === 'stats' ? 'var(--accent-blue)' : 'var(--text-muted)',
            borderBottom: activeSubTab === 'stats' ? '2px solid var(--accent-blue)' : 'none'
          }}
        >
          Body Stats
        </button>
      </div>

      {/* 1. TODAY SUB-TAB: Workout Split Cycle & Daily Summary */}
      {activeSubTab === 'today' && (
        <div className="animate-entrance" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Main Hero Card: Today's Scheduled Workout */}
          <div className="glass-card" style={{ padding: '28px', borderRadius: '22px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>
                  🎯 Today's Scheduled Workout Split
                </div>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
                  🏋️ {todayWorkoutTitle}
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '520px', lineHeight: '1.5' }}>
                  Your split automatically advances day by day ({splitList.map(s => typeof s === 'string' ? s : (s?.name || s?.title || 'Workout')).join(' → ')}). Complete it or let it roll automatically to tomorrow!
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                {isTodayCompleted ? (
                  <span style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', padding: '10px 18px', borderRadius: '14px', fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Check size={18} /> Completed Today
                  </span>
                ) : (
                  <button 
                    onClick={handleQuickCompleteToday}
                    className="blue-btn"
                    style={{ padding: '10px 20px', fontSize: '0.9rem', fontWeight: 700, borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Check size={18} /> Mark Complete Today
                  </button>
                )}
              </div>
            </div>

            {/* Rotation Timeline Preview */}
            <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border-color)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              <div style={{ background: 'var(--accent-blue-dim)', border: '1px solid var(--accent-blue-dim)', padding: '12px 16px', borderRadius: '14px' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--accent-blue)', fontWeight: 800 }}>TODAY (DAY {todaySplitIdx + 1})</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '2px' }}>{todayWorkoutTitle}</div>
              </div>
              <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', padding: '12px 16px', borderRadius: '14px', opacity: 0.85 }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>TOMORROW</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '2px' }}>{tomorrowWorkoutTitle}</div>
              </div>
              <div style={{ background: 'var(--bg-main)', border: '1px solid var(--border-color)', padding: '12px 16px', borderRadius: '14px', opacity: 0.65 }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>DAY AFTER</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: '2px' }}>{dayAfterWorkoutTitle}</div>
              </div>
            </div>
          </div>

          {/* Bottom Grid: Quick Protein Summary (Read Only display on Today tab) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
            <div className="glass-card" style={{ padding: '20px', borderRadius: '18px', border: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>🥩 Daily Protein Tracker</div>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-blue)' }}>
                {currentProtein}g <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>/ {targetProteinGoal}g goal</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'var(--border-color)', borderRadius: '4px', marginTop: '10px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${proteinPercentComplete}%`, background: 'var(--accent-blue)', borderRadius: '4px' }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'workouts' && (
        <div className="animate-entrance">
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div className="glass-card" style={{ padding: '20px', borderRadius: '18px', border: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                <Dumbbell size={16} /> <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Total Workouts</span>
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{totalWorkouts}</div>
            </div>
            
            <div className="glass-card" style={{ padding: '20px', borderRadius: '18px', border: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                <Clock size={16} /> <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Duration (hrs)</span>
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{totalDuration.toFixed(1)}</div>
            </div>

            <div className="glass-card" style={{ padding: '20px', borderRadius: '18px', border: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                <Flame size={16} /> <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Total Calories</span>
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{totalCalories.toLocaleString()}</div>
            </div>

            <div className="glass-card" style={{ padding: '20px', borderRadius: '18px', border: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                <Activity size={16} /> <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>This Week</span>
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{thisWeekCount}</div>
            </div>
          </div>

          {/* Active Workout Split Routine & Customizer */}
          <div className="glass-card" style={{ padding: '24px', borderRadius: '18px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>🔄 Workout Rotation Split ({splitList.length} Days)</h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Your scheduled workouts rotate automatically day by day in this cycle.
                </p>
              </div>
              <button 
                onClick={() => setIsEditSplitOpen(true)}
                className="secondary-btn"
                style={{ padding: '8px 16px', fontSize: '0.84rem', borderRadius: '12px', fontWeight: 700 }}
              >
                ⚙️ Customize Split Routine
              </button>
            </div>

            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
              {splitList.map((dayObj, idx) => {
                const isCurrentToday = idx === todaySplitIdx;
                const dayName = typeof dayObj === 'string' ? dayObj : dayObj.name;
                return (
                  <div 
                    key={idx} 
                    style={{ 
                      flex: 1, minWidth: '130px', padding: '14px 16px', borderRadius: '14px',
                      background: isCurrentToday ? 'var(--accent-blue-dim)' : 'var(--bg-main)',
                      border: `1px solid ${isCurrentToday ? 'var(--accent-blue)' : 'var(--border-color)'}`
                    }}
                  >
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: isCurrentToday ? 'var(--accent-blue)' : 'var(--text-muted)', textTransform: 'uppercase' }}>
                      {isCurrentToday ? '🎯 TODAY (DAY ' + (idx + 1) + ')' : 'DAY ' + (idx + 1)}
                    </div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, marginTop: '4px', color: 'var(--text-main)' }}>
                      {dayName}
                    </div>

                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Workout History</h3>
            <button 
              className="blue-btn" 
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}
              onClick={() => setIsAddWorkoutOpen(true)}
            >
              <Plus size={16} /> Add Workout
            </button>
          </div>

          {workouts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', background: 'var(--bg-card)', borderRadius: '18px', border: '1px solid var(--border-color)' }}>
              <p style={{ color: 'var(--text-muted)' }}>No workouts recorded yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {workouts.map(workout => (
                <div key={workout.id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderRadius: '18px', border: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>{workout.title}</span>
                      <span className="pill-tag" style={{ fontSize: '0.7rem' }}>{workout.category}</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', gap: '12px' }}>
                      <span>{workout.date}</span>
                      <span>{workout.duration_mins} mins</span>
                      {Number(workout.calories) > 0 && <span>{workout.calories} kcal</span>}
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteWorkout(workout.id)}
                    style={{ background: 'none', border: 'none', color: '#ff5252', cursor: 'pointer', padding: '8px' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* Add Workout Modal */}
      {isAddWorkoutOpen && (
        <div className="modal-overlay" onClick={closeWorkoutModal}>
          <div className="animate-entrance" onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-card)', padding: '32px', borderRadius: '24px', width: '90%', maxWidth: '400px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '20px' }}>Log Workout</h3>
            <form onSubmit={handleAddWorkout}>
              <div className="input-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600 }}>Title</label>
                <input type="text" required className="glass-input" style={{ width: '100%', padding: '10px 14px' }} placeholder="Enter workout name..." value={workoutForm.title} onChange={e => setWorkoutForm({...workoutForm, title: e.target.value})} />
              </div>
              
              <div className="input-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600 }}>Category</label>
                <CustomSelect 
                  className="glass-input" 
                  style={{ width: '100%', padding: '10px 14px' }} 
                  value={workoutForm.category} 
                  onChange={e => setWorkoutForm({...workoutForm, category: e.target.value})}
                  options={[
                    { value: "General", label: "General" },
                    { value: "Cardio", label: "Cardio" },
                    { value: "Strength", label: "Strength" },
                    { value: "Flexibility", label: "Flexibility" },
                    { value: "Sports", label: "Sports" }
                  ]}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="input-group">
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600 }}>Duration (mins)</label>
                  <input type="number" required className="glass-input" style={{ width: '100%', padding: '10px 14px' }} placeholder="45" value={workoutForm.duration_mins} onChange={e => setWorkoutForm({...workoutForm, duration_mins: e.target.value})} />
                </div>
                <div className="input-group">
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600 }}>Calories (Optional)</label>
                  <input type="number" className="glass-input" style={{ width: '100%', padding: '10px 14px' }} placeholder="Optional (e.g. 300)" value={workoutForm.calories} onChange={e => setWorkoutForm({...workoutForm, calories: e.target.value})} />
                </div>
              </div>

              <div className="input-group" style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600 }}>Notes</label>
                <input type="text" className="glass-input" style={{ width: '100%', padding: '10px 14px' }} placeholder="Enter notes..." value={workoutForm.notes} onChange={e => setWorkoutForm({...workoutForm, notes: e.target.value})} />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="secondary-btn" onClick={closeWorkoutModal}>Cancel</button>
                <button type="submit" className="blue-btn">Save Workout</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeSubTab === 'stats' && (
        <div className="animate-entrance">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            {/* Daily Protein Goal & Tracker Card */}
            <div className="glass-card" style={{ padding: '24px', borderRadius: '18px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Target size={18} color="var(--accent-blue)" />
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Daily Protein Goal</h3>
                  </div>
                  <button 
                    className="blue-btn" 
                    style={{ padding: '6px 14px', fontSize: '0.82rem', fontWeight: 700 }}
                    onClick={openStatsModal}
                  >
                    + Log Protein
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-blue)' }}>
                    {currentProtein}g
                  </span>
                  <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    / {targetProteinGoal}g daily target
                  </span>
                </div>

                {/* Progress Bar */}
                <div style={{ width: '100%', height: '10px', background: 'var(--border-color)', borderRadius: '5px', overflow: 'hidden', marginBottom: '8px' }}>
                  <div 
                    style={{ 
                      height: '100%', 
                      width: `${proteinPercentComplete}%`,
                      background: 'linear-gradient(90deg, var(--accent-blue), #10b981)',
                      borderRadius: '5px',
                      transition: 'width 0.4s ease'
                    }} 
                  />
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                  <span>{proteinPercentComplete}% complete</span>
                  <span>{latestStat?.date ? `Updated: ${latestStat.date}` : 'No entry today'}</span>
                </div>
              </div>
            </div>

            {/* Current Body Stats Card */}
            <div className="glass-card" style={{ padding: '24px', borderRadius: '18px', border: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Current Body Metrics</h3>
                <button className="blue-btn" style={{ padding: '6px 14px', fontSize: '0.82rem', borderRadius: '10px' }} onClick={openStatsModal}><Edit2 size={14} /> Edit</button>
              </div>

              {latestStat ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div style={{ background: 'var(--bg-main)', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Current Weight</span>
                    <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{latestStat.weight} kg</span>
                  </div>
                  <div style={{ background: 'var(--bg-main)', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Target Weight</span>
                    <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{latestStat.target_weight} kg</span>
                  </div>
                  <div style={{ background: 'var(--bg-main)', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Daily Protein</span>
                    <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--accent-blue)' }}>{latestStat.protein} g</span>
                  </div>
                  <div style={{ background: 'var(--bg-main)', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Daily Hydration</span>
                    <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--accent-blue)' }}>{latestStat.hydration} L</span>
                  </div>
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>No stats recorded yet. Click "Edit" to start!</p>
              )}
            </div>

          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>History</h3>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <CustomSelect
                className="timeframe-dropdown"
                value={statsHistoryFilter}
                onChange={(e) => setStatsHistoryFilter(e.target.value)}
                options={[
                  { value: 'today', label: 'Today / Prev' },
                  { value: '7days', label: 'Past 7 Days' },
                  { value: '30days', label: 'Past 30 Days' },
                  { value: 'all', label: 'All' }
                ]}
                style={{ 
                  width: '160px', 
                  background: 'var(--bg-card)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '30px', 
                  padding: '6px 14px', 
                  color: 'var(--text-primary)', 
                  fontSize: '0.85rem' 
                }}
              />
            </div>
          </div>

          {(() => {
            const getFilteredStats = () => {
              if (statsHistoryFilter === 'all') return statsList;
              const now = new Date(todayKey());
              return statsList.filter(stat => {
                const statDate = new Date(stat.date);
                const diffTime = Math.abs(now - statDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (statsHistoryFilter === 'today') return diffDays <= 1;
                if (statsHistoryFilter === '7days') return diffDays <= 7;
                if (statsHistoryFilter === '30days') return diffDays <= 30;
                return true;
              });
            };
            const filteredStats = getFilteredStats();
            if (filteredStats.length === 0) {
              return (
                <div style={{ textAlign: 'center', padding: '40px', background: 'var(--bg-card)', borderRadius: '18px', border: '1px solid var(--border-color)' }}>
                  <p style={{ color: 'var(--text-muted)' }}>No stats recorded yet.</p>
                </div>
              );
            }
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filteredStats.map(stat => (
                  <div key={stat.id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderRadius: '18px', border: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
                    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                      <div style={{ minWidth: '80px' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Date</div>
                        <div style={{ fontWeight: 600 }}>{stat.date}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Weight</div>
                        <div style={{ fontWeight: 600 }}>{stat.weight} kg</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Protein</div>
                        <div style={{ fontWeight: 600 }}>{stat.protein} g</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Hydration</div>
                        <div style={{ fontWeight: 600 }}>{stat.hydration} L</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDeleteStat(stat.id)}
                      style={{ background: 'none', border: 'none', color: '#ff5252', cursor: 'pointer', padding: '8px' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            );
          })()}


        </div>
      )}

      {/* Add Stats Modal */}
      {isAddStatsOpen && (
        <div className="modal-overlay" onClick={closeStatsModal}>
          <div className="animate-entrance" onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-card)', padding: '32px', borderRadius: '24px', width: '90%', maxWidth: '400px', border: '1px solid var(--border-color)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '20px' }}>Log Body Stats</h3>
            <form onSubmit={handleAddStats}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="input-group">
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600 }}>Weight (kg)</label>
                  <input type="number" step="0.1" required className="glass-input" style={{ width: '100%', padding: '10px 14px' }} placeholder="75.5" value={statsForm.weight} onChange={e => setStatsForm({...statsForm, weight: e.target.value})} />
                </div>
                <div className="input-group">
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600 }}>Target (kg)</label>
                  <input type="number" step="0.1" className="glass-input" style={{ width: '100%', padding: '10px 14px' }} placeholder="70" value={statsForm.target_weight} onChange={e => setStatsForm({...statsForm, target_weight: e.target.value})} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Daily Protein (g)</label>
                  <input 
                    type="number" 
                    value={statsForm.protein} 
                    onChange={(e) => setStatsForm({...statsForm, protein: e.target.value})} 
                    className="glass-input" 
                    style={{ width: '100%', padding: '10px 14px', fontSize: '0.95rem' }} 
                    placeholder="e.g. 120"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Target Protein Goal (g)</label>
                  <input 
                    type="number" 
                    value={statsForm.target_protein} 
                    onChange={(e) => setStatsForm({...statsForm, target_protein: e.target.value})} 
                    className="glass-input" 
                    style={{ width: '100%', padding: '10px 14px', fontSize: '0.95rem' }} 
                    placeholder="e.g. 150"
                  />
                </div>
                <div className="input-group">
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600 }}>Hydration (L)</label>
                  <input type="number" step="0.1" className="glass-input" style={{ width: '100%', padding: '10px 14px' }} placeholder="2.5" value={statsForm.hydration} onChange={e => setStatsForm({...statsForm, hydration: e.target.value})} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="secondary-btn" onClick={closeStatsModal}>Cancel</button>
                <button type="submit" className="blue-btn">Save Stats</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customize Workout Split Modal */}
      {isEditSplitOpen && (
        <div className="modal-overlay" onClick={() => setIsEditSplitOpen(false)}>
          <div className="glass-card animate-entrance" onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-card)', padding: '32px', borderRadius: '24px', width: '90%', maxWidth: '440px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '8px' }}>Customize Workout Split</h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Your workouts will automatically rotate day by day in this order.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', maxHeight: '400px', overflowY: 'auto' }}>
              {splitList.map((itemObj, idx) => {
                const item = typeof itemObj === 'string' ? { name: itemObj, exercises: [] } : itemObj;
                return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px 14px', borderRadius: '12px', background: 'var(--bg-main)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Day {idx + 1}: {item.name}</span>
                    {splitList.length > 1 && (
                      <button 
                        onClick={() => saveSplitList(splitList.filter((_, i) => i !== idx))}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                        title="Remove Day"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <div style={{ paddingLeft: '8px', borderLeft: '2px solid var(--border-color)' }}>
                    {item.exercises && item.exercises.length > 0 ? item.exercises.map((ex, eIdx) => (
                      <div key={eIdx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                        <span>{ex.name}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{ex.sets}</span>
                      </div>
                    )) : (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No exercises added.</div>
                    )}
                    <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                      <input 
                        type="text" 
                        placeholder="Exercise (e.g. Dips)" 
                        id={`ex-name-${idx}`}
                        className="glass-input" 
                        style={{ flex: 1, padding: '4px 8px', fontSize: '0.75rem' }}
                      />
                      <input 
                        type="text" 
                        placeholder="Sets (e.g. 5x2)" 
                        id={`ex-sets-${idx}`}
                        className="glass-input" 
                        style={{ width: '110px', padding: '4px 8px', fontSize: '0.75rem' }}
                      />
                      <button 
                        type="button" 
                        className="secondary-btn" 
                        style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                        onClick={() => {
                          const name = document.getElementById(`ex-name-${idx}`).value;
                          const sets = document.getElementById(`ex-sets-${idx}`).value;
                          if (name && sets) {
                            const newList = [...splitList];
                            const current = typeof newList[idx] === 'string' ? { name: newList[idx], exercises: [] } : { ...newList[idx], exercises: newList[idx].exercises || [] };
                            current.exercises.push({ name, sets });
                            newList[idx] = current;
                            saveSplitList(newList);
                            document.getElementById(`ex-name-${idx}`).value = '';
                            document.getElementById(`ex-sets-${idx}`).value = '';
                          }
                        }}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              )})}
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (newSplitName.trim()) {
                saveSplitList([...splitList, { name: newSplitName.trim(), exercises: [] }]);
                setNewSplitName('');
              }
            }} style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
              <input 
                type="text" 
                placeholder="Add new split day (e.g. Arms Day)..." 
                value={newSplitName} 
                onChange={(e) => setNewSplitName(e.target.value)} 
                className="glass-input" 
                style={{ flex: 1, padding: '10px 14px', fontSize: '0.88rem' }}
              />
              <button type="submit" className="blue-btn" style={{ padding: '10px 16px', fontSize: '0.85rem' }}>+ Add</button>
            </form>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <CustomSelect 
                className="glass-input"
                style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                value={workoutSettings.split_type}
                onChange={(e) => {
                  const newType = e.target.value;
                  setWorkoutSettings({...workoutSettings, split_type: newType});
                  fetch('/api/settings', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ workout_split_type: newType })
                  });
                }}
                options={[
                  { value: "weekly", label: "Weekly Rotation" },
                  { value: "rotational", label: "Count-based Rotation" }
                ]}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button 
                type="button" 
                onClick={() => saveSplitList([
                  { name: 'Push Day', exercises: [] }, 
                  { name: 'Leg Day', exercises: [] }, 
                  { name: 'Pull Day', exercises: [] }, 
                  { name: 'Cardio / Running', exercises: [] }, 
                  { name: 'Rest & Recovery', exercises: [] }
                ])}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Reset Default 5-Day Split
              </button>
              <button type="button" className="blue-btn" onClick={() => {
                setIsEditSplitOpen(false);
                fetch('/api/settings', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                  body: JSON.stringify({ workout_templates: JSON.stringify(splitList) })
                });
              }}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

