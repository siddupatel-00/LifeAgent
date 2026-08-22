import { useState } from 'react';
import { useWorkouts, useBodyStats } from '../../hooks/useQueries';
import { useDate } from '../../hooks/useUtils';
import { Plus, Dumbbell, Target, Edit2, Trash2, Flame, Timer } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import ConfirmModal from '../../components/ui/ConfirmModal';

const CATEGORIES = ['Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Full Body', 'Cardio', 'General'];

export function BodyTab() {
  const { workouts, isLoading: workoutsLoading, createWorkout, updateWorkout, deleteWorkout } = useWorkouts();
  const { bodyStats, isLoading: statsLoading, createBodyStat, updateBodyStat, deleteBodyStat } = useBodyStats();
  const { todayKey, formatDate } = useDate();
  const [activeSubTab, setActiveSubTab] = useState<'workouts' | 'stats'>('workouts');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<'workouts' | 'stats'>('workouts');
  const [actionError, setActionError] = useState('');
  const [workoutForm, setWorkoutForm] = useState({
    title: '',
    category: 'Full Body',
    date: todayKey(),
    duration_mins: '',
    calories: '',
    notes: '',
  });
  const [statForm, setStatForm] = useState({
    date: todayKey(),
    weight: '',
    target_weight: '',
    protein: '',
    target_protein: '',
    hydration: '',
  });

  const today = todayKey();
  const latestStats = bodyStats[0];

  const handleWorkoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workoutForm.title.trim()) return;
    setActionError('');
    try {
      if (editingItem) {
        await updateWorkout(editingItem.id, workoutForm);
      } else {
        await createWorkout(workoutForm);
      }
      setShowAddModal(false);
      setEditingItem(null);
      resetForms();
    } catch (err: any) {
      setActionError(err.message || 'Failed to save workout');
    }
  };

  const handleStatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError('');
    try {
      if (editingItem) {
        await updateBodyStat(editingItem.id, statForm);
      } else {
        await createBodyStat(statForm);
      }
      setShowAddModal(false);
      setEditingItem(null);
      resetForms();
    } catch (err: any) {
      setActionError(err.message || 'Failed to save stats');
    }
  };

  const resetForms = () => {
    setWorkoutForm({ title: '', category: 'Full Body', date: todayKey(), duration_mins: '', calories: '', notes: '' });
    setStatForm({ date: todayKey(), weight: '', target_weight: '', protein: '', target_protein: '', hydration: '' });
  };

  const handleEditWorkout = (workout: any) => {
    setActiveSubTab('workouts');
    setEditingItem(workout);
    setWorkoutForm({
      title: workout.title,
      category: workout.category || 'General',
      date: workout.date,
      duration_mins: workout.duration_mins ? String(workout.duration_mins) : '',
      calories: workout.calories ? String(workout.calories) : '',
      notes: workout.notes || '',
    });
    setShowAddModal(true);
  };

  const handleEditStat = (stat: any) => {
    setActiveSubTab('stats');
    setEditingItem(stat);
    setStatForm({
      date: stat.date,
      weight: stat.weight ? String(stat.weight) : '',
      target_weight: stat.target_weight ? String(stat.target_weight) : '',
      protein: stat.protein ? String(stat.protein) : '',
      target_protein: stat.target_protein ? String(stat.target_protein) : '',
      hydration: stat.hydration ? String(stat.hydration) : '',
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: number) => {
    try {
      if (deleteTarget === 'workouts') await deleteWorkout(id);
      else await deleteBodyStat(id);
      setDeleteConfirmId(null);
    } catch (err: any) {
      setActionError(err.message || 'Failed to delete');
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
            <Target size={16} /> Stats
          </button>
        </div>
      </div>

      {actionError && <div className="form-error">{actionError}</div>}

      {activeSubTab === 'workouts' && (
        <>
          <button onClick={() => { setEditingItem(null); resetForms(); setShowAddModal(true); }} className="blue-btn add-workout-btn">
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
            <ul className="workouts-list">
              {workouts.slice(0, 20).map((workout) => (
                <li key={workout.id} className={`workout-item ${workout.date === today ? 'today' : ''}`}>
                  <span className="workout-category-chip">{workout.category}</span>
                  <div className="workout-info">
                    <span className="workout-title">{workout.title}</span>
                    <span className="workout-date">{formatDate(workout.date)}</span>
                  </div>
                  <div className="workout-details">
                    {!!workout.duration_mins && <span><Timer size={13} /> {workout.duration_mins}m</span>}
                    {!!workout.calories && <span><Flame size={13} /> {workout.calories}</span>}
                  </div>
                  <div className="workout-actions">
                    <button onClick={() => handleEditWorkout(workout)} className="icon-btn" aria-label="Edit"><Edit2 size={16} /></button>
                    <button onClick={() => { setDeleteTarget('workouts'); setDeleteConfirmId(workout.id); }} className="icon-btn" aria-label="Delete"><Trash2 size={16} /></button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); setEditingItem(null); }} title={editingItem ? 'Edit Workout' : 'Log Workout'} size="lg">
            <form onSubmit={handleWorkoutSubmit} className="modal-form">
              <div className="form-field">
                <label htmlFor="w-title">Workout Name</label>
                <input id="w-title" type="text" value={workoutForm.title} onChange={(e) => setWorkoutForm(prev => ({ ...prev, title: e.target.value }))} placeholder="e.g., Chest & Triceps" required autoFocus />
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="w-category">Category</label>
                  <select id="w-category" value={workoutForm.category} onChange={(e) => setWorkoutForm(prev => ({ ...prev, category: e.target.value }))}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor="w-date">Date</label>
                  <input id="w-date" type="date" value={workoutForm.date} onChange={(e) => setWorkoutForm(prev => ({ ...prev, date: e.target.value }))} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="w-duration">Duration (min)</label>
                  <input id="w-duration" type="number" min="0" value={workoutForm.duration_mins} onChange={(e) => setWorkoutForm(prev => ({ ...prev, duration_mins: e.target.value }))} placeholder="45" />
                </div>
                <div className="form-field">
                  <label htmlFor="w-calories">Calories</label>
                  <input id="w-calories" type="number" min="0" value={workoutForm.calories} onChange={(e) => setWorkoutForm(prev => ({ ...prev, calories: e.target.value }))} placeholder="300" />
                </div>
              </div>
              <div className="form-field">
                <label htmlFor="w-notes">Notes</label>
                <textarea id="w-notes" value={workoutForm.notes} onChange={(e) => setWorkoutForm(prev => ({ ...prev, notes: e.target.value }))} rows={3} />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => { setShowAddModal(false); setEditingItem(null); }} className="secondary-btn">Cancel</button>
                <button type="submit" className="blue-btn">{editingItem ? 'Save Changes' : 'Log Workout'}</button>
              </div>
            </form>
          </Modal>
        </>
      )}

      {activeSubTab === 'stats' && (
        <>
          {latestStats && (
            <div className="stats-summary">
              <div className="stat-card">
                <h4>Weight</h4>
                <p>{latestStats.weight ?? '—'}<small> kg</small></p>
              </div>
              <div className="stat-card">
                <h4>Protein</h4>
                <p>{latestStats.protein ?? '—'}<small> g</small></p>
              </div>
              <div className="stat-card">
                <h4>Water</h4>
                <p>{latestStats.hydration ?? '—'}<small> L</small></p>
              </div>
            </div>
          )}

          <button onClick={() => { setEditingItem(null); resetForms(); setShowAddModal(true); }} className="blue-btn add-stats-btn">
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
            <ul className="stats-history">
              {bodyStats.slice(0, 20).map((stat) => (
                <li key={stat.id} className="stat-item">
                  <span className="stat-date">{formatDate(stat.date)}</span>
                  <div className="stat-values">
                    {!!stat.weight && <span>{stat.weight} kg</span>}
                    {!!stat.protein && <span>{stat.protein}g protein</span>}
                    {!!stat.hydration && <span>{stat.hydration}L water</span>}
                  </div>
                  <div className="stat-actions">
                    <button onClick={() => handleEditStat(stat)} className="icon-btn" aria-label="Edit"><Edit2 size={16} /></button>
                    <button onClick={() => { setDeleteTarget('stats'); setDeleteConfirmId(stat.id); }} className="icon-btn" aria-label="Delete"><Trash2 size={16} /></button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); setEditingItem(null); }} title={editingItem ? 'Edit Stats' : 'Log Stats'} size="lg">
            <form onSubmit={handleStatSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="s-date">Date</label>
                  <input id="s-date" type="date" value={statForm.date} onChange={(e) => setStatForm(prev => ({ ...prev, date: e.target.value }))} />
                </div>
                <div className="form-field">
                  <label htmlFor="s-weight">Weight (kg)</label>
                  <input id="s-weight" type="number" step="0.1" value={statForm.weight} onChange={(e) => setStatForm(prev => ({ ...prev, weight: e.target.value }))} placeholder="75.5" autoFocus />
                </div>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="s-target-weight">Target Weight (kg)</label>
                  <input id="s-target-weight" type="number" step="0.1" value={statForm.target_weight} onChange={(e) => setStatForm(prev => ({ ...prev, target_weight: e.target.value }))} placeholder="70" />
                </div>
                <div className="form-field">
                  <label htmlFor="s-protein">Protein (g)</label>
                  <input id="s-protein" type="number" value={statForm.protein} onChange={(e) => setStatForm(prev => ({ ...prev, protein: e.target.value }))} placeholder="150" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label htmlFor="s-target-protein">Target Protein (g)</label>
                  <input id="s-target-protein" type="number" value={statForm.target_protein} onChange={(e) => setStatForm(prev => ({ ...prev, target_protein: e.target.value }))} placeholder="160" />
                </div>
                <div className="form-field">
                  <label htmlFor="s-hydration">Water (L)</label>
                  <input id="s-hydration" type="number" step="0.1" value={statForm.hydration} onChange={(e) => setStatForm(prev => ({ ...prev, hydration: e.target.value }))} placeholder="2.5" />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => { setShowAddModal(false); setEditingItem(null); }} className="secondary-btn">Cancel</button>
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
        title="Delete Entry"
        message="Are you sure you want to delete this entry?"
        confirmText="Delete"
        confirmClass="contrast-btn"
        icon="danger"
      />
    </div>
  );
}

export default BodyTab;
