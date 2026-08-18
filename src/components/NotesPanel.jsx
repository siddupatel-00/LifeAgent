import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Trash2, Search } from 'lucide-react';
import { getFormattedDateTitle } from '../utils/date';
import { getApiUrl } from '../utils/apiConfig';

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
      await fetch(getApiUrl('/api/notes'), {
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
      const res = await fetch(getApiUrl('/api/notes'), {
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
    <div className="animate-entrance" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h3 style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: '1.45rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '10px', margin: 0, letterSpacing: '-0.02em' }}>
            <BookOpen size={22} color="#d8f277" /> Notes & Personal Diary
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', marginTop: '4px', margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
            Daily reflections, master goals, and personal journal logs.
          </p>
        </div>
        <button 
          className="button button-primary" 
          onClick={async () => {
            const baseTitle = getFormattedDateTitle();
            const count = notesList.filter(n => n.title === baseTitle || n.title.startsWith(`${baseTitle} (`)).length;
            const defaultTitle = count > 0 ? `${baseTitle} (${count + 1})` : baseTitle;
            const defaultContent = '';
            const tempId = Date.now();
            const tempNote = { id: tempId, title: defaultTitle, content: defaultContent, category: 'Diary', shareWithAi: true, date: new Date().toISOString().split('T')[0] };
            setNotesList([tempNote, ...notesList]);
            setActiveNoteId(tempId);
            setNotesViewMode('active');
            handleCreateNoteDb(defaultTitle, defaultContent, true, (newNote) => {
              setNotesList(prev => prev.map(n => n.id === tempId ? { ...n, id: newNote.id } : n));
              setActiveNoteId(newNote.id);
            });
          }}
          style={{ padding: '10px 20px', fontSize: '0.84rem', borderRadius: '6px', font: "600 0.82rem 'DM Sans', sans-serif", background: 'var(--ink)', color: '#d8f277', border: '1px solid var(--border-color)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={16} /> New Diary Page / Note
        </button>
      </div>

      <div className="notes-main-grid" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px', height: 'calc(100vh - 260px)', minHeight: '480px' }}>
        {/* LEFT NOTEBOOK LIST / TRASH VIEW SWITCHER */}
        <div className="notes-left-col" style={{ background: 'var(--bg-card)', borderRadius: '6px', border: '1px solid var(--border-color)', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' }}>
          <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
            <button
              onClick={() => setNotesViewMode('active')}
              style={{
                flex: 1, padding: '7px', borderRadius: '6px', border: '1px solid',
                borderColor: notesViewMode === 'active' ? '#d8f277' : 'transparent',
                background: notesViewMode === 'active' ? 'rgba(216, 242, 119, 0.12)' : 'transparent',
                color: notesViewMode === 'active' ? '#d8f277' : 'var(--text-muted)',
                fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.15s',
                fontFamily: "'DM Sans', sans-serif"
              }}
            >
              📖 Active <span style={{ font: "500 0.72rem 'DM Mono', monospace" }}>({notesList.length})</span>
            </button>
            <button
              onClick={() => setNotesViewMode('trash')}
              style={{
                flex: 1, padding: '7px', borderRadius: '6px', border: 'none',
                background: notesViewMode === 'trash' ? 'rgba(239, 111, 62, 0.15)' : 'transparent',
                color: notesViewMode === 'trash' ? '#ef6f3e' : 'var(--text-muted)',
                fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.15s',
                fontFamily: "'DM Sans', sans-serif"
              }}
            >
              🗑️ Trash <span style={{ font: "500 0.72rem 'DM Mono', monospace" }}>({trashNotes.length})</span>
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
              style={{ width: '100%', padding: '7px 10px 7px 30px', borderRadius: '6px', background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box', fontFamily: "'DM Sans', sans-serif" }}
            />
          </div>

          {notesViewMode === 'active' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1 }}>
              {notesList.length === 0 ? (
                <div className="glass-card" style={{ textAlign: 'center', padding: '32px 16px', background: 'var(--bg-main)', borderRadius: '6px', border: '1px dashed var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  <BookOpen size={36} style={{ color: '#d8f277', opacity: 0.6 }} />
                  <div style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: '0.98rem', fontWeight: 600, color: 'var(--text-main)' }}>No notes created</div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: 0 }}>Click below to create your first note or reflection.</p>
                  <button
                    onClick={async () => {
                      const baseTitle = getFormattedDateTitle();
                      const count = notesList.filter(n => n.title === baseTitle || n.title.startsWith(`${baseTitle} (`)).length;
                      const defaultTitle = count > 0 ? `${baseTitle} (${count + 1})` : baseTitle;
                      const defaultContent = '';
                      const tempId = Date.now();
                      const tempNote = { id: tempId, title: defaultTitle, content: defaultContent, category: 'Diary', shareWithAi: true, date: new Date().toISOString().split('T')[0] };
                      setNotesList([tempNote, ...notesList]);
                      setActiveNoteId(tempId);
                      setNotesViewMode('active');
                      handleCreateNoteDb(defaultTitle, defaultContent, true, (newNote) => {
                        setNotesList(prev => prev.map(n => n.id === tempId ? { ...n, id: newNote.id } : n));
                        setActiveNoteId(newNote.id);
                      });
                    }}
                    style={{ marginTop: '6px', padding: '7px 14px', fontSize: '0.78rem', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#d8f277', color: '#11110f', border: '1px solid #d8f277', cursor: 'pointer', fontWeight: 600 }}
                  >
                    <Plus size={14} /> Create First Note
                  </button>
                </div>
              ) : (
                [...notesList]
                  .filter(note => !searchQuery || note.title?.toLowerCase().includes(searchQuery.toLowerCase()) || note.content?.toLowerCase().includes(searchQuery.toLowerCase()))
                  .sort((a, b) => new Date(b.updated_at || b.date || 0) - new Date(a.updated_at || a.date || 0)).map(note => (
                  <div
                    key={note.id}
                    onClick={() => setActiveNoteId(note.id)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '6px',
                      background: activeNoteId === note.id ? 'rgba(216, 242, 119, 0.08)' : 'var(--bg-main)',
                      color: 'var(--text-main)',
                      border: `1px solid ${activeNoteId === note.id ? '#d8f277' : 'var(--border-color)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      display: 'flex', flexDirection: 'column', gap: '6px',
                      boxShadow: activeNoteId === note.id ? '0 2px 8px rgba(0,0,0,0.2)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ font: "500 0.65rem 'DM Mono', monospace", background: '#d8f277', color: '#11110f', padding: '1px 6px', borderRadius: '3px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {note.category || 'DIARY'}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateNoteDb({ id: note.id, is_trashed: 1, deleted_at: new Date().toISOString() });
                          setTrashNotes([{ ...note, deletedAt: Date.now() }, ...trashNotes]);
                          const next = notesList.filter(n => n.id !== note.id);
                          setNotesList(next);
                          if (activeNoteId === note.id) setActiveNoteId(next[0]?.id || null);
                        }}
                        style={{ background: 'transparent', border: 'none', color: '#ef6f3e', cursor: 'pointer', padding: '2px', opacity: 0.8 }}
                        title="Move to Trash"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <h5 style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: '0.94rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0, letterSpacing: '-0.01em', color: 'var(--text-main)' }}>
                      {note.title || 'Untitled Note'}
                    </h5>
                    {note.content && (
                      <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: '1.4' }}>
                        {note.content}
                      </p>
                    )}
                    <span style={{ font: "400 0.7rem 'DM Mono', monospace", color: 'var(--text-muted)' }}>
                      {note.date || 'Today'}
                    </span>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
              <div style={{ font: "400 0.72rem 'DM Mono', monospace", color: 'var(--text-muted)', lineHeight: '1.4', background: 'rgba(239, 111, 62, 0.08)', padding: '8px 10px', borderRadius: '6px', border: '1px dashed rgba(239, 111, 62, 0.3)' }}>
                🗑️ Items deleted permanently after 49 days.
              </div>
              {trashNotes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 10px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  Trash is empty.
                </div>
              ) : (
                trashNotes.map(tNote => {
                  const daysLeft = Math.max(0, 49 - Math.floor((Date.now() - (tNote.deletedAt || Date.now())) / (1000 * 60 * 60 * 24)));
                  return (
                    <div
                      key={tNote.id}
                      onClick={() => setActiveNoteId(tNote.id)}
                      style={{
                        padding: '12px 14px', borderRadius: '6px',
                        background: activeNoteId === tNote.id ? 'rgba(239, 111, 62, 0.12)' : 'var(--bg-main)',
                        border: `1px solid ${activeNoteId === tNote.id ? '#ef6f3e' : 'var(--border-color)'}`,
                        cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '6px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ font: "500 0.68rem 'DM Mono', monospace", color: '#ef6f3e' }}>
                          ⏳ {daysLeft}d left
                        </span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpdateNoteDb({ id: tNote.id, is_trashed: 0, deleted_at: null });
                              setNotesList([tNote, ...notesList]);
                              setTrashNotes(trashNotes.filter(n => n.id !== tNote.id));
                              setActiveNoteId(tNote.id);
                              setNotesViewMode('active');
                            }}
                            style={{ background: 'rgba(216, 242, 119, 0.2)', color: '#a7c878', border: '1px solid rgba(216, 242, 119, 0.3)', borderRadius: '4px', padding: '3px 6px', fontSize: '0.68rem', fontWeight: 600, cursor: 'pointer' }}
                            title="Restore Note"
                          >
                            Restore
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setTrashNotes(trashNotes.filter(n => n.id !== tNote.id));
                            }}
                            style={{ background: 'rgba(239, 111, 62, 0.15)', color: '#ef6f3e', border: '1px solid rgba(239, 111, 62, 0.3)', borderRadius: '4px', padding: '3px 6px', fontSize: '0.68rem', fontWeight: 600, cursor: 'pointer' }}
                            title="Delete Permanently"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <h5 style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: '0.9rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-main)', margin: 0 }}>
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
              <div style={{ background: 'var(--bg-card)', borderRadius: '6px', border: '1px solid var(--border-color)', padding: '36px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: '10px' }}>
                <BookOpen size={36} opacity={0.4} />
                <h4 style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: '1.05rem', fontWeight: 600 }}>No Note Selected</h4>
                <p style={{ fontSize: '0.82rem', fontFamily: "'DM Sans', sans-serif" }}>Select a note from the left panel or click "+ New Diary Page / Note".</p>
              </div>
            );
          }
          return (
            <div className="notes-right-col" style={{ background: 'var(--bg-card)', borderRadius: '6px', border: '1px solid var(--border-color)', padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
                <div style={{ flex: 1, minWidth: '220px' }}>
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
                    onBlur={() => {
                      if (notesViewMode === 'active') handleUpdateNoteDb(currentNote);
                    }}
                    style={{ width: '100%', fontSize: '1.35rem', fontWeight: 600, background: 'transparent', border: 'none', color: 'var(--text-main)', outline: 'none', fontFamily: "Fraunces, Georgia, serif", letterSpacing: '-0.02em' }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  {notesViewMode === 'active' ? (
                    <>
                      {noteUnsaved && (
                        <span style={{ font: "500 0.68rem 'DM Mono', monospace", background: '#d8f277', color: '#11110f', padding: '3px 8px', borderRadius: '4px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                          ● Draft Changes
                        </span>
                      )}
                      <button
                        onClick={() => handleManualSave(currentNote)}
                        style={{ padding: '7px 16px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', transition: 'all 0.15s', fontFamily: "'DM Sans', sans-serif" }}
                      >
                        💾 Save
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
                          display: 'flex', alignItems: 'center', gap: '5px',
                          padding: '7px 14px', borderRadius: '6px',
                          background: 'rgba(239, 111, 62, 0.1)', color: '#ef6f3e',
                          border: '1px solid rgba(239, 111, 62, 0.3)',
                          fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer',
                          transition: 'all 0.15s', fontFamily: "'DM Sans', sans-serif"
                        }}
                        title="Move this note to Trash"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => {
                          const restoredNote = { ...currentNote, is_trashed: 0, deletedAt: null };
                          setNotesList([restoredNote, ...notesList]);
                          setTrashNotes(trashNotes.filter(n => n.id !== currentNote.id));
                          setActiveNoteId(currentNote.id);
                          setNotesViewMode('active');
                          handleUpdateNoteDb(restoredNote);
                        }}
                        style={{ padding: '7px 14px', borderRadius: '6px', background: '#d8f277', color: '#11110f', border: '1px solid #d8f277', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}
                      >
                        ♻️ Restore Note
                      </button>
                      <button
                        onClick={async () => {
                          setTrashNotes(trashNotes.filter(n => n.id !== currentNote.id));
                          try {
                            await fetch(getApiUrl('/api/notes'), {
                              method: 'DELETE',
                              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                              body: JSON.stringify({ id: currentNote.id })
                            });
                          } catch(e){}
                        }}
                        style={{ padding: '7px 14px', borderRadius: '6px', background: '#ef6f3e', color: '#fff', border: 'none', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}
                      >
                        ❌ Delete Permanently
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <textarea
                ref={(el) => {
                  if (el) {
                    el.style.height = 'auto';
                    el.style.height = `${Math.max(220, el.scrollHeight)}px`;
                  }
                }}
                disabled={notesViewMode === 'trash'}
                value={currentNote.content}
                onChange={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.max(220, e.target.scrollHeight)}px`;
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
                onBlur={() => {
                  if (notesViewMode === 'active') handleUpdateNoteDb(currentNote);
                }}
                placeholder="Write your diary entry, personal reflection, or goals..."
                style={{ width: '100%', padding: '16px', borderRadius: '6px', background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '0.95rem', lineHeight: '1.65', outline: 'none', resize: 'none', overflow: 'hidden', opacity: notesViewMode === 'trash' ? 0.7 : 1, fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box' }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', font: "400 0.75rem 'DM Mono', monospace", color: 'var(--text-muted)' }}>
                <span>{notesViewMode === 'active' ? '' : '🗑️ In Trash Bin. Restore to keep or edit.'}</span>
                <span style={{ fontWeight: 600, color: notesViewMode === 'active' ? 'transparent' : '#ef6f3e' }}>{notesViewMode === 'active' ? '' : 'Archived'}</span>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
