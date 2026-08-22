import { useState } from 'react';
import { useWorkouts, useBodyStats } from '../../hooks/useQueries';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { useDate } from '../../hooks/useUtils';
import { Plus, Dumbbell, Target, Edit2, Trash2, Activity, Flame, Clock } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import ConfirmModal from '../../components/ui/ConfirmModal';

const SPLITS = ['Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Full Body', 'Cardio', 'Rest'];

export function BodyTab({ user }: { user: any }) {
  const { workouts, isLoading: workoutsLoading, createWorkout, updateWorkout, deleteWorkout } = useWorkouts();
  const { bodyStats, isLoading: statsLoading, createBodyStat, updateBodyStat, deleteBodyStat } = useBodyStats();
  const { todayKey, formatDate } = useDate();
  const [activeSubTab, setActiveSubTab] = useState<'workouts' | 'stats'>('workouts');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    split: 'Push',
    date: todayKey(),
    duration_mins: '',
    calories: '',
    weight_kg: '',
    sets: '',
    reps: '',
    notes: '',
  });

  const today = todayKey();
  const todayWorkouts = workouts.filter(w => w.date === today);
  const latestStats = bodyStats[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() && activeSubTab === 'workouts') return;
    try {
      if (editingItem) {
        if (activeSubTab === 'workouts') await updateWorkout(editingItem.id, formData);
        else await updateBodyStat(editingItem.id, formData);
      } else {
        if (activeSubTab === 'workouts') await createWorkout(formData);
        else await createBodyStat(formData);
      }
      setShowAddModal(false);
      setEditingItem(null);
      resetForm();
    } catch (err) {
      console.error('Failed to save:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      split: 'Push',
      date: todayKey(),
      duration_mins: '',
      calories: '',
      weight_kg: '',
      sets: '',
      reps: '',
      notes: '',
    });
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData(item);
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    try {
      if (activeSubTab === 'workouts') await deleteWorkout(id);
      else await deleteBodyStat(id);
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  if (workoutsLoading || statsLoading) return <div className="loading-state">Loading...</div>;

  return (
    <div className="body-tab">
      <div className="tab-header">
        <h2 className="tab-title">Body & Gym</h2>
        <div className="sub-tabs">
          <button className={activeSubTab === 'workouts' ? 'active' : ''} onClick={() => setActiveSubTab('workouts')}>
            <Dumbbell size={16} /> Workouts
          </button>
          <button className={activeSubTab === 'stats' ? 'active' : ''} onClick={() => setActiveSubTab('stats')}>
            <Target size={16} /> Body Stats
          </button>
        </div>
      </div>

      {activeSubTab === 'workouts' && (
        <>
          <button onClick={() => { resetForm(); setShowAddModal(true); }} className="blue-btn add-workout-btn">
            <Plus size={18} />
            <span>Log Workout</span>
          </button>
          
          {workouts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Dumbbell size={48} /></div>
              <h3>No workouts yet</h3>
              <p>Start tracking your fitness journey</p>
            </div>
          ) : (
            <div className="workouts-list">
              <h3>Recent Workouts</h3>
              <ul>
                {workouts.slice(0, 10).map((workout) => (
                  <li key={workout.id} className="workout-item">
                    <div className="workout-info">
                      <span className="workout-title">{workout.title || workout.split}</span>
                      <span className="workout-split">{workout.split}</span>
                    </div>
                    <div className="workout-details">
                      {workout.duration_mins && <span>{workout.duration_mins} min</span>}
                      {workout.calories && <span>{workout.calories} cal</span>}
                    </div>
                    <div className="workout-actions">
                      <button onClick={() => handleEdit(workout)} className="icon-btn"><Edit2 size={16} /></button>
                      <button onClick={() => setDeleteConfirmId(workout.id)} className="icon-btn"><Trash2 size={16} /></button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); resetForm(); }} title={editingItem ? 'Edit Workout' : 'Log Workout'} size="lg">
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-field">
                <label htmlFor="title">Workout Name</label>
                <input id="title" type="text" value={formData.title} onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))} placeholder="e.g., Chest & Triceps" autoFocus />
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="split">Split</label>
                  <select id="split" value={formData.split} onChange={(e) => setFormData(prev => ({ ...prev, split: e.target.value }))}>
                    {SPLITS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor="date">Date</label>
                  <input id="date" type="date" value={formData.date} onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="duration_mins">Duration (min)</label>
                  <input id="duration_mins" type="number" value={formData.duration_mins} onChange={(e) => setFormData(prev => ({ ...prev, duration_mins: e.target.value }))} placeholder="45" />
                </div>
                <div className="form-field">
                  <label htmlFor="calories">Calories</label>
                  <input id="calories" type="number" value={formData.calories} onChange={(e) => setFormData(prev => ({ ...prev, calories: e.target.value }))} placeholder="300" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="sets">Sets</label>
                  <input id="sets" type="number" value={formData.sets} onChange={(e) => setFormData(prev => ({ ...prev, sets: e.target.value }))} />
                </div>
                <div className="form-field">
                  <label htmlFor="reps">Reps</label>
                  <input id="reps" type="number" value={formData.reps} onChange={(e) => setFormData(prev => ({ ...prev, reps: e.target.value }))} />
                </div>
              </div>
              <div className="form-field">
                <label htmlFor="notes">Notes</label>
                <textarea id="notes" value={formData.notes} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} rows={3} />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => { setShowAddModal(false); resetForm(); }} className="secondary-btn">Cancel</button>
                <button type="submit" className="blue-btn">{editingItem ? 'Save Changes' : 'Log Workout'}</button>
              </div>
            </form>
          </Modal>
        </>
      )}

      {activeSubTab === 'stats' && (
        <>
          <div className="stats-summary">
            {latestStats && (
              <>
                <div className="stat-card">
                  <h4>Weight</h4>
                  <p>{latestStats.weight} kg</p>
                </div>
                {latestStats.target_weight && (
                  <div className="stat-card">
                    <h4>Target</h4>
                    <p>{latestStats.target_weight} kg</p>
                  </div>
                )}
                <div className="stat-card">
                  <h4>Protein</h4>
                  <p>{latestStats.protein}g</p>
                </div>
                {latestStats.hydration && (
                  <div className="stat-card">
                    <h4>Water</h4>
                    <p>{latestStats.hydration}L</p>
                  </div>
                )}
              </>
            )}
          </div>
          
          <button onClick={() => { resetForm(); setFormData(prev => ({ ...prev, date: todayKey() })); setShowAddModal(true); }} className="blue-btn add-stats-btn">
            <Plus size={18} />
            <span>Log Stats</span>
          </button>

          {bodyStats.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Target size={48} /></div>
              <h3>No body stats yet</h3>
              <p>Track your weight, protein, and hydration</p>
            </div>
          ) : (
            <div className="stats-history">
              <h3>History</h3>
              <ul>
                {bodyStats.slice(0, 10).map((stat) => (
                  <li key={stat.id} className="stat-item">
                    <span className="stat-date">{formatDate(stat.date)}</span>
                    <div className="stat-values">
                      {stat.weight && <span>{stat.weight} kg</span>}
                      {stat.protein && <span>{stat.protein}g protein</span>}
                      {stat.hydration && <span>{stat.hydration}L water</span>}
                    </div>
                    <div className="stat-actions">
                      <button onClick={() => handleEdit(stat)} className="icon-btn"><Edit2 size={16} /></button>
                      <button onClick={() => setDeleteConfirmId(stat.id)} className="icon-btn"><Trash2 size={16} /></button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); resetForm(); }} title={editingItem ? 'Edit Body Stats' : 'Log Body Stats'} size="lg">
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="date">Date</label>
                  <input id="date" type="date" value={formData.date} onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))} />
                </div>
                <div className="form-field">
                  <label htmlFor="weight">Weight (kg)</label>
                  <input id="weight" type="number" step="0.1" value={formData.weight_kg} onChange={(e) => setFormData(prev => ({ ...prev, weight_kg: e.target.value }))} placeholder="75.5" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="target_weight">Target Weight (kg)</label>
                  <input id="target_weight" type="number" step="0.1" value={formData.target_weight} onChange={(e) => setFormData(prev => ({ ...prev, target_weight: e.target.value }))} placeholder="70" />
                </div>
                <div className="form-field">
                  <label htmlFor="protein">Protein (g)</label>
                  <input id="protein" type="number" value={formData.protein} onChange={(e) => setFormData(prev => ({ ...prev, protein: e.target.value }))} placeholder="150" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="hydration">Water (L)</label>
                  <input id="hydration" type="number" step="0.1" value={formData.hydration} onChange={(e) => setFormData(prev => ({ ...prev, hydration: e.target.value }))} placeholder="2.5" />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => { setShowAddModal(false); resetForm(); }} className="secondary-btn">Cancel</button>
                <button type="submit" className="blue-btn">{editingItem ? 'Save Changes' : 'Log Stats'}</button>
              </div>
            </form>
          </Modal>
        </>
      )}

      <ConfirmModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => handleDelete(deleteConfirmId!)}
        title="Delete"
        message="Are you sure you want to delete this entry?"
        confirmText="Delete"
        confirmClass="contrast-btn"
        icon="danger"
      />
    </div>
  );
}