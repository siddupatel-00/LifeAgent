import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Trash2, Search } from 'lucide-react';
import { getFormattedDateTitle } from '../utils/date';

export default function NotesPanel({
  notesList = [],
  setNotesList,
  activeNoteId,
  setActiveNoteId,
  trashNotes = [],
  setTrashNotes,
  notesViewMode,
  setNotesViewMode,
  token,
  showToast
}) {
  const [savedSnapshot, setSavedSnapshot] = useState({ title: '', content: '' });
  const [noteUnsaved, setNoteUnsaved] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const safeNotes = Array.isArray(notesList) ? notesList : [];
    const note = safeNotes.find(n => n.id === activeNoteId);
    if (note) {
      setSavedSnapshot({ title: note.title, content: note.content });
      setNoteUnsaved(false);
    }
  }, [activeNoteId, (notesList || []).length]); // Added length just in case it's newly created, but activeNoteId change should be enough

  const handleUpdateNoteDb = async (note) => {
    if (!token || !note.id) return;
    try {
      await fetch('/api/notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ id: note.id, title: note.title, content: note.content, share_with_ai: note.shareWithAi, is_trashed: note.is_trashed, deleted_at: note.deletedAt })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateNoteDb = async (title, content, shareWithAi, callback) => {
    if (!token) return;
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ title, content, share_with_ai: shareWithAi })
      });
      if (res.ok) {
        const newNote = await res.json();
        callback({ ...newNote, shareWithAi: !!newNote.share_with_ai });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleManualSave = (currentNote) => {
    handleUpdateNoteDb(currentNote);
    setSavedSnapshot({ title: currentNote.title, content: currentNote.content });
    setNoteUnsaved(false);
    if (showToast) {
      showToast('Notes Saved Successfully', 'success');
    }
  };

  return (
    <div className="animate-entrance">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h3 style={{ fontSize: '1.55rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BookOpen size={24} color="var(--accent-blue)" /> Notes & Personal Diary
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px' }}>
            Create daily logs, 2026 master goals, and wishlists.
          </p>
        </div>
        <button 
          className="blue-btn" 
          onClick={async () => {
            const baseTitle = getFormattedDateTitle();
            const count = notesList.filter(n => n.title === baseTitle || n.title.startsWith(`${baseTitle} (`)).length;
            const defaultTitle = count > 0 ? `${baseTitle} (${count + 1})` : baseTitle;
            const defaultContent = 'Type your daily reflection, thoughts, or goals here...';
            handleCreateNoteDb(defaultTitle, defaultContent, true, (newNote) => {
              setNotesList([newNote, ...notesList]);
              setActiveNoteId(newNote.id);
            });
          }}
          style={{ padding: '12px 22px', fontSize: '0.92rem' }}
        >
          <Plus size={18} /> New Diary Page / Note
        </button>
      </div>

      <div className="notes-main-grid" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', height: 'calc(100vh - 260px)', minHeight: '480px' }}>
        {/* LEFT NOTEBOOK LIST / TRASH VIEW SWITCHER */}
        <div className="notes-left-col" style={{ background: 'var(--bg-main)', borderRadius: '18px', border: '1px solid var(--border-color)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' }}>
          <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
            <button
              onClick={() => setNotesViewMode('active')}
              style={{
                flex: 1, padding: '8px', borderRadius: '10px', border: '1px solid',
                borderColor: notesViewMode === 'active' ? 'var(--accent-blue)' : 'transparent',
                background: notesViewMode === 'active' ? 'var(--accent-blue-dim)' : 'transparent',
                color: notesViewMode === 'active' ? 'var(--accent-blue)' : 'var(--text-muted)',
                fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              📖 Active ({notesList.length})
            </button>
            <button
              onClick={() => setNotesViewMode('trash')}
              style={{
                flex: 1, padding: '8px', borderRadius: '10px', border: 'none',
                background: notesViewMode === 'trash' ? 'rgba(239, 68, 68, 0.18)' : 'transparent',
                color: notesViewMode === 'trash' ? '#ef4444' : 'var(--text-muted)',
                fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              🗑️ Trash ({trashNotes.length})
            </button>
          </div>

          {/* Search bar */}
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '8px 10px 8px 30px', borderRadius: '10px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '0.83rem', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {notesViewMode === 'active' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1 }}>
              {notesList.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: '36px 20px', background: 'var(--bg-main)', borderRadius: '18px', border: '1px dashed var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <BookOpen size={40} style={{ color: 'var(--accent-blue)', opacity: 0.5 }} />
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>No notes created yet</div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>Click below to create your first note or diary page</p>
                  <button
                    onClick={async () => {
                      const baseTitle = getFormattedDateTitle();
                      const count = notesList.filter(n => n.title === baseTitle || n.title.startsWith(`${baseTitle} (`)).length;
                      const defaultTitle = count > 0 ? `${baseTitle} (${count + 1})` : baseTitle;
                      handleCreateNoteDb(defaultTitle, '', true, (newNote) => {
                        setNotesList([newNote, ...notesList]);
                        setActiveNoteId(newNote.id);
                      });
                    }}
                    className="blue-btn"
                    style={{ marginTop: '8px', padding: '8px 18px', fontSize: '0.85rem', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Plus size={16} /> Create First Note
                  </button>
                </div>
              ) : (
                [...notesList]
                  .filter(note => !searchQuery || note.title?.toLowerCase().includes(searchQuery.toLowerCase()) || note.content?.toLowerCase().includes(searchQuery.toLowerCase()))
                  .sort((a, b) => new Date(b.updated_at || b.date || 0) - new Date(a.updated_at || a.date || 0)).map(note => (
                  <React.Fragment key={note.id}>
                    <div
                      onClick={() => setActiveNoteId(activeNoteId === note.id ? null : note.id)}
                      style={{
                        padding: '14px 16px',
                        borderRadius: '14px',
                        background: activeNoteId === note.id ? 'var(--accent-blue-dim)' : 'var(--bg-main)',
                        color: 'var(--text-main)',
                        border: `1px solid ${activeNoteId === note.id ? 'var(--accent-blue)' : 'var(--border-color)'}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex', flexDirection: 'column', gap: '6px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, background: activeNoteId === note.id ? 'rgba(255,255,255,0.2)' : 'var(--bg-main)', padding: '2px 8px', borderRadius: '8px' }}>
                          {note.category || 'General'}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {note.shareWithAi && (
                            <span title="Shared with AI Agent" style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px', background: activeNoteId === note.id ? 'var(--accent-blue-dim)' : 'rgba(34,197,94,0.15)', color: activeNoteId === note.id ? 'var(--accent-blue)' : '#22c55e', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>
                              🤖 AI Shared
                            </span>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateNoteDb({ id: note.id, is_trashed: 1, deleted_at: new Date().toISOString() });
                              setTrashNotes([{ ...note, deletedAt: Date.now() }, ...trashNotes]);
                              const next = notesList.filter(n => n.id !== note.id);
                              setNotesList(next);
                              if (activeNoteId === note.id) setActiveNoteId(next[0]?.id || null);
                            }}
                            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px', opacity: 0.8 }}
                            title="Move to Trash"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                      <h5 style={{ fontSize: '0.96rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
                        {note.title}
                      </h5>
                      <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                        Last updated: {note.date || 'Today'}
                      </span>
                    </div>

                    {/* INLINE EXPANDING NOTE EDITOR BOX UNDER SELECTED NOTE */}
                    {activeNoteId === note.id && (
                      <div
                        className="animate-entrance"
                        style={{
                          background: 'var(--bg-card)',
                          border: '1px solid var(--accent-blue)',
                          borderRadius: '14px',
                          padding: '14px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                          marginBottom: '8px'
                        }}
                      >
                        <input
                          type="text"
                          value={note.title}
                          onChange={(e) => {
                            const newTitle = e.target.value;
                            const updated = notesList.map(n => n.id === note.id ? { ...n, title: newTitle } : n);
                            setNotesList(updated);
                          }}
                          placeholder="Note title..."
                          style={{
                            width: '100%', padding: '10px 12px', borderRadius: '10px',
                            background: 'var(--bg-main)', color: 'var(--text-main)',
                            border: '1px solid var(--border-color)', fontSize: '0.95rem', fontWeight: 700, outline: 'none'
                          }}
                        />
                        <textarea
                          rows={6}
                          value={note.content}
                          onChange={(e) => {
                            const newContent = e.target.value;
                            const updated = notesList.map(n => n.id === note.id ? { ...n, content: newContent } : n);
                            setNotesList(updated);
                          }}
                          placeholder="Write your note, thoughts, or daily diary entry here..."
                          style={{
                            width: '100%', padding: '10px 12px', borderRadius: '10px',
                            background: 'var(--bg-main)', color: 'var(--text-main)',
                            border: '1px solid var(--border-color)', fontSize: '0.9rem', outline: 'none',
                            resize: 'vertical', minHeight: '120px'
                          }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={!!note.shareWithAi}
                              onChange={(e) => {
                                const val = e.target.checked;
                                const updated = notesList.map(n => n.id === note.id ? { ...n, shareWithAi: val } : n);
                                setNotesList(updated);
                              }}
                            />
                            Share with AI Assistant
                          </label>
                          <button
                            type="button"
                            className="blue-btn"
                            onClick={() => handleManualSave(note)}
                            style={{ padding: '8px 18px', fontSize: '0.85rem', fontWeight: 700, borderRadius: '10px' }}
                          >
                            💾 Save Note
                          </button>
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                ))
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4', background: 'rgba(239, 68, 68, 0.08)', padding: '10px', borderRadius: '10px', border: '1px dashed rgba(239, 68, 68, 0.3)' }}>
                🗑️ **Trash Bin:** Items here are permanently deleted after **49 days**, or if deleted directly from here.
              </div>
              {trashNotes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Trash is currently empty.
                </div>
              ) : (
                trashNotes.map(tNote => {
                  const daysLeft = Math.max(0, 49 - Math.floor((Date.now() - (tNote.deletedAt || Date.now())) / (1000 * 60 * 60 * 24)));
                  return (
                    <div
                      key={tNote.id}
                      onClick={() => setActiveNoteId(tNote.id)}
                      style={{
                        padding: '14px 16px', borderRadius: '14px',
                        background: activeNoteId === tNote.id ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-card)',
                        border: `1px solid ${activeNoteId === tNote.id ? '#ef4444' : 'var(--border-color)'}`,
                        cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.72rem', color: '#ef4444', fontWeight: 800 }}>
                          ⏳ {daysLeft} days until deletion
                        </span>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateNoteDb({ id: tNote.id, is_trashed: 0, deleted_at: null });
                              setNotesList([tNote, ...notesList]);
                              setTrashNotes(trashNotes.filter(n => n.id !== tNote.id));
                              setActiveNoteId(tNote.id);
                              setNotesViewMode('active');
                            }}
                            style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', border: 'none', borderRadius: '6px', padding: '4px 8px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                            title="Restore Note to Active"
                          >
                            ♻️ Restore
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setTrashNotes(trashNotes.filter(n => n.id !== tNote.id));
                            }}
                            style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: 'none', borderRadius: '6px', padding: '4px 8px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
                            title="Permanently Delete Now"
                          >
                            ❌ Delete
                          </button>
                        </div>
                      </div>
                      <h5 style={{ fontSize: '0.94rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-main)' }}>
                        {tNote.title}
                      </h5>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* RIGHT NOTE CONTENT EDITOR */}
        {(() => {
          const currentList = notesViewMode === 'active' ? notesList : trashNotes;
          const currentNote = currentList.find(n => n.id === activeNoteId) || currentList[0];
          if (!currentNote) {
            return (
              <div style={{ background: 'var(--bg-main)', borderRadius: '18px', border: '1px solid var(--border-color)', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: '12px' }}>
                <BookOpen size={40} opacity={0.4} />
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>No Note Selected</h4>
                <p style={{ fontSize: '0.85rem' }}>Select a note from the left panel or click "+ New Diary Page / Note".</p>
              </div>
            );
          }
          return (
            <div className="notes-right-col" style={{ background: 'var(--bg-main)', borderRadius: '18px', border: '1px solid var(--border-color)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px', maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                <div style={{ flex: 1, minWidth: '240px' }}>
                  <input
                    type="text"
                    disabled={notesViewMode === 'trash'}
                    value={currentNote.title}
                    onChange={(e) => {
                      if (notesViewMode === 'active') {
                        const newTitle = e.target.value;
                        if (newTitle !== savedSnapshot.title || currentNote.content !== savedSnapshot.content) {
                          setNoteUnsaved(true);
                        } else {
                          setNoteUnsaved(false);
                        }
                        setNotesList(notesList.map(n => n.id === currentNote.id ? { ...n, title: newTitle, date: new Date().toISOString().split('T')[0] } : n));
                      }
                    }}
                    style={{ width: '100%', fontSize: '1.3rem', fontWeight: 800, background: 'transparent', border: 'none', color: 'var(--text-main)', outline: 'none' }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  {notesViewMode === 'active' ? (
                    <>
                      {noteUnsaved && (
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#d97706', background: 'rgba(217, 119, 6, 0.1)', padding: '4px 8px', borderRadius: '8px' }}>
                          ⚠️ Unsaved Changes
                        </span>
                      )}
                      <button
                        onClick={() => handleManualSave(currentNote)}
                        style={{ padding: '8px 18px', borderRadius: '30px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}
                      >
                        Save Note
                      </button>

                      <button
                        onClick={() => {
                          const trashedNote = { ...currentNote, deletedAt: Date.now(), is_trashed: 1 };
                          setTrashNotes([trashedNote, ...trashNotes]);
                          const nextList = notesList.filter(n => n.id !== currentNote.id);
                          setNotesList(nextList);
                          handleUpdateNoteDb(trashedNote);
                          if (nextList.length > 0) {
                            setActiveNoteId(nextList[0].id);
                          } else {
                            setActiveNoteId(null);
                          }
                        }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '6px',
                          padding: '8px 14px', borderRadius: '20px',
                          background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        title="Move this note to Trash"
                      >
                        <Trash2 size={16} /> Delete Note
                      </button>
                    </>
                  ) : (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => {
                          const restoredNote = { ...currentNote, is_trashed: 0, deletedAt: null };
                          setNotesList([restoredNote, ...notesList]);
                          setTrashNotes(trashNotes.filter(n => n.id !== currentNote.id));
                          setActiveNoteId(currentNote.id);
                          setNotesViewMode('active');
                          handleUpdateNoteDb(restoredNote);
                        }}
                        className="blue-btn"
                        style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                      >
                        ♻️ Restore Note
                      </button>
                      <button
                        onClick={async () => {
                          setTrashNotes(trashNotes.filter(n => n.id !== currentNote.id));
                          try {
                            await fetch('/api/notes', {
                              method: 'DELETE',
                              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                              body: JSON.stringify({ id: currentNote.id })
                            });
                          } catch(e){}
                        }}
                        style={{ padding: '8px 16px', borderRadius: '20px', background: '#ef4444', color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
                      >
                        ❌ Permanently Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <textarea
                disabled={notesViewMode === 'trash'}
                value={currentNote.content}
                onChange={(e) => {
                  if (notesViewMode === 'active') {
                    const newContent = e.target.value;
                    if (currentNote.title !== savedSnapshot.title || newContent !== savedSnapshot.content) {
                      setNoteUnsaved(true);
                    } else {
                      setNoteUnsaved(false);
                    }
                    setNotesList(notesList.map(n => n.id === currentNote.id ? { ...n, content: newContent, date: new Date().toISOString().split('T')[0] } : n));
                  }
                }}
                placeholder="Write your diary entry, personal reflection, or goals..."
                style={{ flex: 1, width: '100%', height: '100%', minHeight: '220px', padding: '18px', borderRadius: '14px', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '1rem', lineHeight: '1.6', outline: 'none', resize: 'none', overflowY: 'auto', opacity: notesViewMode === 'trash' ? 0.7 : 1 }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                <span>{notesViewMode === 'active' ? '' : '🗑️ Viewing note in Trash. Restore it to edit or keep permanently.'}</span>
                <span style={{ fontWeight: 700, color: notesViewMode === 'active' ? 'transparent' : '#ef4444' }}>{notesViewMode === 'active' ? '' : 'In Trash Bin'}</span>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
