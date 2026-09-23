import { Canvas } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import { useMemo, useState, useEffect } from 'react';
import { inputState, engineAudio } from './utils/store';
import PlayerBike from './components/game/PlayerBike';
import NitroPads from './components/game/NitroPads';
import { EnvironmentDecorations, Track, FinishLine, Obstacles } from './components/game/Environment';
import { trackCurve } from './utils/trackPath';
import * as THREE from 'three';

export default function App() {
  const [gameState, setGameState] = useState('MENU');
  const [countdownSequence, setCountdownSequence] = useState('3');
  const [score, setScore] = useState(5000);
  const [speedKmh, setSpeedKmh] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isFlashing, setIsFlashing] = useState(false);
  const [showGhost, setShowGhost] = useState(true);
  const [voucherCode, setVoucherCode] = useState(null);

  const obstacles = useMemo(() => Array.from({ length: 40 }).map(() => {
    const t = Math.random(); 
    const point = trackCurve.getPointAt(t);
    const tangent = trackCurve.getTangentAt(t);
    const offset = (Math.random() - 0.5) * 10;
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    return {
      x: point.x + normal.x * offset,
      z: point.z + normal.z * offset,
      t: t
    };
  }), []);
  
  const nitroPads = useMemo(() => Array.from({ length: 15 }).map(() => {
    const t = Math.random();
    const point = trackCurve.getPointAt(t);
    const tangent = trackCurve.getTangentAt(t);
    const offset = (Math.random() - 0.5) * 10;
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    return {
      x: point.x + normal.x * offset,
      z: point.z + normal.z * offset,
    };
  }), []);

  useEffect(() => {
    let timer;
    if (gameState === 'COUNTDOWN') {
      const sequence = ['3', '2', '1', 'GO!'];
      let step = 0;
      timer = setInterval(() => {
        step++;
        if (step < sequence.length) setCountdownSequence(sequence[step]);
        else {
          setGameState('PLAYING');
          setTimeout(() => setShowGhost(false), 4000);
          clearInterval(timer);
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameState]);

  useEffect(() => {
    const down = (e) => {
      if (gameState !== 'PLAYING') return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === '1') inputState.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === '3') inputState.right = true;
      if (e.key === 'ArrowUp' || e.key === 'w') inputState.gas = true;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === ' ') inputState.brake = true;
    };
    const up = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === '1') inputState.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === '3') inputState.right = false;
      if (e.key === 'ArrowUp' || e.key === 'w') inputState.gas = false;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === ' ') inputState.brake = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [gameState]);

  const triggerFlash = () => {
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 150);
  };

  const hapticTap = () => { if (navigator.vibrate) navigator.vibrate(15); };

  const getRewardTier = (finalScore) => {
    if (finalScore >= 10000) return 'Premium Merchandise';
    if (finalScore >= 7000) return '20% Service Voucher';
    if (finalScore >= 4000) return 'Bajaj Keyring';
    return 'Participation Badge';
  };

  const getNextTierMessage = (currentScore) => {
    if (currentScore < 4000) return `${4000 - currentScore} pts to Keyring`;
    if (currentScore < 7000) return `${7000 - currentScore} pts to Voucher`;
    if (currentScore < 10000) return `${10000 - currentScore} pts to Premium`;
    return 'Top Tier Unlocked!';
  };

  return (
    <>
      <div id="game-container" style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden', position: 'relative', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        
        {/* Collision Flash Overlay */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'red', opacity: isFlashing ? 0.4 : 0, pointerEvents: 'none', zIndex: 5, transition: 'opacity 0.1s' }} />

        {/* Start Menu Layer */}
        {gameState === 'MENU' && (
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 50, background: 'rgba(0,0,0,0.85)' }}>
            <h1 style={{ color: '#e31c25', fontStyle: 'italic', fontSize: '48px', margin: '0 0 10px 0', textShadow: '2px 2px 5px #000' }}>BAJAJ RACING</h1>
            <p style={{ color: '#ccc', marginBottom: '30px' }}>Dashain Challenge</p>
            <button
              onClick={() => {
                engineAudio.init(); 
                setGameState('COUNTDOWN');
              }}
              style={{ padding: '16px 40px', fontSize: '24px', fontWeight: 'bold', background: '#f7b500', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(247,181,0,0.4)' }}
            >
              START RACE
            </button>
          </div>
        )}

        {/* Top HUD */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', padding: '12px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%)', zIndex: 10, boxSizing: 'border-box' }}>
          <div style={{ flexShrink: 0 }}>
            <span style={{ fontSize: '11px', color: '#ccc', textTransform: 'uppercase' }}>Score</span>
            <div style={{ margin: 0, color: '#f7b500', fontSize: '22px', fontWeight: 'bold' }}>{score}</div>
            <div style={{ fontSize: '10px', color: '#fff', backgroundColor: '#e31c25', padding: '2px 4px', borderRadius: '4px', marginTop: '4px', display: 'inline-block', maxWidth: '90px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{getNextTierMessage(score)}</div>
          </div>

          <div style={{ flex: 1, margin: '0 10px', textAlign: 'center', minWidth: '40px' }}>
            <div style={{ width: '100%', height: '4px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '2px', position: 'relative', marginTop: '14px' }}>
              <div style={{ position: 'absolute', top: '-10px', left: `${progress}%`, transition: 'left 0.1s linear', fontSize: '14px' }}>🏍️</div>
              <div style={{ position: 'absolute', top: '-8px', right: '-12px', fontSize: '12px' }}>🏁</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
            <div style={{ textAlign: 'center', background: 'rgba(0,0,0,0.6)', padding: '6px 8px', borderRadius: '8px', border: '1px solid #444' }}>
              <span style={{ fontSize: '20px', fontWeight: '900', color: speedKmh > 80 ? '#e31c25' : '#ffffff' }}>{speedKmh}</span>
              <span style={{ fontSize: '9px', color: '#bbb', marginLeft: '2px' }}>KM/H</span>
            </div>
            <button onContextMenu={(e) => e.preventDefault()} onClick={() => setGameState(gameState === 'PLAYING' ? 'PAUSED' : 'PLAYING')} style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer', padding: 0 }}>
              {gameState === 'PAUSED' ? '▶️' : '⏸️'}
            </button>
          </div>
        </div>

        {/* 3D Canvas - Added Shadows */}
        <Canvas shadows camera={{ fov: 65 }}>
          {/* Fog added for depth realism */}
          <fog attach="fog" args={['#a0b4c8', 100, 800]} />
          
          <ambientLight intensity={0.6} />
          {/* Main sunlight casting realistic shadows */}
          <directionalLight 
            castShadow 
            position={[100, 200, 50]} 
            intensity={1.5} 
            shadow-mapSize={[2048, 2048]}
            shadow-camera-near={0.5}
            shadow-camera-far={500}
            shadow-camera-left={-100}
            shadow-camera-right={100}
            shadow-camera-top={100}
            shadow-camera-bottom={-100}
          />
          <Sky sunPosition={[120, 15, -120]} turbidity={0.08} rayleigh={0.4} />
          
          <Track />
          <EnvironmentDecorations />
          <FinishLine />
          <Obstacles obstacles={obstacles} />
          <NitroPads pads={nitroPads} />
          
          <PlayerBike 
            gameState={gameState} 
            setGameState={setGameState} 
            obstacles={obstacles} 
            nitroPads={nitroPads}
            setScore={setScore} 
            setSpeedKmh={setSpeedKmh} 
            setProgress={setProgress} 
            triggerFlash={triggerFlash} 
          />
        </Canvas>

        {/* Countdown Overlay */}
        {gameState === 'COUNTDOWN' && (
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 12 }}>
            <h1 style={{ fontSize: '120px', color: '#f7b500', textShadow: '4px 4px 10px rgba(0,0,0,0.8)', margin: 0, fontStyle: 'italic' }}>{countdownSequence}</h1>
          </div>
        )}

        {/* Pause Menu Overlay */}
        {gameState === 'PAUSED' && (
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 30 }}>
            <h1 style={{ color: 'white', fontSize: '48px', margin: '0 0 20px 0', letterSpacing: '2px' }}>PAUSED</h1>
            <button
              onContextMenu={(e) => e.preventDefault()}
              onClick={() => { setGameState('PLAYING'); engineAudio.ctx.resume(); }}
              style={{ padding: '15px 40px', fontSize: '24px', cursor: 'pointer', borderRadius: '8px', background: '#34c759', color: 'white', border: 'none', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}
            >
              ▶ RESUME
            </button>
          </div>
        )}

        {/* Mobile Controls Layer */}
        {(gameState === 'PLAYING' || gameState === 'COUNTDOWN') && (
          <div style={{ position: 'absolute', bottom: '24px', left: 0, right: 0, display: 'flex', justifyContent: 'space-between', padding: '0 20px', pointerEvents: 'none', zIndex: 15 }}>
            <div style={{ display: 'flex', gap: '10px', pointerEvents: 'auto' }}>
              <div
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onPointerDown={() => { hapticTap(); inputState.left = true; }} onPointerUp={() => (inputState.left = false)} onPointerLeave={() => (inputState.left = false)}
              >
                <button onContextMenu={(e) => e.preventDefault()} className={showGhost ? 'ghost-pulse control-btn' : 'control-btn'} style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255,255,255,0.7)', border: 'none', fontSize: '20px', pointerEvents: 'none' }}>◀</button>
              </div>
              <div
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onPointerDown={() => { hapticTap(); inputState.right = true; }} onPointerUp={() => (inputState.right = false)} onPointerLeave={() => (inputState.right = false)}
              >
                <button onContextMenu={(e) => e.preventDefault()} className={showGhost ? 'ghost-pulse control-btn' : 'control-btn'} style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255,255,255,0.7)', border: 'none', fontSize: '20px', pointerEvents: 'none' }}>▶</button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', pointerEvents: 'auto' }}>
              <div
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onPointerDown={() => { hapticTap(); inputState.brake = true; }} onPointerUp={() => (inputState.brake = false)} onPointerLeave={() => (inputState.brake = false)}
              >
                <button onContextMenu={(e) => e.preventDefault()} className="control-btn" style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255,59,48,0.8)', border: 'none', color: 'white', fontWeight: 'bold', fontSize: '12px', pointerEvents: 'none' }}>BRK</button>
              </div>
              <div
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onPointerDown={() => { hapticTap(); inputState.gas = true; }} onPointerUp={() => (inputState.gas = false)} onPointerLeave={() => (inputState.gas = false)}
              >
                <button onContextMenu={(e) => e.preventDefault()} className={showGhost ? 'ghost-pulse control-btn' : 'control-btn'} style={{ width: '75px', height: '75px', borderRadius: '50%', background: 'rgba(52,199,89,0.9)', border: 'none', color: 'white', fontWeight: 'bold', fontSize: '14px', pointerEvents: 'none' }}>GAS</button>
              </div>
            </div>
          </div>
        )}

        {/* Finished Screen Layer */}
        {gameState === 'FINISHED' && (
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.9)', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 20 }}>
            <h1 style={{ fontSize: '42px', margin: '0 0 10px 0', color: '#e31c25', fontStyle: 'italic', fontWeight: '900' }}>FINISH LINE!</h1>
            <p style={{ margin: '0 0 5px 0', fontSize: '18px', color: '#ccc' }}>Your Dashain Score</p>
            <h2 style={{ fontSize: '48px', color: '#f7b500', margin: '0 0 20px 0' }}>{score}</h2>
           
            <div style={{ backgroundColor: '#222', border: '2px solid #444', borderRadius: '12px', padding: '20px', textAlign: 'center', marginBottom: '30px', width: '80%', maxWidth: '350px' }}>
              <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#aaa' }}>Reward Unlocked:</p>
              <h3 style={{ margin: 0, color: '#fff', fontSize: '22px' }}>{getRewardTier(score)}</h3>
            </div>
           
            {!voucherCode ? (
              <button
                onContextMenu={(e) => e.preventDefault()}
                onClick={async () => {
                  try {
                    const res = await fetch('https://bajaj-racing-game.onrender.com/api/races', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ score, speedKmh })
                    });
                    const data = await res.json();
                    setVoucherCode(data.voucherCode);
                  } catch (err) {
                    console.error("Failed to claim voucher", err);
                  }
                }}
                style={{ padding: '16px 40px', fontSize: '20px', cursor: 'pointer', borderRadius: '8px', background: '#e31c25', color: 'white', border: 'none', fontWeight: 'bold', marginBottom: '15px', boxShadow: '0 4px 15px rgba(227,28,37,0.4)' }}
              >
                Claim Voucher
              </button>
            ) : (
              <div style={{ backgroundColor: '#fff', color: '#000', padding: '15px 30px', borderRadius: '8px', marginBottom: '15px', textAlign: 'center' }}>
                <p style={{ margin: '0 0 5px 0', fontSize: '14px', fontWeight: 'bold' }}>Your Code:</p>
                <h2 style={{ margin: 0, color: '#e31c25', letterSpacing: '2px' }}>{voucherCode}</h2>
                <p style={{ margin: '5px 0 0 0', fontSize: '12px' }}>Take a screenshot!</p>
              </div>
            )}
            <button onContextMenu={(e) => e.preventDefault()} onClick={() => window.location.reload()} style={{ background: 'none', border: 'none', color: '#888', textDecoration: 'underline', fontSize: '16px', cursor: 'pointer' }}>
              Race Again
            </button>
          </div>
        )}
      </div>
    </>
  );
}