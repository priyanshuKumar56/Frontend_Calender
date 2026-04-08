import { useRef, useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useDrag } from '@use-gesture/react';
import gsap from 'gsap';
import Lenis from '@studio-freight/lenis';
import { addMonths, subMonths } from 'date-fns';
import { useCalendarStore } from '../store/useCalendarStore';
import { getMonthTheme } from '../utils/monthThemes';
import CalendarPage from './CalendarPage';

const ThreeScene = lazy(() => import('./ThreeScene'));

export default function WallCalendar() {
  const store = useCalendarStore();
  const [overDate, setOverDate] = useState(new Date());
  const [underDate, setUnderDate] = useState(null);
  const [flipping, setFlipping] = useState(false);
  const [entryDone, setEntryDone] = useState(false);

  const frontRef = useRef(null);
  const foldRef = useRef(null);
  const foldShadowRef = useRef(null);
  const shadowRef = useRef(null);
  const containerRef = useRef(null);
  const tweenRef = useRef(null);

  const theme = getMonthTheme(overDate.getMonth());

  // Lenis
  useEffect(() => {
    const l = new Lenis({ duration: 1.2, smooth: true });
    const r = (t) => { l.raf(t); requestAnimationFrame(r); };
    requestAnimationFrame(r);
    return () => l.destroy();
  }, []);

  // Theme vars
  useEffect(() => {
    const s = document.documentElement.style;
    s.setProperty('--accent-blue', '#2196F3');
    s.setProperty('--theme-accent', theme.accent);
    s.setProperty('--theme-secondary', theme.secondary);
  }, [theme]);

  // ── CORNER FOLD ANIMATION ──
  // Uses a continuous mathematical sweep mapped from p (0→1) into c (100→-60).
  // When p crosses into the second half, the page realistically crossfades out
  // instead of geometrically shrinking into an awkward rigid triangle.
  const updateFold = useCallback((p) => {
    const fr = frontRef.current, fo = foldRef.current, fs = foldShadowRef.current;
    if (!fr || !fo || !fs) return;

    if (p <= 0.003) {
      fr.style.clipPath = 'none';
      fr.style.opacity = '1';
      fo.style.opacity = '0';
      fs.style.opacity = '0';
      return;
    }
    if (p >= 0.997) {
      fr.style.clipPath = 'polygon(0 0, 0 0, 0 0)';
      fr.style.opacity = '0';
      fo.style.opacity = '0';
      fs.style.opacity = '0';
      return;
    }

    // Map p (0 -> 1) to c (100 -> -60) for a sweeping peel
    const c = 100 - (p * 160);

    if (c >= 0) {
      // ── Front page peels up from bottom right ──
      fr.style.clipPath = `polygon(0 0, 100% 0, 100% ${c}%, ${c}% 100%, 0 100%)`;
      fr.style.opacity = '1';

      // Fold strictly matches the peeled area bounds
      fo.style.opacity = '1';
      fo.style.clipPath = `polygon(${c}% ${c}%, 100% ${c}%, ${c}% 100%)`;

      // Shadow trails
      const si = Math.sin(((100 - c) / 100) * Math.PI * 0.5) * 0.45;
      fs.style.opacity = String(si);
      const sc = Math.max(0, c - 8);
      fs.style.clipPath = `polygon(${sc}% ${sc}%, 100% ${sc}%, ${sc}% 100%)`;
    } else {
      // ── Beyond the center: diagonal crosses top-left ──
      const intercept = 100 + c;
      
      if (intercept > 0) {
        fr.style.clipPath = `polygon(0 0, ${intercept}% 0, 0 ${intercept}%)`;
      } else {
        fr.style.clipPath = `polygon(0 0, 0 0, 0 0)`;
      }
      
      // Realistically fast fade-out to mimic the paper flicking over completely
      const fadeInfo = Math.max(0, 1 - (c / -35));
      fr.style.opacity = String(fadeInfo);
      
      fo.style.opacity = String(fadeInfo * 0.85);
      fo.style.clipPath = `polygon(${c}% ${c}%, ${100+c}% ${c}%, ${c}% ${100+c}%)`;
      
      fs.style.opacity = String(fadeInfo * 0.15);
      const sc = c - 8;
      fs.style.clipPath = `polygon(${sc}% ${sc}%, ${100+sc}% ${sc}%, ${sc}% ${100+sc}%)`;
    }
  }, []);

  // ── ENTRY ANIMATION ──
  useEffect(() => {
    const tl = gsap.timeline({ onComplete: () => setEntryDone(true) });
    tl.set('.cal-card', { opacity: 0, scale: 0.45, y: 100, rotateX: 20 });
    tl.set('.spiral-ring', { scale: 0, opacity: 0 });
    tl.set('.wall-hook-pin', { scaleY: 0, opacity: 0 });
    tl.set('.cal-shadow', { opacity: 0, scaleX: 0.5 });

    tl.to('.entry-overlay', { opacity: 0, duration: 1, ease: 'power2.inOut' }, 0.4);
    tl.to('.cal-card', { opacity: 1, scale: 1, y: 0, rotateX: 0, duration: 1.6, ease: 'elastic.out(1,0.5)' }, 0.5);
    tl.to('.wall-hook-pin', { scaleY: 1, opacity: 1, duration: 0.35, ease: 'power3.out' }, 0.7);
    tl.to('.spiral-ring', { scale: 1, opacity: 1, stagger: 0.025, duration: 0.2, ease: 'back.out(3)' }, 0.9);
    tl.to('.cal-shadow', { opacity: 1, scaleX: 1, duration: 0.7, ease: 'power2.out' }, 1.1);
    tl.fromTo('.cp-hero-img', { scale: 1.2, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.8, ease: 'power2.out' }, 0.9);
    tl.fromTo('.cp-badge', { x: 70, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, ease: 'power3.out' }, 1.3);
    tl.fromTo('.cp-body', { opacity: 0, y: 25 }, { opacity: 1, y: 0, duration: 0.5 }, 1.4);

    return () => tl.kill();
  }, []);

  // ── FLIP FORWARD ──
  const flipForward = useCallback(() => {
    if (flipping) return;
    setFlipping(true);
    const next = addMonths(overDate, 1);
    setUnderDate(next);

    const px = { p: 0 };
    tweenRef.current = gsap.to(px, {
      p: 1, duration: 1.6, ease: 'sine.inOut',
      onUpdate: () => updateFold(px.p),
      onComplete: () => {
        setOverDate(next); setUnderDate(null);
        setFlipping(false); updateFold(0);
        if (frontRef.current) frontRef.current.style.opacity = '1';
        store.navigateMonth(1);
      }
    });
  }, [flipping, overDate, store, updateFold]);

  // ── FLIP BACKWARD ──
  const flipBackward = useCallback(() => {
    if (flipping) return;
    setFlipping(true);
    const prev = subMonths(overDate, 1);
    const old = overDate;

    if (frontRef.current) {
      frontRef.current.style.clipPath = 'polygon(0 0,0 0,0 0)';
      frontRef.current.style.opacity = '0';
    }
    setUnderDate(old); setOverDate(prev);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        updateFold(1);
        const px = { p: 1 };
        tweenRef.current = gsap.to(px, {
          p: 0, duration: 1.6, ease: 'sine.inOut',
          onUpdate: () => updateFold(px.p),
          onComplete: () => {
            setUnderDate(null); setFlipping(false);
            updateFold(0);
            if (frontRef.current) frontRef.current.style.opacity = '1';
            store.navigateMonth(-1);
          }
        });
      });
    });
  }, [flipping, overDate, store, updateFold]);

  // ── CORNER DRAG ──
  const cornerBind = useDrag(({ first, last, movement: [mx, my], velocity: [vx] }) => {
    if (first && !flipping) {
      setFlipping(true);
      setUnderDate(addMonths(overDate, 1));
    }
    if (!flipping) return;
    const diag = Math.sqrt(mx * mx + my * my);
    const p = Math.min(1, diag / 400);
    updateFold(p);

    if (last) {
      const px = { p };
      if (p > 0.25 || vx > 0.4) {
        const next = addMonths(overDate, 1);
        gsap.to(px, { p: 1, duration: 0.5, ease: 'power2.out',
          onUpdate: () => updateFold(px.p),
          onComplete: () => { setOverDate(next); setUnderDate(null); setFlipping(false); updateFold(0); store.navigateMonth(1); }
        });
      } else {
        gsap.to(px, { p: 0, duration: 0.4, ease: 'power2.out',
          onUpdate: () => updateFold(px.p),
          onComplete: () => { setUnderDate(null); setFlipping(false); updateFold(0); }
        });
      }
    }
  }, { from: [0, 0] });

  return (
    <div className="wall-wrapper">
      <Suspense fallback={null}><ThreeScene /></Suspense>
      {!entryDone && <div className="entry-overlay" />}

      <div className="cal-outer" ref={containerRef}>
        <div className="wall-hook"><div className="wall-hook-pin" /><div className="wall-hook-string" /></div>

        <div className="spiral-binding">
          {Array.from({ length: 18 }).map((_, i) => <div key={i} className="spiral-ring" />)}
        </div>

        <div className="cal-card">
          {underDate && <div className="cal-page back-pg"><CalendarPage date={underDate} active={false} /></div>}

          <div className="fold-shadow" ref={foldShadowRef} />

          <div className="cal-page front-pg" ref={frontRef}>
            <CalendarPage date={overDate} active={!flipping} onNext={flipForward} onPrev={flipBackward} />
          </div>

          <div className="fold-overlay" ref={foldRef} />

          <div className="corner-hint" {...cornerBind()}>
            <svg viewBox="0 0 40 40" className="corner-curl-svg"><path d="M40,0 Q40,40 0,40 L40,40 Z" fill="rgba(0,0,0,0.06)" /><path d="M40,0 Q40,40 0,40" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="1" /></svg>
          </div>
        </div>

        <div className="cal-shadow" ref={shadowRef} />
      </div>

      <div className="cal-footer">
        <span>⤡ Drag corner to flip</span><span className="dot">·</span>
        <span>Click arrows to turn pages</span><span className="dot">·</span>
        <span>Select dates &amp; add notes</span>
      </div>
    </div>
  );
}
