import { useRef, useEffect } from 'react';
// import { motion } from 'framer-motion';
import gsap from 'gsap';
import { useCalendarStore } from '../store/useCalendarStore';
import { getMonthTheme } from '../utils/monthThemes';
import heroImg from '../assets/calendar-hero.png';

export default function HeroSection() {
  const currentDate = useCalendarStore((s) => s.currentDate);
  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();
  const theme = getMonthTheme(month);
  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const overlayRef = useRef(null);

  // Parallax on mouse move
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      gsap.to(imgRef.current, {
        x: x * 20, y: y * 15,
        rotateY: x * 3, rotateX: -y * 3,
        duration: 0.8, ease: 'power2.out',
      });
    };
    const handleLeave = () => {
      gsap.to(imgRef.current, { x:0, y:0, rotateY:0, rotateX:0, duration:0.6, ease:'power2.out' });
    };
    el.addEventListener('mousemove', handleMove);
    el.addEventListener('mouseleave', handleLeave);
    return () => { el.removeEventListener('mousemove', handleMove); el.removeEventListener('mouseleave', handleLeave); };
  }, []);

  // Entrance animation
  useEffect(() => {
    const tl = gsap.timeline();
    tl.fromTo(containerRef.current, { opacity:0, scale:0.95 }, { opacity:1, scale:1, duration:1, ease:'power3.out' });
    tl.fromTo(overlayRef.current, { opacity:0, y:30 }, { opacity:1, y:0, duration:0.7, ease:'power2.out' }, '-=0.4');
    return () => tl.kill();
  }, []);

  // Month change transition
  useEffect(() => {
    gsap.fromTo(overlayRef.current, { opacity:0, y:20 }, { opacity:1, y:0, duration:0.5, ease:'power2.out' });
  }, [month, year]);

  return (
    <motion.div className="hero-section" ref={containerRef} style={{ perspective: '1000px' }}>
      <div className="hero-image-wrapper" ref={imgRef}>
        <img src={heroImg} alt={`${theme.name} ${year}`} className="hero-img" draggable={false} />
        <div className="hero-gradient-overlay" style={{ background: theme.gradient, opacity: 0.55 }} />
      </div>
      <div className="hero-content" ref={overlayRef}>
        <span className="hero-emoji">{theme.emoji}</span>
        <h1 className="hero-month">{theme.name}</h1>
        <p className="hero-year">{year}</p>
      </div>
      {/* Spiral binding decoration */}
      <div className="spiral-binding">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="spiral-ring" />
        ))}
      </div>
    </motion.div>
  );
}
