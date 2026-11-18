import { useMemo } from 'react';
import { trackCurve, RING_ROAD_CHECKPOINTS, getNearestCheckpoint } from '../../utils/trackPath';
import StuntFeed from './StuntFeed';

/**
 * Kathmandu Ring Road Race HUD
 * Real-time circuit minimap, sector announcements, gear indicator, stopwatch & near-miss badges.
 */
export function RaceHUD({
  progress = 0,
  speedKmh = 0,
  score = 5000,
  coinsCollected = 0,
  raceTime = 0,
  nearMissActive = false,
  cameraMode = 0,
  setCameraMode,
  gameState,
  setGameState,
  showTouchControls = false,
  setShowTouchControls,
  currentStunt,
  comboMultiplier = 1,
}) {
  const progressRatio = (progress / 100) % 1.0;
  const currentCheckpoint = getNearestCheckpoint(progressRatio);

  // Map 3D curve directly to 2D SVG path (North = -Z, East = +X)
  const trackSVGPath = useMemo(() => {
    const points = trackCurve.getSpacedPoints(80);
    return (
      points
        .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.z.toFixed(1)}`)
        .join(' ') + ' Z'
    );
  }, []);

  // Player live location on the circuit map
  const dotPosition = useMemo(() => {
    const pt = trackCurve.getPointAt(progressRatio);
    return { x: pt.x, z: pt.z };
  }, [progressRatio]);

  // Simulated gear based on speed
  const gear = Math.min(6, Math.max(1, Math.floor(speedKmh / 22) + 1));
  const rpmPercent = Math.min(100, ((speedKmh % 22) / 22) * 100);

  const cameraNames = ['CHASE', 'CLOSE', 'FAR'];

  const formatStopwatch = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.floor(totalSeconds % 60);
    const ms = Math.floor((totalSeconds % 1) * 100);
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}.${ms < 10 ? '0' : ''}${ms}`;
  };

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 12, fontFamily: 'system-ui, sans-serif' }}>

      {/* TOP HEADER BAR */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          padding: '10px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%)',
          boxSizing: 'border-box',
        }}
      >
        {/* Left: Score & Dashain Coins */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ background: 'rgba(0,0,0,0.65)', padding: '6px 12px', borderRadius: '8px', border: '1px solid #444' }}>
            <span style={{ fontSize: '10px', color: '#aaa', textTransform: 'uppercase', display: 'block', letterSpacing: '1px' }}>Score</span>
            <span style={{ color: '#f7b500', fontSize: '20px', fontWeight: '800' }}>{score}</span>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.65)', padding: '6px 10px', borderRadius: '8px', border: '1px solid #444', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ fontSize: '16px' }}>🪙</span>
            <div>
              <span style={{ fontSize: '9px', color: '#aaa', display: 'block' }}>COINS</span>
              <span style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold' }}>{coinsCollected}</span>
            </div>
          </div>
        </div>

        {/* Center: Kathmandu Sector Announcement & Live Stopwatch */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <div style={{ textAlign: 'center', background: 'rgba(10,14,20,0.75)', padding: '5px 16px', borderRadius: '20px', border: '1px solid #005a9c', boxShadow: '0 2px 10px rgba(0,90,156,0.3)' }}>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#ffffff', letterSpacing: '0.5px' }}>
              {currentCheckpoint.nepali}
            </div>
            <div style={{ fontSize: '10px', color: '#f7b500', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {currentCheckpoint.name} • {currentCheckpoint.desc}
            </div>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.6)', padding: '2px 10px', borderRadius: '12px', border: '1px solid #333' }}>
            <span style={{ fontSize: '11px', color: '#00e5ff', fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: '1px' }}>
              ⏱ {formatStopwatch(raceTime)}
            </span>
          </div>
        </div>

        {/* Right: Camera Switcher, Touch Toggle & Pause */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', pointerEvents: 'auto' }}>
          {setShowTouchControls && (
            <button
              onClick={() => setShowTouchControls((prev) => !prev)}
              style={{
                background: showTouchControls ? 'rgba(0, 229, 255, 0.22)' : 'rgba(20,20,25,0.85)',
                color: showTouchControls ? '#00e5ff' : '#aaa',
                border: showTouchControls ? '1px solid #00e5ff' : '1px solid #555',
                borderRadius: '8px',
                padding: '6px 10px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
              title="Toggle On-Screen Touch Controls"
            >
              <span>🎮</span> {showTouchControls ? 'TOUCH ON' : 'TOUCH OFF'}
            </button>
          )}

          {setCameraMode && (
            <button
              onClick={() => setCameraMode((prev) => (prev + 1) % 3)}
              style={{
                background: 'rgba(20,20,25,0.85)',
                color: '#fff',
                border: '1px solid #555',
                borderRadius: '8px',
                padding: '6px 10px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
              title="Change Camera Angle (Press C)"
            >
              <span>🎥</span> {cameraNames[cameraMode]}
            </button>
          )}

          <button
            onClick={() => setGameState(gameState === 'PLAYING' ? 'PAUSED' : 'PLAYING')}
            style={{
              background: 'rgba(20,20,25,0.85)',
              border: '1px solid #555',
              color: 'white',
              fontSize: '16px',
              cursor: 'pointer',
              padding: '6px 10px',
              borderRadius: '8px',
            }}
          >
            {gameState === 'PAUSED' ? '▶️' : '⏸️'}
          </button>
        </div>
      </div>

      {/* ROBLOX FLOATING ARCADE STUNT COMBO FEED */}
      <StuntFeed currentStunt={currentStunt} comboMultiplier={comboMultiplier} />

      {/* FLOATING NEAR-MISS BONUS BADGE */}
      {nearMissActive && !currentStunt && (
        <div
          style={{
            position: 'absolute',
            top: '115px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, #ff0055 0%, #ff5500 100%)',
            color: '#ffffff',
            padding: '8px 20px',
            borderRadius: '24px',
            fontWeight: '900',
            fontSize: '15px',
            letterSpacing: '1px',
            boxShadow: '0 4px 20px rgba(255, 0, 85, 0.6)',
            animation: 'pulse 0.3s ease-in-out',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            zIndex: 15,
          }}
        >
          <span>⚡</span> NEAR MISS! +150
        </div>
      )}

      {/* KATHMANDU RING ROAD CIRCUIT MINIMAP (Top-Left) */}
      <div
        style={{
          position: 'absolute',
          top: '68px',
          left: '12px',
          width: '120px',
          height: '120px',
          backgroundColor: 'rgba(12, 16, 22, 0.75)',
          borderRadius: '12px',
          padding: '8px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
          pointerEvents: 'none',
        }}
      >
        <div style={{ fontSize: '8px', color: '#aaa', fontWeight: 'bold', textAlign: 'center', marginBottom: '2px', letterSpacing: '0.5px' }}>
          RING ROAD MAP
        </div>
        <svg viewBox="-620 -720 1200 1220" style={{ width: '100%', height: '90%' }}>
          <path
            d={trackSVGPath}
            fill="none"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="80"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={trackSVGPath}
            fill="none"
            stroke="#e31c25"
            strokeWidth="35"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {RING_ROAD_CHECKPOINTS.map((cp) => (
            <circle
              key={cp.id}
              cx={cp.x}
              cy={cp.z}
              r="22"
              fill="#f7b500"
              stroke="#000"
              strokeWidth="6"
            />
          ))}

          <circle
            cx={dotPosition.x}
            cy={dotPosition.z}
            r="38"
            fill="#00e5ff"
            stroke="#ffffff"
            strokeWidth="12"
          />
        </svg>
      </div>

      {/* SPEEDOMETER & GEAR GAUGE (Bottom-Center - Zero Overlap with Touch Controls) */}
      <div
        style={{
          position: 'absolute',
          bottom: showTouchControls ? '88px' : '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          background: 'rgba(8, 12, 18, 0.88)',
          backdropFilter: 'blur(10px)',
          padding: '8px 18px',
          borderRadius: '14px',
          border: '1px solid rgba(255, 255, 255, 0.16)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
          minWidth: '135px',
          pointerEvents: 'none',
          zIndex: 14,
          transition: 'bottom 0.25s ease-out',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center' }}>
          <span
            style={{
              fontSize: '36px',
              fontWeight: '900',
              fontStyle: 'italic',
              letterSpacing: '1px',
              color: speedKmh > 120 ? '#ff3b30' : speedKmh > 80 ? '#f7b500' : '#00e5ff',
              textShadow: speedKmh > 100 ? '0 0 15px rgba(227,28,37,0.6)' : 'none',
            }}
          >
            {speedKmh}
          </span>
          <span style={{ fontSize: '11px', color: '#aaa', marginLeft: '6px', fontWeight: 'bold' }}>KM/H</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 'bold',
              color: '#0a0d12',
              background: '#00e5ff',
              padding: '2px 8px',
              borderRadius: '4px',
              letterSpacing: '0.5px',
            }}
          >
            GEAR {gear}
          </span>
          <div style={{ flex: 1, height: '6px', width: '70px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${rpmPercent}%`,
                height: '100%',
                background: rpmPercent > 85 ? 'linear-gradient(90deg, #f7b500, #ff3b30)' : '#f7b500',
                boxShadow: rpmPercent > 85 ? '0 0 8px #ff3b30' : 'none',
                transition: 'width 0.05s',
              }}
            />
          </div>
        </div>
      </div>

    </div>
  );
}
