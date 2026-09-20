import { Canvas, useFrame } from '@react-three/fiber';
import { Sky, useGLTF } from '@react-three/drei';
import { useRef, useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';

const inputState = { left: false, right: false, gas: false, brake: false };
const FINISH_LINE_Z = -1200;

class EngineAudio {
  constructor() {
    this.ctx = null;
    this.osc = null;
    this.gain = null;
    this.filter = null;
    this.initialized = false;
  }
  init() {
    if (this.initialized) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    this.ctx = new AudioContext();
    this.osc = this.ctx.createOscillator();
    this.osc.type = 'sawtooth';
    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 450;
    this.gain = this.ctx.createGain();
    this.gain.gain.value = 0.08;
    this.osc.connect(this.filter);
    this.filter.connect(this.gain);
    this.gain.connect(this.ctx.destination);
    this.osc.start();
    this.initialized = true;
  }
  updatePitch(speedRatio) {
    if (!this.initialized || !this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const targetFreq = 55 + speedRatio * 180;
    this.osc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.08);
  }
  stop() {
    if (this.gain) {
      this.gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2);
    }
  }
}
const engineAudio = new EngineAudio();

function Himalayas() {
  const peaks = useMemo(() => {
    return Array.from({ length: 18 }).map((_, i) => ({
      x: (i - 9) * 35, z: -1350, height: 70 + Math.sin(i * 1.7) * 30, radius: 30 + (i % 3) * 8
    }));
  }, []);
  return (
    <group>
      {peaks.map((p, i) => (
        <mesh key={i} position={[p.x, p.height / 2 - 10, p.z]}>
          <coneGeometry args={[p.radius, p.height, 5]} />
          <meshStandardMaterial color="#f0f4f8" roughness={0.9} flatShading />
        </mesh>
      ))}
    </group>
  );
}

function LingePing({ position, rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation} scale={1.2}>
      <mesh position={[-1.2, 3.5, -1.2]} rotation={[0.2, 0, -0.2]}><cylinderGeometry args={[0.08, 0.1, 8, 8]} /><meshStandardMaterial color="#b5944d" /></mesh>
      <mesh position={[1.2, 3.5, -1.2]} rotation={[0.2, 0, 0.2]}><cylinderGeometry args={[0.08, 0.1, 8, 8]} /><meshStandardMaterial color="#b5944d" /></mesh>
      <mesh position={[-1.2, 3.5, 1.2]} rotation={[-0.2, 0, -0.2]}><cylinderGeometry args={[0.08, 0.1, 8, 8]} /><meshStandardMaterial color="#b5944d" /></mesh>
      <mesh position={[1.2, 3.5, 1.2]} rotation={[-0.2, 0, 0.2]}><cylinderGeometry args={[0.08, 0.1, 8, 8]} /><meshStandardMaterial color="#b5944d" /></mesh>
      <mesh position={[0, 7, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.12, 0.12, 2.8]} /><meshStandardMaterial color="#8c6a2b" /></mesh>
      <mesh position={[0, 2.5, 0]}><boxGeometry args={[0.8, 0.08, 0.4]} /><meshStandardMaterial color="#593b13" /></mesh>
    </group>
  );
}

