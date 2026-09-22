import { useMemo, useState, useEffect } from 'react';
import { trackCurve } from '../../utils/trackPath';

export function RaceHUD({ playerProgress = 0 }) {
  const [timeLeft, setTimeLeft] = useState(90); // 90 second race duration

  // 1. Race Timer Logic
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // 2. Map the 3D track curve to a 2D SVG path
  const trackSVGPath = useMemo(() => {
    const points = trackCurve.getSpacedPoints(50);
    // Track X goes 0 to 400. Track Z goes -600 to +200.
    // We map Z to Y by adding 600 so it fits positively in our SVG viewBox
    return points.map((p, i) => {
      const x = p.x;
      const y = p.z + 600;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ') + ' Z';
  }, []);

  // 3. Map the player's real-time 3D position to the 2D SVG
  const dotPosition = useMemo(() => {
    const pt = trackCurve.getPointAt(playerProgress % 1); // Loops back at 1.0
    return { x: pt.x, y: pt.z + 600 };
  }, [playerProgress]);

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10 }}>
      
      {/* Countdown Timer */}
      <div style={{ position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'rgba(0,0,0,0.8)', padding: '10px 20px', borderRadius: '8px', color: timeLeft <= 10 ? '#ff3333' : '#fff', fontSize: '24px', fontWeight: 'bold', border: '2px solid #555' }}>
        ⏱ {formatTime(timeLeft)}
      </div>

      {/* Dynamic Minimap (Lap Graph) */}
      <div style={{ position: 'absolute', top: '80px', left: '20px', width: '120px', height: '240px', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: '12px', padding: '15px', border: '2px solid #333' }}>
        {/* viewBox includes padding (-100 offset) so the thick borders don't get clipped */}
        <svg viewBox="-100 -100 600 1000" style={{ width: '100%', height: '100%' }}>
          {/* Background track thickness */}
          <path d={trackSVGPath} fill="none" stroke="#444" strokeWidth="40" strokeLinecap="round" strokeLinejoin="round" />
          {/* Main red racing line */}
          <path d={trackSVGPath} fill="none" stroke="#e31c25" strokeWidth="15" strokeLinecap="round" strokeLinejoin="round" />
          {/* Player position dot */}
          <circle cx={dotPosition.x} cy={dotPosition.y} r="35" fill="#00ff00" stroke="#fff" strokeWidth="8" />
        </svg>
      </div>

    </div>
  );
}