import { useState, useRef, useEffect } from 'react';
import {  AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { useCalendarStore } from '../store/useCalendarStore';

export default function NotesPanel() {
  const { notes, addNote, deleteNote, getRangeKey, getRangeLabel } = useCalendarStore();
  const [draft, setDraft] = useState('');
  const [prevContext, setPrevContext] = useState({ key: null, note: null });
  const [isExpanded, setIsExpanded] = useState(true);
  const panelRef = useRef(null);
  const inputRef = useRef(null);

  const rangeKey = getRangeKey();
  const rangeLabel = getRangeLabel();
  const currentNote = rangeKey ? notes[rangeKey] || '' : '';

  // Sync draft when notes change without causing cascading effect renders
  if (rangeKey !== prevContext.key || currentNote !== prevContext.note) {
    setPrevContext({ key: rangeKey, note: currentNote });
    setDraft(currentNote);
  }

  // Entrance animation
  useEffect(() => {
    if (panelRef.current) {
      gsap.fromTo(panelRef.current,
        { opacity: 0, x: 30 },
        { opacity: 1, x: 0, duration: 0.6, ease: 'power3.out', delay: 0.5 }
      );
    }
  }, []);

  const handleSave = () => {
    if (!rangeKey || !draft.trim()) return;
    addNote(rangeKey, draft.trim());
    // Flash animation
    if (panelRef.current) {
      gsap.fromTo(panelRef.current,
        { boxShadow: '0 0 30px 5px var(--sel-glow)' },
        { boxShadow: '0 0 0px 0px transparent', duration: 0.8, ease: 'power2.out' }
      );
    }
  };

  const handleDelete = (key) => {
    deleteNote(key);
    if (key === rangeKey) setDraft('');
  };

  // Get all notes as sorted array
  const allNotes = Object.entries(notes).sort(([a], [b]) => a.localeCompare(b));

  return (
    <motion.div className="notes-panel" ref={panelRef} layout>
      <div className="notes-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="notes-title-row">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
          </svg>
          <h3>Notes</h3>
        </div>
        <motion.svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.3 }}>
          <path d="M6 9l6 6 6-6"/>
        </motion.svg>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div className="notes-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            {/* Active note editor */}
            {rangeKey ? (
              <div className="note-editor">
                <div className="note-editor-label">
                  <span className="note-date-badge">{rangeLabel}</span>
                </div>
                <textarea
                  ref={inputRef}
                  className="note-textarea"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSave();
                    }
                  }}
                  placeholder="Write a note... (Press Enter to save)"
                  rows={3}
                />
                <div className="note-editor-actions">
                  <button className="note-save-btn" onClick={handleSave} disabled={!draft.trim()} title="Save Note">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M20 6L9 17l-5-5"/>
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              <div className="note-placeholder">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.3">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <p>Select a date or range to add notes</p>
              </div>
            )}

            {/* Saved notes list */}
            {allNotes.length > 0 && (
              <div className="saved-notes">
                <div className="saved-notes-title">Saved Notes</div>
                <AnimatePresence>
                  {allNotes.map(([key, text]) => (
                    <motion.div key={key} className={`saved-note ${key === rangeKey ? 'active' : ''}`}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }} layout
                    >
                      <div className="saved-note-header">
                        <span className="saved-note-date">{formatNoteKey(key)}</span>
                        <button className="delete-note-btn" onClick={() => handleDelete(key)} aria-label="Delete note">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12"/>
                          </svg>
                        </button>
                      </div>
                      <p className="saved-note-text">{text}</p>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function formatNoteKey(key) {
  if (key.includes('_to_')) {
    const [s, e] = key.split('_to_');
    return `${formatDate(s)} → ${formatDate(e)}`;
  }
  return formatDate(key);
}

function formatDate(str) {
  const d = new Date(str + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
