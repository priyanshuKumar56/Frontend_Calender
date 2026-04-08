import { useRef, useEffect, useState, useCallback } from 'react';
import { useDrag } from '@use-gesture/react';
import { AnimatePresence, motion } from 'framer-motion';
import gsap from 'gsap';
import {
  startOfMonth, endOfMonth, eachDayOfInterval,
  startOfWeek, endOfWeek, format, isSameMonth,
} from 'date-fns';
import { useCalendarStore } from '../store/useCalendarStore';
import { getMonthTheme } from '../utils/monthThemes';
import DateCell from './DateCell';

const DAY_HEADERS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export default function CalendarGrid() {
  const {
    currentDate, navigateMonth, goToToday,
    clearSelection, undoSelection, selectionHistory,
    selectedRange, startDragSelection, updateDragSelection, endDragSelection,
    flipDirection,
  } = useCalendarStore();

  const gridRef = useRef(null);
  const flipRef = useRef(null);
  const [displayDate, setDisplayDate] = useState(currentDate);
  const [isFlipping, setIsFlipping] = useState(false);

  const month = displayDate.getMonth();
  const year = displayDate.getFullYear();
  const theme = getMonthTheme(month);

  // Generate calendar days (6 weeks grid)
  const monthStart = startOfMonth(displayDate);
  const monthEnd = endOfMonth(displayDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const allDays = eachDayOfInterval({ start: gridStart, end: gridEnd });

  // 3D page flip animation on month change
  useEffect(() => {
    if (format(currentDate,'yyyy-MM') === format(displayDate,'yyyy-MM')) return;
    setIsFlipping(true);
    const dir = flipDirection >= 0 ? 1 : -1;
    const tl = gsap.timeline({
      onComplete: () => { setDisplayDate(currentDate); setIsFlipping(false); },
    });
    tl.to(flipRef.current, {
      rotateX: dir * 90, opacity: 0, scale: 0.95,
      duration: 0.35, ease: 'power2.in',
      transformOrigin: dir > 0 ? 'top center' : 'bottom center',
    });
    tl.set(flipRef.current, { rotateX: dir * -90 });
    tl.to(flipRef.current, {
      rotateX: 0, opacity: 1, scale: 1,
      duration: 0.35, ease: 'power2.out',
    });
    return () => tl.kill();
  }, [currentDate]);

  // Stagger cells on render
  useEffect(() => {
    if (!gridRef.current || isFlipping) return;
    const cells = gridRef.current.querySelectorAll('.date-cell');
    gsap.fromTo(cells,
      { opacity: 0, y: 12, scale: 0.9 },
      { opacity: 1, y: 0, scale: 1, duration: 0.35, stagger: 0.012, ease: 'power2.out', delay: 0.15 }
    );
  }, [displayDate, isFlipping]);

  // Drag to select date range
  const getDateFromPoint = useCallback((x, y) => {
    const els = document.elementsFromPoint(x, y);
    const cell = els.find(el => el.classList.contains('date-cell') || el.closest('.date-cell'));
    const target = cell?.classList.contains('date-cell') ? cell : cell?.closest('.date-cell');
    if (!target) return null;
    const iso = target.getAttribute('data-date');
    return iso ? new Date(iso) : null;
  }, []);

  const bind = useDrag(({ first, last, xy: [x, y], event }) => {
    event?.preventDefault?.();
    const date = getDateFromPoint(x, y);
    if (!date) return;
    if (first) startDragSelection(date);
    else if (last) endDragSelection();
    else updateDragSelection(date);
  }, { filterTaps: true, pointer: { touch: true } });

  // Swipe to change month (mobile)
  const swipeBind = useDrag(({ swipe: [sx] }) => {
    if (sx === -1) navigateMonth(1);
    if (sx === 1) navigateMonth(-1);
  }, { axis: 'x', swipe: { distance: 50, velocity: 0.3 } });

  return (
    <div className="calendar-panel" {...swipeBind()}>
      {/* Toolbar */}
      <div className="calendar-toolbar">
        <button className="nav-btn" onClick={() => navigateMonth(-1)} aria-label="Previous month">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div className="toolbar-center">
          <h2 className="month-title">{theme.name} {year}</h2>
        </div>
        <button className="nav-btn" onClick={() => navigateMonth(1)} aria-label="Next month">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>

      {/* Action buttons */}
      <div className="calendar-actions">
        <button className="action-btn today-btn" onClick={goToToday}>Today</button>
        <button className="action-btn" onClick={undoSelection} disabled={selectionHistory.length===0}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 10h10a5 5 0 015 5v2"/><path d="M3 10l5-5M3 10l5 5"/></svg>
          Undo
        </button>
        <button className="action-btn" onClick={clearSelection} disabled={!selectedRange.start}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>
          Reset
        </button>
      </div>

      {/* Day headers */}
      <div className="day-headers">
        {DAY_HEADERS.map((d) => (
          <div key={d} className={`day-header ${d==='Sun'||d==='Sat'?'weekend-header':''}`}>{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="calendar-grid-wrapper" style={{ perspective: '1200px' }}>
        <div className="calendar-grid" ref={(el) => { gridRef.current = el; flipRef.current = el; }} {...bind()}>
          {allDays.map((day) => (
            <DateCell key={day.toISOString()} date={day} isCurrentMonth={isSameMonth(day, displayDate)} />
          ))}
        </div>
      </div>

      {/* Selection info */}
      <AnimatePresence>
        {selectedRange.start && (
          <motion.div className="selection-info"
            initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}
          >
            <span className="sel-label">Selected:</span>
            <span className="sel-range">
              {format(selectedRange.start, 'MMM d')}
              {selectedRange.end && ` → ${format(selectedRange.end, 'MMM d')}`}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
