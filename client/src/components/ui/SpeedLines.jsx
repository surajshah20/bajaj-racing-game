import { useEffect, useRef } from 'react';

/**
 * High-octane Anime Radial Speed Lines VFX
 * Radiates outward from center when exceeding high speeds or triggering nitro boosts.
 */
export default function SpeedLines({ speedKmh = 0, isNitro = false, isAirborne = false }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const triggerSpeed = 75;
      const speedFactor = Math.max(0, (speedKmh - triggerSpeed) / 70);
      const active = isNitro || isAirborne || speedFactor > 0.05;

      if (active) {
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const count = isNitro ? 55 : Math.floor(15 + speedFactor * 35);
        const maxRadius = Math.hypot(cx, cy);
        const innerRadius = Math.min(cx, cy) * (isNitro ? 0.35 : 0.55);

        ctx.lineWidth = isNitro ? 3.0 : 2.0;
        ctx.strokeStyle = isNitro ? 'rgba(0, 229, 255, 0.75)' : 'rgba(255, 255, 255, 0.45)';

        for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const r1 = innerRadius + Math.random() * (maxRadius * 0.4);
          const r2 = r1 + 80 + Math.random() * 160;

          const x1 = cx + Math.cos(angle) * r1;
          const y1 = cy + Math.sin(angle) * r1;
          const x2 = cx + Math.cos(angle) * r2;
          const y2 = cy + Math.sin(angle) * r2;

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [speedKmh, isNitro, isAirborne]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 11,
      }}
    />
  );
}
