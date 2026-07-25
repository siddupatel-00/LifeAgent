import React, { useState, useEffect } from 'react';
import { Dumbbell, Target, Plus, Trash2, Activity, Flame, Clock } from 'lucide-react';
import { todayKey } from '../utils/date';

export default function BodyGym({ token, showToast }) {
  const [activeSubTab, setActiveSubTab] = useState('workouts'); // 'workouts', 'stats'
  const [workouts, setWorkouts] = useState([]);
  const [bodyStats, setBodyStats] = useState([]);

  // Workout form state
  const [isAddWorkoutOpen, setIsAddWorkoutOpen] = useState(false);
  const [workoutForm, setWorkoutForm] = useState({
    title: '', category: 'General', duration_mins: '', calories: '', notes: ''
  });

  // Body stats form state
  const [isAddStatsOpen, setIsAddStatsOpen] = useState(false);
  const [statsForm, setStatsForm] = useState({
    weight: '', target_weight: '', protein: '', hydration: ''
  });

  const fetchWorkouts = async () => {
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
  };

  const fetchStats = async () => {
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
  };

  useEffect(() => {
    if (token) {
      fetchWorkouts();
      fetchStats();
    }
  }, [token]);

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
        setIsAddWorkoutOpen(false);
        setWorkoutForm({ title: '', category: 'General', duration_mins: '', calories: '', notes: '' });
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

  const handleAddStats = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        weight: Number(statsForm.weight) || 0,
        target_weight: Number(statsForm.target_weight) || 0,
        protein: Number(statsForm.protein) || 0,
        hydration: Number(statsForm.hydration) || 0,
        date: todayKey()
      };
      
      const res = await fetch('/api/fitness?type=body-stats', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        showToast('Stats Updated', 'success');
        setIsAddStatsOpen(false);
        setStatsForm({ weight: '', target_weight: '', protein: '', hydration: '' });
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

  // Derived metrics for body stats
  const latestStat = bodyStats.length > 0 ? bodyStats[0] : null;
  
  const last7Days = bodyStats.slice(0, 7).reverse();
  const maxWeight = Math.max(...last7Days.map(s => s.weight || 0), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Sub-tab navigation */}
      <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
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
                      <span>{workout.calories} kcal</span>
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

          {/* Add Workout Modal */}
          {isAddWorkoutOpen && (
            <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="glass-card animate-entrance" style={{ background: 'var(--bg-card)', padding: '32px', borderRadius: '24px', width: '90%', maxWidth: '400px', border: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '20px' }}>Log Workout</h3>
                <form onSubmit={handleAddWorkout}>
                  <div className="input-group" style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600 }}>Title</label>
                    <input type="text" required className="glass-input" style={{ width: '100%', padding: '10px 14px' }} placeholder="Enter workout name..." value={workoutForm.title} onChange={e => setWorkoutForm({...workoutForm, title: e.target.value})} />
                  </div>
                  
                  <div className="input-group" style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600 }}>Category</label>
                    <select className="glass-input" style={{ width: '100%', padding: '10px 14px' }} value={workoutForm.category} onChange={e => setWorkoutForm({...workoutForm, category: e.target.value})}>
                      <option value="General">General</option>
                      <option value="Cardio">Cardio</option>
                      <option value="Strength">Strength</option>
                      <option value="Flexibility">Flexibility</option>
                      <option value="Sports">Sports</option>
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div className="input-group">
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600 }}>Duration (mins)</label>
                      <input type="number" required className="glass-input" style={{ width: '100%', padding: '10px 14px' }} placeholder="45" value={workoutForm.duration_mins} onChange={e => setWorkoutForm({...workoutForm, duration_mins: e.target.value})} />
                    </div>
                    <div className="input-group">
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600 }}>Calories</label>
                      <input type="number" className="glass-input" style={{ width: '100%', padding: '10px 14px' }} placeholder="300" value={workoutForm.calories} onChange={e => setWorkoutForm({...workoutForm, calories: e.target.value})} />
                    </div>
                  </div>

                  <div className="input-group" style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600 }}>Notes</label>
                    <input type="text" className="glass-input" style={{ width: '100%', padding: '10px 14px' }} placeholder="Enter notes..." value={workoutForm.notes} onChange={e => setWorkoutForm({...workoutForm, notes: e.target.value})} />
                  </div>

                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button type="button" className="secondary-btn" onClick={() => setIsAddWorkoutOpen(false)}>Cancel</button>
                    <button type="submit" className="blue-btn">Save Workout</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'stats' && (
        <div className="animate-entrance">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
            {/* Current Stats */}
            <div className="glass-card" style={{ padding: '24px', borderRadius: '18px', border: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Current Stats</h3>
                <button className="blue-btn" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => setIsAddStatsOpen(true)}>Log Stats</button>
              </div>

              {latestStat ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Weight</span>
                    <span style={{ fontWeight: 800, fontSize: '1.2rem' }}>{latestStat.weight} kg</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Target Weight</span>
                    <span style={{ fontWeight: 800, fontSize: '1.2rem' }}>{latestStat.target_weight} kg</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Daily Protein</span>
                    <span style={{ fontWeight: 800, fontSize: '1.2rem' }}>{latestStat.protein} g</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Hydration</span>
                    <span style={{ fontWeight: 800, fontSize: '1.2rem' }}>{latestStat.hydration} L</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right', marginTop: '8px' }}>
                    Last updated: {latestStat.date}
                  </div>
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>No stats recorded yet.</p>
              )}
            </div>

            {/* Weight Trend */}
            <div className="glass-card" style={{ padding: '24px', borderRadius: '18px', border: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '20px' }}>Weight Trend (7 Days)</h3>
              {last7Days.length > 0 ? (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '120px', marginTop: '30px' }}>
                  {last7Days.map((day, idx) => (
                    <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', width: '100%' }}>
                        <div style={{ 
                          width: '100%', 
                          background: 'var(--accent-blue)', 
                          borderRadius: '6px 6px 0 0',
                          height: `${(day.weight / maxWeight) * 100}%`,
                          minHeight: '4px',
                          opacity: idx === last7Days.length - 1 ? 1 : 0.6
                        }} />
                      </div>
                      <span style={{ fontSize: '0.7rem', marginTop: '8px', color: 'var(--text-muted)' }}>
                        {day.date.split('-')[2]}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>Not enough data.</p>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>History</h3>
          </div>

          {bodyStats.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', background: 'var(--bg-card)', borderRadius: '18px', border: '1px solid var(--border-color)' }}>
              <p style={{ color: 'var(--text-muted)' }}>No stats recorded yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {bodyStats.map(stat => (
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
          )}

          {/* Add Stats Modal */}
          {isAddStatsOpen && (
            <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="glass-card animate-entrance" style={{ background: 'var(--bg-card)', padding: '32px', borderRadius: '24px', width: '90%', maxWidth: '400px', border: '1px solid var(--border-color)' }}>
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
                    <div className="input-group">
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600 }}>Protein (g)</label>
                      <input type="number" className="glass-input" style={{ width: '100%', padding: '10px 14px' }} placeholder="120" value={statsForm.protein} onChange={e => setStatsForm({...statsForm, protein: e.target.value})} />
                    </div>
                    <div className="input-group">
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 600 }}>Hydration (L)</label>
                      <input type="number" step="0.1" className="glass-input" style={{ width: '100%', padding: '10px 14px' }} placeholder="2.5" value={statsForm.hydration} onChange={e => setStatsForm({...statsForm, hydration: e.target.value})} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button type="button" className="secondary-btn" onClick={() => setIsAddStatsOpen(false)}>Cancel</button>
                    <button type="submit" className="blue-btn">Save Stats</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
