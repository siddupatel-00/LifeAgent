import { useState } from 'react';
import { useSleepLogs } from '../../hooks/useQueries';
import { useDate } from '../../hooks/useUtils';
import { Plus, Moon, Edit2, Trash2, Sun } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import ConfirmModal from '../../components/ui/ConfirmModal';

const QUALITIES = ['Excellent', 'Good', 'Fair', 'Poor'];

export function SleepTab() {
  const { sleepLogs, isLoading, createSleepLog, updateSleepLog, deleteSleepLog } = useSleepLogs();
  const { todayKey, formatDate } = useDate();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLog, setEditingLog] = useState<any>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [actionError, setActionError] = useState('');
  const [formData, setFormData] = useState({
    date: todayKey(),
    sleep_time: '23:00',
    wake_time: '07:00',
    quality: 'Good',
    notes: '',
  });

  const today = todayKey();
  const lastNightLog = sleepLogs.find(l => l.date === today);
  const recentLogs = sleepLogs.slice(0, 7);
  const avgHours = sleepLogs.length > 0
    ? (sleepLogs.reduce((acc, l) => acc + l.hours + l.minutes / 60, 0) / sleepLogs.length).toFixed(1)
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError('');
    try {
      if (editingLog) {
        await updateSleepLog(editingLog.id, formData);
      } else {
        await createSleepLog(formData);
      }
      setShowAddModal(false);
      setEditingLog(null);
      resetForm();
    } catch (err: any) {
      setActionError(err.message || 'Failed to save sleep log');
    }
  };

  const resetForm = () => {
    setFormData({ date: todayKey(), sleep_time: '23:00', wake_time: '07:00', quality: 'Good', notes: '' });
  };

  const handleEdit = (log: any) => {
    setEditingLog(log);
    setFormData({
      date: log.date,
      sleep_time: log.sleep_time,
      wake_time: log.wake_time,
      quality: log.quality || 'Good',
      notes: log.notes || '',
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteSleepLog(id);
      setDeleteConfirmId(null);
    } catch (err: any) {
      setActionError(err.message || 'Failed to delete sleep log');
    }
  };

  if (isLoading) return <div className="loading-state">Loading sleep logs...</div>;

  return (
    <div className="sleep-tab">
      <div className="tab-header">
        <h2 className="tab-title">Sleep</h2>
        <p className="tab-subtitle">Track your rest</p>
      </div>

      {actionError && <div className="form-error">{actionError}</div>}

      <div className="sleep-summary">
        <div className="summary-card">
          <div className="summary-icon"><Moon size={22} /></div>
          <div className="summary-info">
            <span className="summary-label">Last Night</span>
            {lastNightLog ? (
              <>
                <span className="summary-value">{lastNightLog.hours}h {lastNightLog.minutes}m</span>
                <span className="summary-detail">{lastNightLog.quality}</span>
              </>
            ) : (
              <span className="summary-value">Not logged</span>
            )}
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon"><Sun size={22} /></div>
          <div className="summary-info">
            <span className="summary-label">Average</span>
            <span className="summary-value">{avgHours ? `${avgHours}h` : '—'}</span>
            <span className="summary-detail">{sleepLogs.length} nights tracked</span>
          </div>
        </div>
      </div>

      <button onClick={() => { resetForm(); setEditingLog(null); setShowAddModal(true); }} className="blue-btn add-sleep-btn">
        <Plus size={18} />
        <span>Log Sleep</span>
      </button>

      {sleepLogs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Moon size={48} /></div>
          <h3>No sleep logs yet</h3>
          <p>Track your sleep to understand your patterns</p>
        </div>
      ) : (
        <ul className="sleep-logs">
          {recentLogs.map((log) => (
            <li key={log.id} className={`sleep-log-item ${log.date === today ? 'today' : ''}`}>
              <div className="log-date">
                <span className="log-day">{formatDate(log.date)}</span>
                <span className="log-quality">{log.quality}</span>
              </div>
              <div className="log-times">
                <span>{log.sleep_time} – {log.wake_time}</span>
                <span className="log-duration">{log.hours}h {log.minutes}m</span>
              </div>
              <div className="log-actions">
                <button onClick={() => handleEdit(log)} className="icon-btn" aria-label="Edit">
                  <Edit2 size={16} />
                </button>
                <button onClick={() => setDeleteConfirmId(log.id)} className="icon-btn" aria-label="Delete">
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); resetForm(); }} title={editingLog ? 'Edit Sleep Log' : 'Log Sleep'} size="lg">
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="date">Date</label>
              <input id="date" type="date" value={formData.date} onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))} />
            </div>
            <div className="form-field">
              <label htmlFor="quality">Quality</label>
              <select id="quality" value={formData.quality} onChange={(e) => setFormData(prev => ({ ...prev, quality: e.target.value }))}>
                {QUALITIES.map(q => <option key={q} value={q}>{q}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="sleep_time">Sleep Time</label>
              <input id="sleep_time" type="time" value={formData.sleep_time} onChange={(e) => setFormData(prev => ({ ...prev, sleep_time: e.target.value }))} />
            </div>
            <div className="form-field">
              <label htmlFor="wake_time">Wake Time</label>
              <input id="wake_time" type="time" value={formData.wake_time} onChange={(e) => setFormData(prev => ({ ...prev, wake_time: e.target.value }))} />
            </div>
          </div>
          <div className="form-field">
            <label htmlFor="notes">Notes</label>
            <textarea id="notes" value={formData.notes} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} rows={3} placeholder="How did you sleep?" />
          </div>
          <div className="modal-actions">
            <button type="button" onClick={() => { setShowAddModal(false); resetForm(); }} className="secondary-btn">Cancel</button>
            <button type="submit" className="blue-btn">{editingLog ? 'Save Changes' : 'Log Sleep'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => handleDelete(deleteConfirmId!)}
        title="Delete Sleep Log"
        message="Are you sure you want to delete this sleep log?"
        confirmText="Delete"
        confirmClass="contrast-btn"
        icon="danger"
      />
    </div>
  );
}

export default SleepTab;
