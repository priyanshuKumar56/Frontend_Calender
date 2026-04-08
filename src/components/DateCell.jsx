import { useRef, useCallback, useEffect, memo } from 'react';
import gsap from 'gsap';
import { useCalendarStore } from '../store/useCalendarStore';
import { getHoliday, isWeekend } from '../utils/holidays';
import { isToday as checkToday } from 'date-fns';

const DateCell = memo(function DateCell({ date, isCurrentMonth }) {
  const cellRef = useRef(null);
  const magnetRef = useRef(null);
  const store = useCalendarStore();
  const selState = store.getSelectionState(date);
  const today = checkToday(date);
  const weekend = isWeekend(date);
  const holiday = getHoliday(date);

  // Magnetic hover effect
  const onMouseMove = useCallback((e) => {
    if (!magnetRef.current) return;
    const rect = magnetRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) * 0.25;
    const dy = (e.clientY - cy) * 0.25;
    gsap.to(magnetRef.current, { x: dx, y: dy, duration: 0.3, ease: 'power2.out' });
  }, []);

  const onMouseLeave = useCallback(() => {
    if (!magnetRef.current) return;
    gsap.to(magnetRef.current, { x: 0, y: 0, scale: 1, duration: 0.4, ease: 'elastic.out(1,0.4)' });
    store.setHoverDate(null);
  }, [store]);

  const onMouseEnter = useCallback(() => {
    if (!magnetRef.current) return;
    gsap.to(magnetRef.current, { scale: 1.08, duration: 0.2, ease: 'power2.out' });
    store.setHoverDate(date);
  }, [date, store]);

  // Glow pulse for selected cells
  useEffect(() => {
    if (!cellRef.current) return;
    if (selState === 'start' || selState === 'end') {
      const pulse = gsap.to(cellRef.current, {
        boxShadow: '0 0 20px 4px var(--sel-glow)',
        duration: 1.2, repeat: -1, yoyo: true, ease: 'sine.inOut',
      });
      return () => pulse.kill();
    }
  }, [selState]);

  const classes = [
    'date-cell',
    !isCurrentMonth && 'other-month',
    today && 'today',
    weekend && 'weekend',
    holiday.isHoliday && 'holiday',
    selState !== 'none' && `sel-${selState}`,
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={cellRef}
      className={classes}
      data-date={date.toISOString()}
      onMouseMove={onMouseMove}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div ref={magnetRef} className="date-inner">
        <span className="date-number">{date.getDate()}</span>
        {holiday.isHoliday && <span className="holiday-dot" title={holiday.name} />}
        {today && <span className="today-indicator" />}
      </div>
    </div>
  );
});

export default DateCell;
