import { useEffect, useState } from 'react';

export default function CountUp({ value, duration = 700 }: { value: string | number; duration?: number }) {
  const raw = String(value); const numeric = Number(raw.replace(/[^0-9.]/g, ''));
  const [current, setCurrent] = useState(0);
  useEffect(() => { let frame: number; const started = performance.now(); const tick = (now: number) => { const progress = Math.min((now - started) / duration, 1); setCurrent(numeric * progress); if (progress < 1) frame = requestAnimationFrame(tick); }; frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame); }, [numeric, duration]);
  const formatted = raw.includes('%') ? `${current.toFixed(1)}%` : raw.includes('L') ? `${current.toFixed(2)}L` : Math.round(current).toLocaleString('en-IN');
  return <>{formatted}</>;
}
