import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { safeStorage } from '../utils/safeStorage';
import { Dumbbell, Target, Plus, Trash2, Activity, Flame, Clock, Check, Edit2, X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { todayKey } from '../utils/date';
import db from '../db/db';
import { queueMutation, triggerSync } from '../db/syncEngine';
import { getApiUrl } from '../utils/apiConfig';
import CustomSelect from './CustomSelect';
import Modal from './Modal';

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

function BodyGymInner({ token, showToast, workouts: initialWorkouts = [], bodyStats = [], setBodyStats, userProfile, showForm, setShowForm, isEditSplitOpen: externalIsEditSplitOpen, setIsEditSplitOpen: externalSetIsEditSplitOpen }) {
  const userHasChangedTab = React.useRef(false);
  const [activeSubTab, setActiveSubTab] = useState(() => (!initialWorkouts || initialWorkouts.length === 0) ? 'workouts' : 'today');
  const [workouts, setWorkouts] = useState(() => Array.isArray(initialWorkouts) ? initialWorkouts : []);

  useEffect(() => {
    if (!userHasChangedTab.current) {
      if (!workouts || workouts.length === 0) {
        setActiveSubTab('workouts');
      } else {
        setActiveSubTab('today');
      }
    }
  }, [workouts]);

  // Workout Split Rotation State
  const [workoutSettings, setWorkoutSettings] = useState({ split_type: 'weekly', templates: null });
  const [hasCustomSplit, setHasCustomSplit] = useState(false);
  const [splitList, setSplitList] = useState([]);
  const [internalIsEditSplitOpen, setInternalIsEditSplitOpen] = useState(false);
  const isEditSplitOpen = externalIsEditSplitOpen !== undefined ? externalIsEditSplitOpen : internalIsEditSplitOpen;
  const setIsEditSplitOpen = externalSetIsEditSplitOpen || setInternalIsEditSplitOpen;
  const [newSplitName, setNewSplitName] = useState('');

  const WEEKDAYS = useMemo(() => ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"], []);
  const isWeekly = workoutSettings.split_type === 'weekly';

  const saveSplitList = (newList) => {
    setSplitList(newList);
    setHasCustomSplit(true);
  };

  // Auto-rotation based on calendar day index or completed workouts
  const todayStr = todayKey(userProfile?.timezone);
  const totalWorkoutsCount = workouts.length;
  
  let dayOfWeek = 0;
  if (todayStr) {
    const parts = todayStr.split('-');
    if (parts.length === 3) {
      const dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      dayOfWeek = (dateObj.getDay() + 6) % 7; // 0 = Monday, ..., 6 = Sunday
    } else {
      dayOfWeek = (new Date().getDay() + 6) % 7;
    }
  } else {
    dayOfWeek = (new Date().getDay() + 6) % 7;
  }

  let todaySplitIdx = 0;
  if (splitList.length > 0) {
    if (!isWeekly) {
      todaySplitIdx = totalWorkoutsCount % splitList.length;
    } else {
      todaySplitIdx = dayOfWeek % splitList.length;
    }
  }

  const getSplitTitle = (idx) => {
    if (splitList.length === 0) return 'Workout';
    const item = splitList[idx % splitList.length];
    return typeof item === 'string' ? item : (item?.name || item?.title || 'Workout');
  };

  const todayWorkoutTitle = splitList.length > 0 ? getSplitTitle(todaySplitIdx) : 'Workout';
  const tomorrowWorkoutTitle = splitList.length > 0 
    ? getSplitTitle(isWeekly ? (dayOfWeek + 1) % splitList.length : (todaySplitIdx + 1) % splitList.length)
    : 'Workout';
  const dayAfterWorkoutTitle = splitList.length > 0 
    ? getSplitTitle(isWeekly ? (dayOfWeek + 2) % splitList.length : (todaySplitIdx + 2) % splitList.length)
    : 'Workout';

  // Workout form state
  const [isAddWorkoutOpen, setIsAddWorkoutOpen] = useState(false);
  const [workoutForm, setWorkoutForm] = useState({
    title: '', category: 'General', duration_mins: '', calories: '', notes: ''
  });

  useEffect(() => {
    if (showForm) {
      setIsAddWorkoutOpen(true);
    }
  }, [showForm]);



  // Body stats form state
  const [isLogProteinOpen, setIsLogProteinOpen] = useState(false);
  const [proteinInput, setProteinInput] = useState('');
  
  const [isEditMetricsOpen, setIsEditMetricsOpen] = useState(false);
  const [statsForm, setStatsForm] = useState({
    weight: '', target_weight: '', protein: '', target_protein: ''
  });
  const [statsHistoryFilter, setStatsHistoryFilter] = useState('7days');

  const fetchWorkouts = useCallback(async () => {
    if (!token) return;
    try {
      const tempId = Date.now().toString();
      const finalPayload = { ...payload, id: tempId };
      await db.workouts.put(finalPayload);
      await queueMutation('workouts', 'create', tempId, finalPayload);
      triggerSync();
      setWorkouts(prev => [finalPayload, ...prev]);
      showToast(`🎉 ${typeof todayWorkoutTitle === 'string' ? todayWorkoutTitle : todayWorkoutTitle.name} Completed!`, 'success');
        
        // Save exercises to metrics
        const currentSplit = splitList[todaySplitIdx];
        if (currentSplit && currentSplit.exercises && currentSplit.exercises.length > 0) {
          for (const ex of currentSplit.exercises) {
            await fetch(getApiUrl('/api/analytics?type=metrics'), {
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
      
      const tempId = Date.now().toString();
      const finalPayload = { ...payload, id: tempId };
      await db.workouts.put(finalPayload);
      await queueMutation('workouts', 'create', tempId, finalPayload);
      triggerSync();
      setWorkouts(prev => [finalPayload, ...prev]);
      showToast('Workout Added', 'success');
      closeWorkoutModal();
      }
    } catch (e) {
      console.error(e);
      showToast('Error adding workout', 'error');
    }
  };

  const handleDeleteWorkout = async (id) => {
    try {
      const res = await fetch(getApiUrl('/api/fitness?type=workouts'), {
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

  const openLogProteinModal = () => {
    setProteinInput(todayStat?.protein ?? '');
    setIsLogProteinOpen(true);
  };

  const closeLogProteinModal = () => {
    setIsLogProteinOpen(false);
    setProteinInput('');
  };

  const openEditMetricsModal = () => {
    setStatsForm({
      weight: todayStat?.weight ?? latestStat?.weight ?? '',
      target_weight: todayStat?.target_weight ?? latestStat?.target_weight ?? '',
      protein: todayStat?.protein ?? '',
      target_protein: todayStat?.target_protein ?? latestStat?.target_protein ?? ''
    });
    setIsEditMetricsOpen(true);
  };

  const closeEditMetricsModal = () => {
    setIsEditMetricsOpen(false);
    setStatsForm({ weight: '', target_weight: '', protein: '', target_protein: '' });
  };

  const closeWorkoutModal = () => {
    setIsAddWorkoutOpen(false);
    setWorkoutForm({ title: '', category: 'General', duration_mins: '', calories: '', notes: '' });
    setShowForm?.(false);
  };

  const handleLogProtein = async (amountOrEvent, isAbsolute = false) => {
    if (amountOrEvent && typeof amountOrEvent === 'object' && typeof amountOrEvent.preventDefault === 'function') {
      amountOrEvent.preventDefault();
    }

    try {
      const safeBodyStats = Array.isArray(bodyStats) ? bodyStats : (bodyStats ? [bodyStats] : []);
      const todayStr = todayKey(userProfile?.timezone);
      const todayStat = safeBodyStats.find(s => s && s.date === todayStr) || null;
      const latestStat = safeBodyStats.length > 0 ? safeBodyStats[0] : null;

      const currentP = todayStat ? (Number(todayStat.protein) || 0) : 0;
      const targetW = Number(latestStat?.target_weight) || 0;
      const targetP = Number(latestStat?.target_protein) || Number(todayStat?.target_protein) || 0;
      const goal = targetP > 0 ? targetP : (targetW > 0 ? Math.round(targetW * 2) : 0);

      let delta = 0;
      let newProtein = 0;

      if (typeof amountOrEvent === 'number') {
        if (isAbsolute) {
          newProtein = Math.max(0, amountOrEvent);
          delta = newProtein - currentP;
        } else {
          delta = amountOrEvent;
          newProtein = Math.max(0, currentP + delta);
        }
      } else {
        const val = Number(proteinInput);
        newProtein = Math.max(0, isNaN(val) ? 0 : val);
        delta = newProtein - currentP;
      }

      const payload = {
        date: todayStr,
        protein: newProtein,
        target_protein: goal
      };

      // Optimistic update of local state
      const updatedStat = {
        ...(todayStat || {}),
        id: todayStat?.id || Date.now(),
        date: todayStr,
        protein: newProtein,
        target_protein: goal,
        weight: todayStat?.weight || latestStat?.weight || 0,
        target_weight: todayStat?.target_weight || targetW
      };

      if (typeof setBodyStats === 'function') {
        setBodyStats(prev => {
          const list = Array.isArray(prev) ? prev : (prev ? [prev] : []);
          const exists = list.some(s => s && s.date === todayStr);
          if (exists) {
            return list.map(s => (s && s.date === todayStr) ? { ...s, protein: newProtein, target_protein: goal } : s);
          }
          return [updatedStat, ...list];
        });
      }

      const tempId = todayStat?.id || Date.now().toString();
      const finalPayload = { ...payload, id: tempId, weight: Number(todayStat?.weight) || 0, target_weight: Number(todayStat?.target_weight) || 0 };
      await db.bodyStats.put(finalPayload);
      await queueMutation('bodyStats', todayStat?.id ? 'update' : 'create', tempId.toString(), finalPayload);
      triggerSync();
      const sign = amount >= 0 ? '+' : '';
      showToast(`Protein logged: ${sign}${amount}g`, 'success');
    } catch (err) {
      console.error('Error in handleLogProtein:', err);
    }
  };

  const handleAddProtein = handleLogProtein;
  const handleQuickAddProtein = (amount) => handleLogProtein(amount);

  const handleLogHydration = async (deltaLiters) => {
    if (!token) return;
    try {
      const newHydration = Math.max(0, parseFloat((currentHydration + deltaLiters).toFixed(2)));
      const existingTodayStat = statsList.find(s => s && s.date === todayStr);

      let res;
      if (existingTodayStat && existingTodayStat.id) {
        res = await fetch(getApiUrl('/api/fitness?type=body-stats'), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            id: existingTodayStat.id,
            hydration: newHydration,
            protein: currentProtein,
            target_protein: targetProteinGoal,
            weight: Number(existingTodayStat.weight) || 0
          })
        });
      } else {
        res = await fetch(getApiUrl('/api/fitness?type=body-stats'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            date: todayStr,
            hydration: newHydration,
            protein: currentProtein,
            target_protein: targetProteinGoal,
            weight: Number(latestStat?.weight) || 0
          })
        });
      }

      if (res.ok) {
        setBodyStats(prev => {
          const list = Array.isArray(prev) ? prev : [];
          const exists = list.some(s => s && s.date === todayStr);
          if (exists) {
            return list.map(s => (s && s.date === todayStr) ? { ...s, hydration: newHydration } : s);
          } else {
            return [{ date: todayStr, hydration: newHydration, protein: currentProtein, target_protein: targetProteinGoal }, ...list];
          }
        });
        showToast(`Hydration updated: ${deltaLiters > 0 ? '+' : ''}${deltaLiters} L`, 'success');
      }
    } catch (err) {
      console.error('Error updating hydration:', err);
    }
  };

  const handleResetProtein = async () => {
    try {
      const today = todayKey(userProfile?.timezone);
      const existingTodayStat = Array.isArray(bodyStats) ? bodyStats.find(s => s.date === today) : null;
      const isUpdating = !!existingTodayStat;
      
      const payload = {
        ...(isUpdating ? { id: existingTodayStat.id } : {}),
        weight: existingTodayStat?.weight || (latestStat?.weight || 0),
        target_weight: existingTodayStat?.target_weight || (latestStat?.target_weight || 0),
        protein: 0,
        target_protein: existingTodayStat?.target_protein || (latestStat?.target_protein || 0),
        hydration: existingTodayStat?.hydration || 0,
        date: today
      };

      // 1. Instant 0ms Optimistic UI update
      setBodyStats(prev => {
        const list = Array.isArray(prev) ? prev : [];
        const exists = list.some(s => s.date === today);
        if (exists) {
          return list.map(s => s.date === today ? { ...s, protein: 0 } : s);
        }
        return [{ ...payload, protein: 0 }, ...list];
      });

      showToast('Protein reset to 0g', 'success');
      setProteinInput('0');
      closeLogProteinModal();
      
      // 2. Background DB sync
      const tempId = payload.id || Date.now().toString();
      const finalPayload = { ...payload, id: tempId };
      await db.bodyStats.put(finalPayload);
      await queueMutation('bodyStats', isUpdating ? 'update' : 'create', tempId, finalPayload);
      triggerSync();
    } catch (e) {
      console.error('Error resetting protein:', e);
      showToast('Error resetting protein', 'error');
    }
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
        protein: isUpdating ? existingTodayStat.protein : (latestStat?.protein || 0),
        target_protein: Number(statsForm.target_protein) || 0,
        hydration: isUpdating ? existingTodayStat.hydration : (latestStat?.hydration || 0),
        date: today
      };
      
      const tempId = payload.id || Date.now().toString();
      const finalPayload = { ...payload, id: tempId };
      await db.bodyStats.put(finalPayload);
      await queueMutation('bodyStats', isUpdating ? 'update' : 'create', tempId, finalPayload);
      triggerSync();
      
      setBodyStats(prev => {
        if (Array.isArray(prev)) {
          const exists = prev.find(s => s.date === today);
          if (exists) return prev.map(s => s.date === today ? finalPayload : s);
          return [finalPayload, ...prev];
        }
        return [finalPayload];
      });

      showToast('Saved successfully!', 'success');
      closeEditMetricsModal();
    } catch (e) {
      console.error(e);
      showToast('Error adding stats', 'error');
    }
  };

  const handleDeleteStat = async (id) => {
    try {
      await db.bodyStats.delete(id);
      await queueMutation('bodyStats', 'delete', id.toString(), null);
      triggerSync();
      setBodyStats(prev => prev.filter(s => s.id !== id));
      showToast('Stats Deleted', 'success');
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
  const maxWeight = last7Days.length > 0 ? Math.max(...last7Days.map(s => s.weight || 0), 1) : 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Sub-tab navigation: Today | Workouts | Body Stats */}
      <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
        <button 
          onClick={() => { userHasChangedTab.current = true; setActiveSubTab('today'); }}
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
          onClick={() => { userHasChangedTab.current = true; setActiveSubTab('workouts'); }}
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
          onClick={() => { userHasChangedTab.current = true; setActiveSubTab('stats'); }}
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

      {/* 1. TODAY SUB-TAB: Minimal Daily Protein & Hydration Trackers */}
      {activeSubTab === 'today' && (
        <div className="animate-entrance" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {/* Daily Protein Tracker */}
          <div className="glass-card" style={{ padding: '24px', borderRadius: '22px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--accent-blue)', letterSpacing: '0.5px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  🥩 Daily Protein Tracker
                </div>
                <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--accent-blue)' }}>
                  {proteinPercentComplete}%
                </span>
              </div>

              <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--accent-blue)', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                {currentProtein}g <span style={{ fontSize: '0.92rem', color: 'var(--text-muted)', fontWeight: 600 }}>/ {targetProteinGoal}g goal</span>
              </div>

              <div style={{ width: '100%', height: '10px', background: 'var(--bg-main)', borderRadius: '10px', marginTop: '14px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                <div style={{ height: '100%', width: `${proteinPercentComplete}%`, background: 'var(--accent-blue)', borderRadius: '10px', transition: 'width 0.3s ease' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button
                type="button"
                onClick={() => handleLogProtein(25)}
                style={{ flex: 1, padding: '12px 10px', borderRadius: '14px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }}
              >
                +25g
              </button>
              <button
                type="button"
                onClick={() => handleLogProtein(30)}
                style={{ flex: 1, padding: '12px 10px', borderRadius: '14px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }}
              >
                +30g
              </button>
              <button
                type="button"
                onClick={() => handleLogProtein(-10)}
                style={{ flex: 1, padding: '12px 10px', borderRadius: '14px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }}
              >
                -10g
              </button>
            </div>
          </div>

          {/* Daily Hydration Tracker */}
          <div className="glass-card" style={{ padding: '24px', borderRadius: '22px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--accent-blue)', letterSpacing: '0.5px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  💧 Daily Hydration Tracker
                </div>
                <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--accent-blue)' }}>
                  {hydrationPercentComplete}%
                </span>
              </div>

              <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--accent-blue)', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                {currentHydration.toFixed(1)} L <span style={{ fontSize: '0.92rem', color: 'var(--text-muted)', fontWeight: 600 }}>/ {targetHydrationGoal} L target</span>
              </div>

              <div style={{ width: '100%', height: '10px', background: 'var(--bg-main)', borderRadius: '10px', marginTop: '14px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                <div style={{ height: '100%', width: `${hydrationPercentComplete}%`, background: 'var(--accent-blue)', borderRadius: '10px', transition: 'width 0.3s ease' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button
                type="button"
                onClick={() => handleLogHydration(0.5)}
                style={{ flex: 1, padding: '12px 10px', borderRadius: '14px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }}
              >
                +0.5 L
              </button>
              <button
                type="button"
                onClick={() => handleLogHydration(1.0)}
                style={{ flex: 1, padding: '12px 10px', borderRadius: '14px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }}
              >
                +1.0 L
              </button>
              <button
                type="button"
                onClick={() => handleLogHydration(-0.5)}
                style={{ flex: 1, padding: '12px 10px', borderRadius: '14px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-muted)', fontSize: '0.95rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }}
              >
                -0.5 L
              </button>
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

          {/* Active Workout Split Routine & Customizer — only shown once the user has a saved custom split */}
          {hasCustomSplit && (
          <div className="glass-card" style={{ padding: '24px', borderRadius: '18px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {isWeekly ? '📅 Weekly Workout Schedule' : `🔄 Workout Rotation Split (${splitList.length} Days)`}
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {isWeekly ? 'Your scheduled workouts mapped to each day of the week.' : 'Your scheduled workouts rotate automatically day by day in this cycle.'}
                </p>
              </div>
              <button 
                onClick={() => setIsEditSplitOpen(true)}
                style={{ background: 'var(--accent-blue-dim)', color: 'var(--accent-blue)', border: '1px solid var(--accent-blue)', padding: '8px 16px', fontSize: '0.84rem', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                + Edit Split
              </button>
            </div>

            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '8px' }}>
              {splitList.map((dayObj, idx) => {
                const isCurrentToday = isWeekly ? idx === (dayOfWeek % splitList.length) : idx === todaySplitIdx;
                const dayName = typeof dayObj === 'string' ? dayObj : dayObj.name;
                const dayHeader = isWeekly ? (WEEKDAYS[idx] || `DAY ${idx + 1}`) : `DAY ${idx + 1}`;
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
                      {isCurrentToday ? `🎯 TODAY (${dayHeader})` : dayHeader}
                    </div>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, marginTop: '4px', color: 'var(--text-main)' }}>
                      {dayName}
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Workout History</h3>
            <button 
              onClick={() => { setIsAddWorkoutOpen(true); setShowForm?.(true); }}
              style={{ 
                background: 'linear-gradient(135deg, #10b981, #059669)', 
                color: '#ffffff', 
                border: 'none', 
                padding: '8px 18px', 
                fontSize: '0.85rem', 
                borderRadius: '30px', 
                fontWeight: 700, 
                cursor: 'pointer', 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '6px',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)'
              }}
            >
              <Plus size={16} /> Add Workout
            </button>
          </div>

          {workouts.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '36px 20px', background: 'var(--bg-card)', borderRadius: '18px', border: '1px dashed var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <Dumbbell size={40} style={{ color: 'var(--accent-blue)', opacity: 0.5 }} />
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>No items logged yet</div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>No items logged yet. Click + to add your first entry</p>
              <button 
                onClick={() => { setIsAddWorkoutOpen(true); setShowForm?.(true); }}
                className="blue-btn"
                style={{ marginTop: '8px', padding: '8px 18px', fontSize: '0.85rem', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={16} /> Log Workout
              </button>
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
      <Modal
        isOpen={isAddWorkoutOpen}
        onClose={closeWorkoutModal}
        title="Log Workout"
        icon={Dumbbell}
        maxWidth="400px"
      >
        <form onSubmit={handleAddWorkout}>
          <div className="input-group" style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600 }}>Title</label>
            <input type="text" required className="glass-input" style={{ width: '100%', padding: '12px 14px', background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '12px' }} placeholder="Enter workout name..." value={workoutForm.title} onChange={e => setWorkoutForm({...workoutForm, title: e.target.value})} autoFocus />
          </div>
          
          <div className="input-group" style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600 }}>Category</label>
            <CustomSelect 
              className="glass-input" 
              style={{ width: '100%', padding: '12px 14px', background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '12px' }} 
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
              <input type="number" required className="glass-input" style={{ width: '100%', padding: '12px 14px', background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '12px' }} placeholder="45" value={workoutForm.duration_mins} onChange={e => setWorkoutForm({...workoutForm, duration_mins: e.target.value})} />
            </div>
            <div className="input-group">
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600 }}>Calories (Optional)</label>
              <input type="number" className="glass-input" style={{ width: '100%', padding: '12px 14px', background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '12px' }} placeholder="Optional (e.g. 300)" value={workoutForm.calories} onChange={e => setWorkoutForm({...workoutForm, calories: e.target.value})} />
            </div>
          </div>

          <div className="input-group" style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600 }}>Notes</label>
            <input type="text" className="glass-input" style={{ width: '100%', padding: '12px 14px', background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '12px' }} placeholder="Enter notes..." value={workoutForm.notes} onChange={e => setWorkoutForm({...workoutForm, notes: e.target.value})} />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" className="secondary-btn" onClick={closeWorkoutModal}>Cancel</button>
            <button type="submit" className="blue-btn">Save Workout</button>
          </div>
        </form>
      </Modal>

      {activeSubTab === 'stats' && (() => {
        const getFilteredStats = () => {
          if (statsHistoryFilter === 'all') return statsList;
          const todayStr = todayKey();
          const [y, m, d] = todayStr.split('-').map(Number);
          
          let limitStr = todayStr;
          if (statsHistoryFilter === '7days' || statsHistoryFilter === '30days') {
            const limitObj = new Date(y, m - 1, d);
            limitObj.setDate(limitObj.getDate() - (statsHistoryFilter === '7days' ? 6 : 29));
            const limitY = limitObj.getFullYear();
            const limitM = String(limitObj.getMonth() + 1).padStart(2, '0');
            const limitD = String(limitObj.getDate()).padStart(2, '0');
            limitStr = `${limitY}-${limitM}-${limitD}`;
          }

          return statsList.filter(stat => {
            if (statsHistoryFilter === 'today') return stat.date === todayStr;
            return stat.date >= limitStr && stat.date <= todayStr;
          });
        };
        const filteredStats = getFilteredStats();
        // Recharts prefers chronological order & fallback target goals so target lines never drop to 0
        const chartData = [...filteredStats].reverse().map(item => ({
          ...item,
          protein: Number(item.protein) || 0,
          weight: Number(item.weight) || 0,
          target_protein: Number(item.target_protein) > 0 ? Number(item.target_protein) : targetProteinGoal,
          target_weight: Number(item.target_weight) > 0 ? Number(item.target_weight) : (targetWeight > 0 ? targetWeight : 0)
        }));

        return (
        <div className="animate-entrance">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', alignItems: 'start' }}>
            
            {/* Left Column: Graphs (Independent Scroll) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', paddingRight: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Trends</h3>
                <CustomSelect
                  className="timeframe-dropdown"
                  value={statsHistoryFilter}
                  onChange={(e) => setStatsHistoryFilter(e.target.value)}
                  options={[
                    { value: '7days', label: 'Past 7 Days' },
                    { value: '30days', label: 'Past 30 Days' },
                    { value: 'all', label: 'All Time' }
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

              {/* Protein Intake Graph */}
              <div className="glass-card" style={{ padding: '24px', borderRadius: '18px', border: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#10b981' }}>Protein Intake (g)</h4>
                  <div style={{ display: 'flex', gap: '14px', fontSize: '0.78rem', fontWeight: 700 }}>
                    <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>● Achieved</span>
                    <span style={{ color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '4px' }}>--- Target ({targetProteinGoal}g)</span>
                  </div>
                </div>
                <div style={{ height: '220px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorProtein" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.35}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                      <XAxis dataKey="date" tick={{fontSize: 12, fill: 'var(--text-muted)'}} tickFormatter={(tick) => tick.slice(5)} axisLine={false} tickLine={false} />
                      <YAxis tick={{fontSize: 12, fill: 'var(--text-muted)'}} axisLine={false} tickLine={false} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', borderRadius: '12px' }}
                        itemStyle={{ color: 'var(--text-main)', fontWeight: 'bold' }}
                        labelStyle={{ color: 'var(--text-muted)', marginBottom: '4px' }}
                      />
                      <Area type="monotone" dataKey="protein" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorProtein)" name="Achieved Protein (g)" />
                      <Line type="monotone" dataKey="target_protein" stroke="var(--accent-blue)" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Protein Goal (g)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Body Weight Trend Graph */}
              <div className="glass-card" style={{ padding: '24px', borderRadius: '18px', border: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>Weight (kg)</h4>
                  <div style={{ display: 'flex', gap: '14px', fontSize: '0.78rem', fontWeight: 700 }}>
                    <span style={{ color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '4px' }}>● Actual</span>
                    <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>--- Target ({targetWeight > 0 ? `${targetWeight}kg` : 'not set'})</span>
                  </div>
                </div>
                <div style={{ height: '220px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                      <XAxis dataKey="date" tick={{fontSize: 12, fill: 'var(--text-muted)'}} tickFormatter={(tick) => tick.slice(5)} axisLine={false} tickLine={false} />
                      <YAxis domain={['auto', 'auto']} tick={{fontSize: 12, fill: 'var(--text-muted)'}} axisLine={false} tickLine={false} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)', borderRadius: '12px' }}
                        itemStyle={{ color: 'var(--text-main)', fontWeight: 'bold' }}
                        labelStyle={{ color: 'var(--text-muted)', marginBottom: '4px' }}
                      />
                      <Line type="monotone" dataKey="weight" stroke="var(--accent-blue)" strokeWidth={3} dot={{r: 4, fill: 'var(--accent-blue)', strokeWidth: 2}} name="Actual Weight (kg)" />
                      <Line type="monotone" dataKey="target_weight" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Target Weight (kg)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Right Column: History Table & Protein Target (Independent Scroll) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', paddingRight: '4px' }}>
              
              {/* Daily Protein Goal & Tracker Card */}
              <div className="glass-card" style={{ padding: '24px', borderRadius: '18px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Target size={18} color="var(--accent-blue)" />
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Daily Protein Goal</h3>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        className="blue-btn" 
                        style={{ padding: '6px 14px', fontSize: '0.82rem', fontWeight: 700 }}
                        onClick={openLogProteinModal}
                      >
                        + Log
                      </button>
                      <button 
                        className="secondary-btn" 
                        style={{ padding: '6px 14px', fontSize: '0.82rem', borderRadius: '10px' }} 
                        onClick={openEditMetricsModal}
                      >
                        Edit
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-blue)' }}>
                      {currentProtein}g
                    </span>
                    {targetProteinGoal > 0 && (
                      <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        / {targetProteinGoal}g daily target
                      </span>
                    )}
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
                  <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                    <button
                      type="button"
                      onClick={() => handleLogProtein(25)}
                      style={{ flex: 1, padding: '7px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      +25g
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLogProtein(30)}
                      style={{ flex: 1, padding: '7px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      +30g
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLogProtein(-10)}
                      style={{ padding: '7px 10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      -10g
                    </button>
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>History</h3>
              </div>

              {filteredStats.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: '36px 20px', background: 'var(--bg-card)', borderRadius: '18px', border: '1px dashed var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <Activity size={40} style={{ color: 'var(--accent-blue)', opacity: 0.5 }} />
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>No items logged yet</div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>No items logged yet. Click + to add your first entry</p>
                  <button 
                    onClick={() => setIsAddStatOpen(true)}
                    className="blue-btn"
                    style={{ marginTop: '8px', padding: '8px 18px', fontSize: '0.85rem', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Plus size={16} /> Log Body Stat
                  </button>
                </div>
              ) : (
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
              )}
            </div>

          </div>
        </div>
        );
      })()}

      {/* Log Protein Modal */}
      <Modal
        isOpen={isLogProteinOpen}
        onClose={closeLogProteinModal}
        title="Log Protein Intake"
        icon={Flame}
        maxWidth="400px"
      >
        <form onSubmit={handleAddProtein}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>Protein Consumed Today (grams)</label>
            <input 
              type="number" 
              value={proteinInput} 
              onChange={(e) => setProteinInput(e.target.value)} 
              className="glass-input" 
              style={{ width: '100%', padding: '12px 14px', fontSize: '1.2rem', textAlign: 'center', fontWeight: 700, background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '12px' }} 
              placeholder="e.g. 25"
              autoFocus
            />
          </div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', justifyContent: 'center' }}>
            <button type="button" className="secondary-btn" onClick={() => handleLogProtein(25)} style={{ padding: '8px 16px', fontSize: '0.9rem' }}>+25g</button>
            <button type="button" className="secondary-btn" onClick={() => handleLogProtein(30)} style={{ padding: '8px 16px', fontSize: '0.9rem' }}>+30g</button>
            <button type="button" className="secondary-btn" onClick={() => handleLogProtein(-10)} style={{ padding: '8px 16px', fontSize: '0.9rem' }}>-10g</button>
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
            <button type="button" className="secondary-btn" onClick={handleResetProtein} style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)', padding: '8px 14px', fontSize: '0.85rem' }}>Reset to 0g</button>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" className="secondary-btn" onClick={closeLogProteinModal}>Cancel</button>
              <button type="submit" className="blue-btn">Save Protein</button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Edit Body Metrics & Goals Modal */}
      <Modal
        isOpen={isEditMetricsOpen}
        onClose={closeEditMetricsModal}
        title="Edit Body Metrics & Goals"
        icon={Target}
        maxWidth="400px"
      >
        <form onSubmit={handleAddStats}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div className="input-group">
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600 }}>Current Weight (kg)</label>
              <input type="number" step="0.1" required className="glass-input" style={{ width: '100%', padding: '12px 14px', background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '12px' }} placeholder="75.5" value={statsForm.weight} onChange={e => setStatsForm({...statsForm, weight: e.target.value})} />
            </div>
            <div className="input-group">
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600 }}>Target Weight (kg)</label>
              <input type="number" step="0.1" className="glass-input" style={{ width: '100%', padding: '12px 14px', background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '12px' }} placeholder="70" value={statsForm.target_weight} onChange={e => setStatsForm({...statsForm, target_weight: e.target.value})} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px', marginBottom: '24px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Daily Protein Goal (g)</label>
              <input 
                type="number" 
                value={statsForm.target_protein} 
                onChange={(e) => setStatsForm({...statsForm, target_protein: e.target.value})} 
                className="glass-input" 
                style={{ width: '100%', padding: '12px 14px', fontSize: '0.95rem', background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '12px' }} 
                placeholder="e.g. 150"
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" className="secondary-btn" onClick={closeEditMetricsModal}>Cancel</button>
            <button type="submit" className="blue-btn">Save</button>
          </div>
        </form>
      </Modal>

      {/* Customize Workout Split Modal */}
      <Modal
        isOpen={isEditSplitOpen}
        onClose={() => setIsEditSplitOpen(false)}
        title="Customize Workout Split"
        icon={Dumbbell}
        maxWidth="460px"
      >
        <div style={{ paddingBottom: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0 }}>
            {isWeekly 
              ? "Configure your workout routine for each day of the week (Monday – Sunday)."
              : "Your workouts will automatically rotate day by day in this order."}
          </p>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>Split Type:</label>
            <CustomSelect 
              className="glass-input"
              style={{ width: '220px', padding: '8px 12px', fontSize: '0.84rem', background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '10px' }}
              value={workoutSettings.split_type || 'weekly'}
              onChange={(e) => {
                const newType = e.target.value;
                setWorkoutSettings(prev => ({...prev, split_type: newType}));
                fetch(getApiUrl('/api/settings'), {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                  body: JSON.stringify({ workout_split_type: newType })
                }).catch(err => console.error('Failed to update split type:', err));
              }}
              options={[
                { value: "weekly", label: "Weekly Schedule (Mon - Sun)" },
                { value: "rotational", label: "Sequential Rotation (Day 1...)" }
              ]}
            />
          </div>

          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '12px', 
            maxHeight: '340px', 
            overflowY: 'auto', 
            paddingRight: '4px',
            WebkitOverflowScrolling: 'touch' 
          }}>
            {splitList.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem', background: 'var(--bg-main)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                {isWeekly
                  ? "No weekly split days added yet. Type a split day name below and click + Add to create your routine for Monday - Sunday."
                  : "No split days added yet. Type a split day name below and click + Add to create your routine."}
              </div>
            ) : (
              splitList.map((itemObj, idx) => {
                const item = typeof itemObj === 'string' ? { name: itemObj, exercises: [] } : itemObj;
                const weekdayName = WEEKDAYS[idx];
                const cardHeader = isWeekly 
                  ? (weekdayName ? `${weekdayName}: ${item.name}` : `Day ${idx + 1}: ${item.name}`)
                  : `Day ${idx + 1}: ${item.name}`;

                return (
                  <div key={idx} style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '10px', 
                    padding: '14px', 
                    borderRadius: '14px', 
                    background: 'var(--bg-main)', 
                    border: '1px solid var(--border-color)',
                    boxSizing: 'border-box',
                    width: '100%'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)' }}>
                        {cardHeader}
                      </span>
                      <button 
                        type="button"
                        onClick={() => saveSplitList(splitList.filter((_, i) => i !== idx))}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                        title="Remove Day"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div style={{ paddingLeft: '8px', borderLeft: '2px solid var(--border-color)' }}>
                      {item.exercises && item.exercises.length > 0 ? (
                        item.exercises.map((ex, eIdx) => (
                          <div key={eIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', marginBottom: '6px' }}>
                            <span style={{ fontWeight: 600 }}>{ex.name}</span>
                            <span style={{ color: 'var(--text-muted)' }}>{ex.sets}</span>
                          </div>
                        ))
                      ) : (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '6px' }}>No exercises added.</div>
                      )}

                      {/* Exercise Input Row - Clean Wrap & Mobile Friendly */}
                      <div style={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: '8px', 
                        marginTop: '10px', 
                        width: '100%', 
                        boxSizing: 'border-box',
                        alignItems: 'center'
                      }}>
                        <input 
                          type="text" 
                          placeholder="Exercise (e.g. Dips)" 
                          id={`ex-name-${idx}`}
                          className="glass-input" 
                          style={{ 
                            flex: '1 1 120px', 
                            minWidth: 0, 
                            padding: '8px 12px', 
                            fontSize: '0.78rem', 
                            background: 'var(--bg-main)', 
                            color: 'var(--text-main)', 
                            border: '1px solid var(--border-color)', 
                            borderRadius: '10px', 
                            boxSizing: 'border-box' 
                          }}
                        />
                        <input 
                          type="text" 
                          placeholder="Sets (e.g. 5x2)" 
                          id={`ex-sets-${idx}`}
                          className="glass-input" 
                          style={{ 
                            flex: '1 1 80px', 
                            minWidth: 0, 
                            padding: '8px 12px', 
                            fontSize: '0.78rem', 
                            background: 'var(--bg-main)', 
                            color: 'var(--text-main)', 
                            border: '1px solid var(--border-color)', 
                            borderRadius: '10px', 
                            boxSizing: 'border-box' 
                          }}
                        />
                        <button 
                          type="button" 
                          className="secondary-btn" 
                          style={{ 
                            padding: '8px 14px', 
                            fontSize: '0.78rem', 
                            fontWeight: 700, 
                            whiteSpace: 'nowrap', 
                            flexShrink: 0, 
                            boxSizing: 'border-box',
                            borderRadius: '10px'
                          }}
                          onClick={() => {
                            const nameEl = document.getElementById(`ex-name-${idx}`);
                            const setsEl = document.getElementById(`ex-sets-${idx}`);
                            const name = nameEl?.value;
                            const sets = setsEl?.value;
                            if (name && sets) {
                              const newList = [...splitList];
                              const current = typeof newList[idx] === 'string' 
                                ? { name: newList[idx], exercises: [] } 
                                : { ...newList[idx], exercises: newList[idx].exercises ? [...newList[idx].exercises] : [] };
                              current.exercises.push({ name, sets });
                              newList[idx] = current;
                              saveSplitList(newList);
                              if (nameEl) nameEl.value = '';
                              if (setsEl) setsEl.value = '';
                            }
                          }}
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            if (newSplitName.trim()) {
              saveSplitList([...splitList, { name: newSplitName.trim(), exercises: [] }]);
              setNewSplitName('');
            }
          }} style={{ display: 'flex', gap: '8px', width: '100%', boxSizing: 'border-box' }}>
            <input 
              type="text" 
              placeholder={isWeekly && splitList.length < 7 
                ? `Add workout for ${WEEKDAYS[splitList.length]} (e.g. Push Day)...` 
                : "Add new split day (e.g. Arms Day)..."} 
              value={newSplitName} 
              onChange={(e) => setNewSplitName(e.target.value)} 
              className="glass-input" 
              style={{ flex: '1 1 180px', minWidth: 0, padding: '10px 14px', fontSize: '0.84rem', background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '12px', boxSizing: 'border-box' }}
            />
            <button type="submit" className="blue-btn" style={{ padding: '10px 16px', fontSize: '0.84rem', whiteSpace: 'nowrap', flexShrink: 0, borderRadius: '12px' }}>+ Add</button>
          </form>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
            <button 
              type="button" 
              onClick={() => saveSplitList([])}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Clear All Split Days
            </button>
            <button type="button" className="blue-btn" style={{ padding: '10px 24px', borderRadius: '12px' }} onClick={() => {
              setIsEditSplitOpen(false);
              setHasCustomSplit(true);
              fetch(getApiUrl('/api/settings'), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ workout_templates: JSON.stringify(splitList) })
              }).catch(err => console.error('Failed to update templates:', err));
            }}>Done</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

