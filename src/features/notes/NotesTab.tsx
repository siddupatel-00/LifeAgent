import { useState } from 'react';
import { useNotes } from '../../hooks/useQueries';
import { useAuthStore } from '../../stores/authStore';
import { Plus, Edit2, Trash2, Pin, PinOff, Archive, ArchiveRestore, Search } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import ConfirmModal from '../../components/ui/ConfirmModal';

export function NotesTab() {
  const { notes, isLoading, createNote, updateNote, deleteNote } = useNotes();
  const user = useAuthStore((s) => s.user);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingNote, setEditingNote] = useState<any>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'pinned' | 'archived'>('all');
  const [actionError, setActionError] = useState('');
  const [formData, setFormData] = useState({ title: '', content: '' });

  const filteredNotes = notes
    .filter(note => {
      if (filter === 'pinned') return note.is_pinned && !note.is_archived;
      if (filter === 'archived') return note.is_archived;
      return !note.is_archived;
    })
    .filter(note =>
      !searchQuery ||
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    setActionError('');

    try {
      if (editingNote) {
        await updateNote(editingNote.id, formData);
      } else {
        await createNote(formData);
      }
      setShowAddModal(false);
      setEditingNote(null);
      resetForm();
    } catch (err: any) {
      setActionError(err.message || 'Failed to save note');
    }
  };

  const resetForm = () => setFormData({ title: '', content: '' });

  const handleEdit = (note: any) => {
    setEditingNote(note);
    setFormData({ title: note.title, content: note.content || '' });
    setShowAddModal(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteNote(id);
      setDeleteConfirmId(null);
    } catch (err: any) {
      setActionError(err.message || 'Failed to delete note');
    }
  };

  const handleTogglePin = async (note: any) => {
    try {
      await updateNote(note.id, { is_pinned: !note.is_pinned });
    } catch (err: any) {
      setActionError(err.message || 'Failed to update note');
    }
  };

  const handleToggleArchive = async (note: any) => {
    try {
      await updateNote(note.id, { is_archived: !note.is_archived });
    } catch (err: any) {
      setActionError(err.message || 'Failed to update note');
    }
  };

  const formatNoteDate = (note: any): string => {
    const raw = note.created_at || note.date;
    if (!raw) return '';
    try {
      const d = new Date(raw.includes('T') ? raw : `${raw}T00:00:00`);
      return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  if (isLoading) return <div className="loading-state">Loading notes...</div>;

  return (
    <div className="notes-tab">
      <div className="tab-header">
        <h2 className="tab-title">Notes</h2>
        <p className="tab-subtitle">{filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'}</p>
      </div>

      {actionError && <div className="form-error">{actionError}</div>}

      <div className="notes-toolbar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="filter-tabs">
          <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All</button>
          <button className={filter === 'pinned' ? 'active' : ''} onClick={() => setFilter('pinned')}>
            <Pin size={16} /> Pinned
          </button>
          <button className={filter === 'archived' ? 'active' : ''} onClick={() => setFilter('archived')}>
            <Archive size={16} /> Archived
          </button>
        </div>
      </div>

      <button onClick={() => { resetForm(); setEditingNote(null); setShowAddModal(true); }} className="blue-btn add-note-btn">
        <Plus size={18} />
        <span>New Note</span>
      </button>

      {filteredNotes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Search size={48} /></div>
          <h3>No notes found</h3>
          <p>{searchQuery ? 'Try a different search' : 'Create your first note!'}</p>
        </div>
      ) : (
        <div className="notes-grid">
          {filteredNotes.map((note) => (
            <article key={note.id} className={`note-card ${note.is_pinned ? 'pinned' : ''}`}>
              <div className="note-header">
                <h3 className="note-title">{note.title}</h3>
                <div className="note-actions">
                  <button onClick={() => handleTogglePin(note)} className={`icon-btn ${note.is_pinned ? 'accent' : ''}`} aria-label={note.is_pinned ? 'Unpin' : 'Pin'}>
                    {note.is_pinned ? <PinOff size={15} /> : <Pin size={15} />}
                  </button>
                  <button onClick={() => handleToggleArchive(note)} className="icon-btn" aria-label={note.is_archived ? 'Unarchive' : 'Archive'}>
                    {note.is_archived ? <ArchiveRestore size={15} /> : <Archive size={15} />}
                  </button>
                  <button onClick={() => handleEdit(note)} className="icon-btn" aria-label="Edit">
                    <Edit2 size={15} />
                  </button>
                  <button onClick={() => setDeleteConfirmId(note.id)} className="icon-btn" aria-label="Delete">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              <p className="note-content">{note.content || '(empty)'}</p>
              <time className="note-date">{formatNoteDate(note)}</time>
            </article>
          ))}
        </div>
      )}

      <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); resetForm(); }} title={editingNote ? 'Edit Note' : 'New Note'} size="lg">
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-field">
            <label htmlFor="title">Title</label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Note title"
              required
              autoFocus
            />
          </div>
          <div className="form-field">
            <label htmlFor="content">Content</label>
            <textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Write your thoughts..."
              rows={10}
            />
          </div>
          <div className="modal-actions">
            <button type="button" onClick={() => { setShowAddModal(false); resetForm(); }} className="secondary-btn">
              Cancel
            </button>
            <button type="submit" className="blue-btn">
              {editingNote ? 'Save Changes' : 'Create Note'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => handleDelete(deleteConfirmId!)}
        title="Delete Note"
        message="Are you sure you want to delete this note?"
        confirmText="Delete"
        confirmClass="contrast-btn"
        icon="danger"
      />
    </div>
  );
}

export default NotesTab;
