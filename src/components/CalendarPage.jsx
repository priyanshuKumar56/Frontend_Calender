import { useRef, useEffect, useState, useCallback } from 'react';
import { useDrag } from '@use-gesture/react';
import gsap from 'gsap';
import {
  startOfMonth, endOfMonth, eachDayOfInterval,
  startOfWeek, endOfWeek, isSameMonth, isToday, format
} from 'date-fns';
import { useCalendarStore } from '../store/useCalendarStore';
import { getMonthTheme } from '../utils/monthThemes';
import { getHoliday, isWeekend } from '../utils/holidays';
import heroImg from '../assets/calendar-hero.png';

const DAYS = ['MON','TUE','WED','THU','FRI','SAT','SUN'];

export default function CalendarPage({ date, onNext, onPrev, active }) {
  const month = date.getMonth();
  const year = date.getFullYear();
  const theme = getMonthTheme(month);
  const gridRef = useRef(null);
  const store = useCalendarStore();
  const { selectedRange, notes, selectDate, setHoverDate,
    startDragSelection, updateDragSelection, endDragSelection,
     addNote, deleteNote, clearSelection, undoSelection, selectionHistory } = store;

  // Calendar days (week starts Monday)
  const ms = startOfMonth(date);
  const me = endOfMonth(date);
  const gs = startOfWeek(ms, { weekStartsOn: 1 });
  const ge = endOfWeek(me, { weekStartsOn: 1 });
  const allDays = eachDayOfInterval({ start: gs, end: ge });

  // Notes logic
  const rangeKey = store.getRangeKey();
  
  // Note text sync
  const storedNote = rangeKey && notes[rangeKey] ? notes[rangeKey] : '';
  const [noteText, setNoteText] = useState(storedNote);
  const [prevRangeKey, setPrevRangeKey] = useState(rangeKey);
  const [prevNotes, setPrevNotes] = useState(notes);

  // Sync state during render to avoid useEffect cascading renders
  if (rangeKey !== prevRangeKey || notes !== prevNotes) {
    setPrevRangeKey(rangeKey);
    setPrevNotes(notes);
    setNoteText(storedNote);
  }

  const saveNote = () => {
    if (!rangeKey) return;
    if (noteText.trim()) addNote(rangeKey, noteText.trim());
    else deleteNote(rangeKey);
  };

  // All user notes
  const [showModal, setShowModal] = useState(false);
  const allNotes = Object.entries(notes).map(([k, t]) => ({ key: k, text: t })).reverse(); // Reverse for newest first (assuming object insertion order is roughly chronological)
  const recentNotes = allNotes.slice(0, 4);
  const hasMore = allNotes.length > 4;

  const formatNoteKey = (k) => {
    const parts = k.split('_to_');
    const parse = (str) => {
      const [y, m, d] = str.split('-').map(Number);
      return new Date(y, m - 1, d);
    };
    try {
      if (parts.length === 2) return `${format(parse(parts[0]), 'MMM d')} → ${format(parse(parts[1]), 'MMM d')}`;
      return format(parse(parts[0]), 'MMM d, yyyy');
    } catch { return k; }
  };

  // Drag select
  const getDate = useCallback((x,y) => {
    const el = document.elementFromPoint(x,y);
    const c = el?.closest?.('.dc');
    if (!c) return null;
    const iso = c.getAttribute('data-date');
    return iso ? new Date(iso) : null;
  }, []);

  const bind = useDrag(({ first, last, xy:[x,y], event }) => {
    if (!active) return;
    event?.preventDefault?.();
    const d = getDate(x,y);
    if (!d || !isSameMonth(d, date)) return;
    if (first) startDragSelection(d);
    else if (last) endDragSelection();
    else updateDragSelection(d);
  }, { filterTaps: true, pointer: { touch: true } });

  // Stagger cells
  useEffect(() => {
    if (!active || !gridRef.current) return;
    const cells = gridRef.current.querySelectorAll('.dc:not(.om)');
    gsap.fromTo(cells, {opacity:0,scale:0.6,y:10}, {opacity:1,scale:1,y:0,duration:0.35,stagger:0.015,ease:'back.out(1.2)',delay:0.2});
  }, [date, active]);

  return (
    <div className="cp" style={{ position: 'relative' }}>
      {showModal && (
        <div className="notes-modal" style={{ position: 'absolute', inset: 0, zIndex: 100, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(6px)', padding: '24px', borderRadius: '0 0 6px 6px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--line-color)', paddingBottom: '12px' }}>
            <h3 style={{ fontSize: '18px', color: 'var(--ink)' }}>All Saved Notes</h3>
            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--ink-light)' }}>✕</button>
          </div>
          <div className="notes-modal-list" style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '8px' }}>
            {allNotes.length === 0 && <p style={{ color: 'var(--ink-muted)', fontSize: '14px' }}>No notes found.</p>}
            {allNotes.map(({ key, text }) => (
              <div key={key} style={{ background: 'var(--paper-off)', padding: '12px', borderRadius: '6px', border: '1px solid var(--line-color)', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent-blue)', marginBottom: '6px' }}>{formatNoteKey(key)}</div>
                  <div style={{ fontSize: '13px', color: 'var(--ink)', whiteSpace: 'pre-wrap' }}>{text}</div>
                </div>
                <button onClick={() => deleteNote(key)} style={{ padding: '6px', cursor: 'pointer', background: 'none', border: 'none', color: 'var(--accent-red, #e53935)', opacity: 0.7, transition: 'opacity 0.2s', marginTop: '-4px', marginRight: '-4px' }} onMouseEnter={e=>e.target.style.opacity=1} onMouseLeave={e=>e.target.style.opacity=0.7} title="Delete note">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* ── Hero ── */}
      <div className="cp-hero">
        <img src={heroImg} alt="" className="cp-hero-img" draggable={false} />
        <div className="cp-hero-tint" style={{ background: theme.gradient, opacity: 0.45 }} />
        <div className="cp-hero-fade" />
        {/* Diagonal month badge */}
        <div className="cp-badge">
          <svg viewBox="0 0 220 90" preserveAspectRatio="none" className="badge-svg">
            <polygon points="50,0 220,0 220,90 0,90" fill="#2196F3" />
            <polygon points="70,0 100,0 50,90 20,90" fill="#64B5F6" fillOpacity="0.5" />
          </svg>
          <div className="badge-text">
            <span className="badge-yr">{year}</span>
            <span className="badge-mo">{theme.name.toUpperCase()}</span>
          </div>
        </div>
        {/* Nav buttons */}
        {onPrev && <button className="cp-nav cp-nav-l" onClick={onPrev} aria-label="Prev"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg></button>}
        {onNext && <button className="cp-nav cp-nav-r" onClick={onNext} aria-label="Next"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg></button>}
      </div>

      {/* ── Content: Notes + Grid ── */}
      <div className="cp-body">
        {/* Notes Column */}
        <div className="cp-notes" style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column' }}>
          
          {/* Actions at the top to ensure they are clickable in window mode */}
          <div className="cp-actions" style={{ marginBottom: '12px', position: 'relative', zIndex: 20 }}>
            <button className="cp-act-btn" onClick={(e) => { e.stopPropagation(); undoSelection(); }} disabled={!selectionHistory.length}>↩ Undo</button>
            <button className="cp-act-btn" onClick={(e) => { e.stopPropagation(); clearSelection(); }} disabled={!selectedRange.start}>✕ Reset</button>
          </div>

          <div className="cp-sel-badge" style={{ marginBottom: '12px', zIndex: 20 }}>
            {selectedRange.start ? store.getRangeLabel() : 'No selection'}
          </div>

          <div className="cp-notes-area" style={{ minHeight: '55px', height: '55px', flex: 'none', marginBottom: '8px', zIndex: 20, display: 'flex', flexDirection: 'column' }}>
            <textarea className="cp-notes-ta" value={noteText} onChange={e=>setNoteText(e.target.value)} onBlur={saveNote}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  saveNote();
                }
              }}
              placeholder={rangeKey ? 'Write note...' : 'Select dates first'} disabled={!rangeKey} style={{ flex: 1, minHeight: 0 }} />
            {rangeKey && <div style={{ position: 'absolute', right: '4px', bottom: '4px', display: 'flex', gap: '4px', zIndex: 10 }}>
              <button 
                onMouseDown={(e) => { e.preventDefault(); saveNote(); }} 
                disabled={!noteText} 
                style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', cursor: 'pointer', opacity: noteText ? 0.8 : 0, transition: 'opacity 0.2s', padding: '2px' }} 
                onMouseEnter={e=>e.target.style.opacity=1} 
                onMouseLeave={e=>e.target.style.opacity=0.8} 
                title="Save note"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
              </button>
              <button 
                onMouseDown={(e) => { e.preventDefault(); setNoteText(''); deleteNote(rangeKey); }} 
                disabled={!noteText} 
                style={{ background: 'none', border: 'none', color: 'var(--accent-red, #e53935)', cursor: 'pointer', opacity: noteText ? 0.6 : 0, transition: 'opacity 0.2s', padding: '2px' }} 
                onMouseEnter={e=>e.target.style.opacity=1} 
                onMouseLeave={e=>e.target.style.opacity=0.6} 
                title="Clear note"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
              </button>
            </div>}
          </div>

          {/* Recent Notes List */}
          <div className="saved-notes-list" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', overflow: 'hidden', position: 'relative', zIndex: 20 }}>
            <div style={{ fontSize: '10px', color: 'var(--ink-light)', fontWeight: 700, letterSpacing: '0.5px', marginTop: '4px', marginBottom: '2px' }}>RECENT NOTES</div>
            {recentNotes.length === 0 && <div style={{ fontSize: '10px', color: 'var(--ink-muted)' }}>No notes yet.</div>}
            
            {recentNotes.map(({ key, text }) => (
              <div key={key} className="recent-note-item" onClick={() => setShowModal(true)} style={{ background: 'var(--paper-off)', padding: '6px', borderRadius: '4px', border: '1px solid var(--line-color)', cursor: 'pointer', position: 'relative' }}>
                <div style={{ paddingRight: '16px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--accent-blue)', marginBottom: '2px' }}>{formatNoteKey(key)}</div>
                  <div style={{ fontSize: '11px', color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{text}</div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); deleteNote(key); }} style={{ position: 'absolute', top: '4px', right: '4px', background: 'none', border: 'none', color: 'var(--accent-red, #e53935)', opacity: 0.5, cursor: 'pointer', padding: '2px' }} onMouseEnter={e=>e.target.style.opacity=1} onMouseLeave={e=>e.target.style.opacity=0.5} title="Delete">✕</button>
              </div>
            ))}

            {hasMore ? (
              <button onClick={() => setShowModal(true)} style={{ background: 'none', border: 'none', color: 'var(--theme-accent, var(--accent-blue))', fontSize: '11px', fontWeight: 600, cursor: 'pointer', textAlign: 'left', padding: '6px 0', marginTop: 'auto' }}>Show all ({allNotes.length}) ↗</button>
            ) : (
              allNotes.length > 0 && <button onClick={() => setShowModal(true)} style={{ background: 'none', border: 'none', color: 'var(--ink-muted)', fontSize: '10px', cursor: 'pointer', textAlign: 'left', padding: '6px 0', marginTop: 'auto' }}>Expand ↗</button>
            )}
          </div>
        </div>

        {/* Grid */}
        <div className="cp-grid-wrap" ref={gridRef} {...bind()}>
          <div className="cp-dh">
            {DAYS.map(d => <div key={d} className={`cp-dh-cell ${d==='SAT'||d==='SUN'?'wk':''}`}>{d}</div>)}
          </div>
          <div className="cp-grid">
            {allDays.map(day => {
              const inM = isSameMonth(day, date);
              const td = isToday(day);
              const we = isWeekend(day);
              const hol = getHoliday(day);
              const ss = store.getSelectionState(day);
              const cn = ['dc', !inM&&'om', td&&'td', we&&'we', hol.isHoliday&&'hl', ss!=='none'&&`s-${ss}`].filter(Boolean).join(' ');
              return (
                <div key={day.toISOString()} className={cn} data-date={day.toISOString()}
                  onClick={() => inM && active && selectDate(day)}
                  onMouseEnter={() => inM && active && setHoverDate(day)}
                  onMouseLeave={() => active && setHoverDate(null)}>
                  <span className="dn">{day.getDate()}</span>
                  {hol.isHoliday && <span className="hd" title={hol.name} />}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