function Track() {
  const trackRef = useRef();
  useFrame((state) => {
    if (trackRef.current) {
      trackRef.current.position.z = state.camera.position.z - 100;
    }
  });
  return (
    <mesh ref={trackRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
      <planeGeometry args={[20, 500]} />
      <meshStandardMaterial color="#333333" />
    </mesh>
  );
}

function DashainArch({ zPosition }) {
  const colors = ['#0033cc', '#ffffff', '#e31c25', '#009900', '#ffcc00'];
  return (
    <group position={[0, 0, zPosition]}>
      <mesh position={[-8.5, 4.5, 0]}><cylinderGeometry args={[0.35, 0.45, 9]} /><meshStandardMaterial color="#666666" /></mesh>
      <mesh position={[8.5, 4.5, 0]}><cylinderGeometry args={[0.35, 0.45, 9]} /><meshStandardMaterial color="#666666" /></mesh>
      <mesh position={[-8.5, 9.2, 0]}><sphereGeometry args={[0.55]} /><meshStandardMaterial color="#ff9900" emissive="#ffaa00" emissiveIntensity={3} /></mesh>
      <mesh position={[8.5, 9.2, 0]}><sphereGeometry args={[0.55]} /><meshStandardMaterial color="#ff9900" emissive="#ffaa00" emissiveIntensity={3} /></mesh>
      <mesh position={[0, 9, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.03, 0.03, 17.5]} /><meshBasicMaterial color="#dddddd" /></mesh>
      {Array.from({ length: 15 }).map((_, i) => (
        <mesh key={i} position={[-7 + i, 8.4, 0]}><planeGeometry args={[0.75, 1.1]} /><meshStandardMaterial color={colors[i % 5]} side={THREE.DoubleSide} /></mesh>
      ))}
    </group>
  );
}

function EnvironmentDecorations() {
  return (
    <>
      <Himalayas />
      {Array.from({ length: 18 }).map((_, i) => <DashainArch key={i} zPosition={-70 - i * 65} />)}
      {Array.from({ length: 7 }).map((_, i) => <LingePing key={i} position={[i % 2 === 0 ? -14 : 14, -0.5, -150 - i * 140]} rotation={[0, i % 2 === 0 ? 0.3 : -0.3, 0]} />)}
    </>
  );
}

function Obstacles({ obstacles }) {
  return (
    <>
      {obstacles.map((obs, i) => (
        <group key={i} position={[obs.x, 0, obs.z]}>
          <mesh position={[0, 0.6, 0]}><coneGeometry args={[0.5, 1.3, 14]} /><meshStandardMaterial color="#ff4500" roughness={0.4} /></mesh>
          <mesh position={[0, 0.05, 0]}><boxGeometry args={[1.1, 0.1, 1.1]} /><meshStandardMaterial color="#111111" /></mesh>
        </group>
      ))}
    </>
  );
}

function FinishLine() {
  return (
    <group position={[0, -0.48, FINISH_LINE_Z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[14, 5]} /><meshStandardMaterial color="#e31c25" /></mesh>
    </group>
  );
}

function PlayerBike({ gameState, setGameState, obstacles, setScore, setSpeedKmh, setProgress, triggerFlash }) {
  const bikeRef = useRef();
  const hitObstacles = useRef(new Set());
  const velocity = useRef(0);
  const currentLean = useRef(0);
  const suspensionPhase = useRef(0);
  const { scene } = useGLTF('/bike.glb');

  useFrame((state, delta) => {
    if (!bikeRef.current || gameState !== 'PLAYING') {
      if (gameState === 'PAUSED' || gameState === 'COUNTDOWN') engineAudio.updatePitch(0);
      return;
    }

    if (bikeRef.current.position.z <= FINISH_LINE_Z) {
      setGameState('FINISHED');
      engineAudio.stop();
      return;
    }

    const maxSpeed = 55;
    const accel = 25;
    const drag = 12;
    const brakeForce = 45;

    if (inputState.gas) velocity.current = Math.min(maxSpeed, velocity.current + accel * delta);
    else if (inputState.brake) velocity.current = Math.max(0, velocity.current - brakeForce * delta);
    else velocity.current = Math.max(0, velocity.current - drag * delta);

    setSpeedKmh(Math.round(velocity.current * 2.2));
    engineAudio.updatePitch(velocity.current / maxSpeed);

    const progressPercent = Math.min(100, Math.max(0, (bikeRef.current.position.z / FINISH_LINE_Z) * 100));
    setProgress(progressPercent);

    bikeRef.current.position.z -= velocity.current * delta;

    const trackBoundary = 5.8;
    const turnRate = 12 * (velocity.current / maxSpeed);
    let targetLean = 0;

    if (velocity.current > 1) {
      if (inputState.left && bikeRef.current.position.x > -trackBoundary) {
        bikeRef.current.position.x -= turnRate * delta; targetLean = 0.38;
      } else if (inputState.right && bikeRef.current.position.x < trackBoundary) {
        bikeRef.current.position.x += turnRate * delta; targetLean = -0.38;
      }
    }

    currentLean.current = THREE.MathUtils.lerp(currentLean.current, targetLean, 0.12);
    bikeRef.current.rotation.z = currentLean.current;
    bikeRef.current.rotation.x = THREE.MathUtils.lerp(bikeRef.current.rotation.x, inputState.brake ? 0.08 : (inputState.gas ? -0.04 : 0), 0.1);

    if (velocity.current > 2) {
      suspensionPhase.current += delta * (velocity.current * 0.8);
      bikeRef.current.position.y = Math.sin(suspensionPhase.current) * 0.04;
    } else {
      bikeRef.current.position.y = THREE.MathUtils.lerp(bikeRef.current.position.y, 0, 0.1);
    }

    obstacles.forEach((obs, index) => {
      if (!hitObstacles.current.has(index)) {
        const dx = Math.abs(bikeRef.current.position.x - obs.x);
        const dz = Math.abs(bikeRef.current.position.z - obs.z);
        if (dx < 1.3 && dz < 1.8) {
          hitObstacles.current.add(index);
          velocity.current = Math.max(8, velocity.current * 0.4);
          setScore((prev) => Math.max(0, prev - 500));
          triggerFlash();
          if (navigator.vibrate) navigator.vibrate([200]);
        }
      }
    });

    const camDistance = 11 + (velocity.current / maxSpeed) * 2;
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, bikeRef.current.position.x, 0.15);
    state.camera.position.y = bikeRef.current.position.y + 4.8;
    state.camera.position.z = bikeRef.current.position.z + camDistance;
    state.camera.lookAt(bikeRef.current.position.x, bikeRef.current.position.y + 1.2, bikeRef.current.position.z - 25);
  });

  return (
    <mesh ref={bikeRef} position={[0, 0, 0]}>
      <primitive object={scene} scale={3.4} rotation={[0, Math.PI, 0]} />
    </mesh>
  );
}

export default function App() {
  const [gameState, setGameState] = useState('COUNTDOWN');
  const [countdownSequence, setCountdownSequence] = useState('3');
  const [score, setScore] = useState(5000);
  const [speedKmh, setSpeedKmh] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isFlashing, setIsFlashing] = useState(false);
  const [showGhost, setShowGhost] = useState(true);
  const [voucherCode, setVoucherCode] = useState(null);

  const obstacles = useMemo(() => Array.from({ length: 65 }).map(() => ({
    x: (Math.random() - 0.5) * 11, z: -(Math.random() * 1100) - 40
  })), []);

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
          engineAudio.init();
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

        {/* Top HUD */}
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%)', zIndex: 10, boxSizing: 'border-box' }}>
          <div>
            <span style={{ fontSize: '12px', color: '#ccc', textTransform: 'uppercase' }}>Score</span>
            <div style={{ margin: 0, color: '#f7b500', fontSize: '28px', fontWeight: 'bold' }}>{score}</div>
            <div style={{ fontSize: '11px', color: '#fff', backgroundColor: '#e31c25', padding: '2px 6px', borderRadius: '4px', marginTop: '4px', display: 'inline-block' }}>{getNextTierMessage(score)}</div>
          </div>

          <div style={{ flex: 1, margin: '0 30px', textAlign: 'center' }}>
            <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '3px', position: 'relative', marginTop: '10px' }}>
              <div style={{ position: 'absolute', top: '-10px', left: `${progress}%`, transition: 'left 0.1s linear', fontSize: '18px' }}>🏍️</div>
              <div style={{ position: 'absolute', top: '-8px', right: '-15px', fontSize: '16px' }}>🏁</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <div style={{ textAlign: 'center', background: 'rgba(0,0,0,0.6)', padding: '6px 12px', borderRadius: '8px', border: '1px solid #444' }}>
              <span style={{ fontSize: '24px', fontWeight: '900', color: speedKmh > 80 ? '#e31c25' : '#ffffff' }}>{speedKmh}</span>
              <span style={{ fontSize: '11px', color: '#bbb', marginLeft: '2px' }}>KM/H</span>
            </div>
            <button onContextMenu={(e) => e.preventDefault()} onClick={() => setGameState(gameState === 'PLAYING' ? 'PAUSED' : 'PLAYING')} style={{ background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer' }}>
              {gameState === 'PAUSED' ? '▶️' : '⏸️'}
            </button>
          </div>
        </div>

        {/* 3D Canvas (FOV increased for better portrait viewing) */}
        <Canvas camera={{ fov: 65 }}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[20, 35, 10]} intensity={1.4} />
          <Sky sunPosition={[120, 15, -120]} turbidity={0.08} rayleigh={0.4} />
          <Track />
          <EnvironmentDecorations />
          <FinishLine />
          <Obstacles obstacles={obstacles} />
          <PlayerBike gameState={gameState} setGameState={setGameState} obstacles={obstacles} setScore={setScore} setSpeedKmh={setSpeedKmh} setProgress={setProgress} triggerFlash={triggerFlash} />
        </Canvas>

        {/* Countdown */}
        {gameState === 'COUNTDOWN' && (
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 12 }}>
            <h1 style={{ fontSize: '120px', color: '#f7b500', textShadow: '4px 4px 10px rgba(0,0,0,0.8)', margin: 0, fontStyle: 'italic' }}>{countdownSequence}</h1>
          </div>
        )}

        {/* Pause Menu */}
        {gameState === 'PAUSED' && (
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 30 }}>
            <h1 style={{ color: 'white', fontSize: '48px', margin: '0 0 20px 0', letterSpacing: '2px' }}>PAUSED</h1>
            <button
              onContextMenu={(e) => e.preventDefault()}
              onClick={() => { setGameState('PLAYING'); engineAudio.init(); }}
              style={{ padding: '15px 40px', fontSize: '24px', cursor: 'pointer', borderRadius: '8px', background: '#34c759', color: 'white', border: 'none', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}
            >
              ▶ RESUME
            </button>
          </div>
        )}

        {/* Mobile Controls Layer */}
        {gameState !== 'FINISHED' && (
          <div style={{ position: 'absolute', bottom: '24px', left: 0, right: 0, display: 'flex', justifyContent: 'space-between', padding: '0 20px', pointerEvents: 'none', zIndex: 15 }}>
            {/* Steering (Left Side) */}
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

            {/* Pedals (Right Side) */}
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

        {/* Finished / Rewards Screen */}
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
                    const res = await fetch('https://bajaj-racing-game.onrender.com//api/races', {
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