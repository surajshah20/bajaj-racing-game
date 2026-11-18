import { Canvas } from '@react-three/fiber';
import { useMemo, useState, useEffect, useRef } from 'react';
import { inputState, engineAudio } from './utils/store';
import PlayerBike from './components/game/PlayerBike';
import NitroPads from './components/game/NitroPads';
import Collectibles from './components/game/Collectibles';
import MegaRamps from './components/game/MegaRamps';
import { STATIC_MEGA_RAMPS } from './utils/stuntConfig';
import TrafficVehicles from './components/game/TrafficVehicles';
import { EnvironmentDecorations, Track, FinishLine, Obstacles, Atmosphere } from './components/game/Environment';
import { RaceHUD } from './components/ui/RaceHUD';
import SpeedLines from './components/ui/SpeedLines';
import MainMenu from './components/ui/MainMenu';
import { trackCurve } from './utils/trackPath';
import { BAJAJ_BIKES } from './utils/bikeConfig';
import * as THREE from 'three';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://bajaj-racing-game.onrender.com';

function createRng(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const obsRng = createRng(42);
const STATIC_OBSTACLES = Array.from({ length: 45 }).map((_, i) => {
  const r = obsRng();
  const t = 0.05 + (i / 46) * 0.9 + (r - 0.5) * 0.015;
  const point = trackCurve.getPointAt(t % 1);
  const tangent = trackCurve.getTangentAt(t % 1);
  const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
  const lanes = [-6.5, -3.2, 0, 3.2, 6.5];
  const offset = lanes[Math.floor(r * lanes.length)];
  return {
    x: point.x + normal.x * offset,
    y: point.y,
    z: point.z + normal.z * offset,
    t,
    rotation: Math.atan2(tangent.x, tangent.z),
  };
});

const STATIC_NITRO_PADS = Array.from({ length: 22 }).map((_, i) => {
  const t = 0.04 + (i / 22) * 0.92;
  const point = trackCurve.getPointAt(t);
  const tangent = trackCurve.getTangentAt(t);
  const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
  const offset = i % 2 === 0 ? 3.5 : -3.5;
  return {
    x: point.x + normal.x * offset,
    y: point.y,
    z: point.z + normal.z * offset,
    rotation: Math.atan2(tangent.x, tangent.z),
  };
});

const STATIC_COLLECTIBLES = Array.from({ length: 60 }).map((_, i) => {
  const t = 0.03 + (i / 61) * 0.94;
  const point = trackCurve.getPointAt(t);
  const tangent = trackCurve.getTangentAt(t);
  const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
  const offset = Math.sin(i * 0.8) * 6.5;
  return {
    x: point.x + normal.x * offset,
    y: point.y,
    z: point.z + normal.z * offset,
    collected: false,
    rotation: Math.atan2(tangent.x, tangent.z),
  };
});

export default function App() {
  const [selectedBike, setSelectedBike] = useState(BAJAJ_BIKES[0]);
  const [gameState, setGameState] = useState('MENU');
  const [countdownSequence, setCountdownSequence] = useState('3');
  const [score, setScore] = useState(3500);
  const [coinsCollected, setCoinsCollected] = useState(0);
  const [speedKmh, setSpeedKmh] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isFlashing, setIsFlashing] = useState(false);
  const [showGhost, setShowGhost] = useState(true);
  const [voucherCode, setVoucherCode] = useState(null);
  const [cameraMode, setCameraMode] = useState(0); // 0: Chase, 1: Close, 2: Far
  const [raceTime, setRaceTime] = useState(0);
  const [nearMissActive, setNearMissActive] = useState(false);
  const [showTouchControls, setShowTouchControls] = useState(
    () => typeof window !== 'undefined' && (window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window)
  );

  // ROBLOX ARCADE STUNT SYSTEM STATE
  const [currentStunt, setCurrentStunt] = useState(null);
  const [comboMultiplier, setComboMultiplier] = useState(1);
  const [isAirborne, setIsAirborne] = useState(false);
  const [isNitro, setIsNitro] = useState(false);
  const [finalStuntStats, setFinalStuntStats] = useState({
    topSpeedKmh: 0,
    airtimeTotal: 0,
    longestWheelie: 0,
    ringsCollected: 0,
    nearMissCount: 0,
  });

  const stuntStatsRef = useRef({
    topSpeedKmh: 0,
    airtimeTotal: 0,
    longestWheelie: 0,
    ringsCollected: 0,
    nearMissCount: 0,
  });

  const stuntTimeoutRef = useRef(null);
  const comboResetTimeoutRef = useRef(null);
  const trafficRef = useRef([]);

  const handleStunt = (stunt) => {
    setCurrentStunt(stunt);
    setComboMultiplier((prev) => Math.min(5, prev + 1));

    if (stuntTimeoutRef.current) clearTimeout(stuntTimeoutRef.current);
    if (comboResetTimeoutRef.current) clearTimeout(comboResetTimeoutRef.current);

    stuntTimeoutRef.current = setTimeout(() => {
      setCurrentStunt(null);
    }, 1800);

    comboResetTimeoutRef.current = setTimeout(() => {
      setComboMultiplier(1);
    }, 4000);
  };

  const triggerNearMiss = () => {
    setNearMissActive(true);
    setTimeout(() => setNearMissActive(false), 900);
  };

  // Shared with <Atmosphere> so the sun's shadow tracks the bike
  const bikeRef = useRef();
  const shadowSize = window.matchMedia('(pointer: coarse)').matches ? 1024 : 2048;

  const obstacles = STATIC_OBSTACLES;
  const nitroPads = STATIC_NITRO_PADS;
  const collectibles = useMemo(() => STATIC_COLLECTIBLES.map((c) => ({ ...c })), []);
  const megaRamps = useMemo(
    () => STATIC_MEGA_RAMPS.map((r) => ({ ...r, ring: { ...r.ring } })),
    []
  );

  // Live stopwatch during PLAYING
  useEffect(() => {
    let interval;
    if (gameState === 'PLAYING') {
      const start = performance.now();
      interval = setInterval(() => {
        setRaceTime((performance.now() - start) / 1000);
      }, 50);
    }
    return () => clearInterval(interval);
  }, [gameState]);

  // Capture final stunt stats snapshot on finish
  useEffect(() => {
    if (gameState === 'FINISHED') {
      const stats = stuntStatsRef.current;
      setFinalStuntStats({
        topSpeedKmh: stats.topSpeedKmh,
        airtimeTotal: stats.airtimeTotal,
        longestWheelie: stats.longestWheelie,
        ringsCollected: stats.ringsCollected,
        nearMissCount: stats.nearMissCount,
      });
    }
  }, [gameState]);

  useEffect(() => {
    let timer;
    if (gameState === 'COUNTDOWN') {
      const sequence = ['3', '2', '1', 'GO!'];
      let step = 0;
      timer = setInterval(() => {
        step++;
        if (step < sequence.length) {
          setCountdownSequence(sequence[step]);
        } else {
          setGameState('PLAYING');
          setTimeout(() => setShowGhost(false), 4000);
          clearInterval(timer);
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameState]);

  // KEYBOARD CONTROLS (WASD / Arrows + Space/Shift for Wheelie + H for Horn + C for Camera)
  useEffect(() => {
    const down = (e) => {
      if (e.key === 'c' || e.key === 'C') {
        setCameraMode((prev) => (prev + 1) % 3);
      }
      if (gameState !== 'PLAYING') return;

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === '1') inputState.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === '3') inputState.right = true;
      if (e.key === 'ArrowUp' || e.key === 'w') inputState.gas = true;
      if (e.key === 'ArrowDown' || e.key === 's') inputState.brake = true;
      if (e.key === ' ' || e.key === 'Shift') inputState.wheelie = true;
      if (e.key === 'h' || e.key === 'H') inputState.horn = true;
    };

    const up = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === '1') inputState.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === '3') inputState.right = false;
      if (e.key === 'ArrowUp' || e.key === 'w') inputState.gas = false;
      if (e.key === 'ArrowDown' || e.key === 's') inputState.brake = false;
      if (e.key === ' ' || e.key === 'Shift') inputState.wheelie = false;
      if (e.key === 'h' || e.key === 'H') inputState.horn = false;
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

  const hapticTap = () => {
    if (navigator.vibrate) navigator.vibrate(15);
  };

  const getRewardTier = (finalScore) => {
    if (finalScore >= 10000) return 'Premium Merchandise';
    if (finalScore >= 7000) return '20% Service Voucher';
    if (finalScore >= 4000) return 'Bajaj Keyring';
    return 'Participation Badge';
  };

  return (
    <>
      <div
        id="game-container"
        style={{
          width: '100vw',
          height: '100vh',
          margin: 0,
          padding: 0,
          overflow: 'hidden',
          position: 'relative',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          background: '#0a0d12',
        }}
      >
        {/* Red Collision Flash Overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'red',
            opacity: isFlashing ? 0.4 : 0,
            pointerEvents: 'none',
            zIndex: 14,
            transition: 'opacity 0.1s',
          }}
        />

        {/* Speed Vignette Overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 6,
            background: 'radial-gradient(circle, transparent 40%, rgba(0,0,0,0.45) 100%)',
            opacity: Math.min(1, speedKmh / 140),
            transition: 'opacity 0.15s',
          }}
        />

        {/* HIGH-OCTANE ANIME RADIAL SPEED LINES */}
        {gameState === 'PLAYING' && (
          <SpeedLines speedKmh={speedKmh} isNitro={isNitro} isAirborne={isAirborne} />
        )}

        {/* PREMIUM MAIN MENU & 3D GARAGE SHOWROOM */}
        {gameState === 'MENU' && (
          <MainMenu
            selectedBike={selectedBike}
            setSelectedBike={setSelectedBike}
            onStartRace={() => setGameState('COUNTDOWN')}
          />
        )}

        {/* IN-GAME RACE HUD (Circuit minimap, sector alerts, tachometer, stunt combo feed) */}
        {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
          <RaceHUD
            progress={progress}
            speedKmh={speedKmh}
            score={score}
            coinsCollected={coinsCollected}
            raceTime={raceTime}
            nearMissActive={nearMissActive}
            cameraMode={cameraMode}
            setCameraMode={setCameraMode}
            gameState={gameState}
            setGameState={setGameState}
            showTouchControls={showTouchControls}
            setShowTouchControls={setShowTouchControls}
            currentStunt={currentStunt}
            comboMultiplier={comboMultiplier}
          />
        )}

        {/* 3D Canvas */}
        <Canvas shadows={{ type: THREE.PCFShadowMap }} dpr={[1, 1.75]} camera={{ fov: 56, near: 0.1, far: 4500 }}>
          <Atmosphere followRef={bikeRef} shadowSize={shadowSize} />

          <Track />
          <EnvironmentDecorations />
          <FinishLine />
          <Obstacles obstacles={obstacles} />
          <NitroPads pads={nitroPads} />
          <Collectibles items={collectibles} />
          <MegaRamps ramps={megaRamps} />
          <TrafficVehicles trafficRef={trafficRef} />

          <PlayerBike
            bikeRef={bikeRef}
            selectedBike={selectedBike}
            gameState={gameState}
            setGameState={setGameState}
            obstacles={obstacles}
            nitroPads={nitroPads}
            collectibles={collectibles}
            megaRamps={megaRamps}
            trafficRef={trafficRef}
            onCollectCoin={() => setCoinsCollected((c) => c + 1)}
            onNearMiss={triggerNearMiss}
            onStunt={handleStunt}
            cameraMode={cameraMode}
            setScore={setScore}
            setSpeedKmh={setSpeedKmh}
            setProgress={setProgress}
            triggerFlash={triggerFlash}
            stuntStatsRef={stuntStatsRef}
            setIsAirborneState={setIsAirborne}
            setIsNitroState={setIsNitro}
          />
        </Canvas>

        {/* COUNTDOWN OVERLAY */}
        {gameState === 'COUNTDOWN' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 20,
              background: 'rgba(0,0,0,0.4)',
            }}
          >
            <h1
              style={{
                fontSize: '130px',
                color: '#f7b500',
                textShadow: '0 8px 30px rgba(0,0,0,0.9)',
                margin: 0,
                fontStyle: 'italic',
                fontWeight: '900',
              }}
            >
              {countdownSequence}
            </h1>
            <div style={{ fontSize: '18px', color: '#ffffff', letterSpacing: '3px', textTransform: 'uppercase' }}>
              कोटेश्वर Start Line
            </div>
          </div>
        )}

        {/* PAUSE MENU OVERLAY */}
        {gameState === 'PAUSED' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.85)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 30,
            }}
          >
            <h1 style={{ color: 'white', fontSize: '44px', margin: '0 0 20px 0', letterSpacing: '2px' }}>PAUSED</h1>
            <button
              onClick={() => {
                setGameState('PLAYING');
                if (engineAudio.ctx) engineAudio.ctx.resume();
              }}
              style={{
                padding: '14px 44px',
                fontSize: '22px',
                cursor: 'pointer',
                borderRadius: '8px',
                background: '#34c759',
                color: 'white',
                border: 'none',
                fontWeight: 'bold',
                boxShadow: '0 4px 15px rgba(52,199,89,0.4)',
              }}
            >
              ▶ RESUME
            </button>
          </div>
        )}

        {/* MOBILE ON-SCREEN CONTROLS (Steering, Horn, Wheelie, Brake, Gas) */}
        {(gameState === 'PLAYING' || gameState === 'COUNTDOWN') && showTouchControls && (
          <div
            style={{
              position: 'absolute',
              bottom: '24px',
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'space-between',
              padding: '0 24px',
              pointerEvents: 'none',
              zIndex: 15,
            }}
          >
            {/* Steering Controls & Musical Horn (Left) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', pointerEvents: 'auto' }}>
              {/* Horn Button */}
              <button
                onPointerDown={() => {
                  hapticTap();
                  inputState.horn = true;
                }}
                onPointerUp={() => (inputState.horn = false)}
                onPointerLeave={() => (inputState.horn = false)}
                className="control-btn"
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'rgba(247, 181, 0, 0.85)',
                  backdropFilter: 'blur(8px)',
                  border: '2px solid rgba(255, 255, 255, 0.4)',
                  color: '#1a1c23',
                  fontSize: '22px',
                  boxShadow: '0 4px 15px rgba(247,181,0,0.5)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Nepali Highway Horn"
              >
                📢
              </button>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onPointerDown={() => {
                    hapticTap();
                    inputState.left = true;
                  }}
                  onPointerUp={() => (inputState.left = false)}
                  onPointerLeave={() => (inputState.left = false)}
                  className={showGhost ? 'ghost-pulse control-btn' : 'control-btn'}
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.22)',
                    backdropFilter: 'blur(8px)',
                    border: '1.5px solid rgba(255, 255, 255, 0.4)',
                    color: '#ffffff',
                    fontSize: '22px',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
                    cursor: 'pointer',
                  }}
                >
                  ◀
                </button>
                <button
                  onPointerDown={() => {
                    hapticTap();
                    inputState.right = true;
                  }}
                  onPointerUp={() => (inputState.right = false)}
                  onPointerLeave={() => (inputState.right = false)}
                  className={showGhost ? 'ghost-pulse control-btn' : 'control-btn'}
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.22)',
                    backdropFilter: 'blur(8px)',
                    border: '1.5px solid rgba(255, 255, 255, 0.4)',
                    color: '#ffffff',
                    fontSize: '22px',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.4)',
                    cursor: 'pointer',
                  }}
                >
                  ▶
                </button>
              </div>
            </div>

            {/* Pedals: Brake, Gas & Wheelie (Right) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end', pointerEvents: 'auto' }}>
              {/* Wheelie Button */}
              <button
                onPointerDown={() => {
                  hapticTap();
                  inputState.wheelie = true;
                }}
                onPointerUp={() => (inputState.wheelie = false)}
                onPointerLeave={() => (inputState.wheelie = false)}
                className="control-btn"
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #ff007f 0%, #7928ca 100%)',
                  backdropFilter: 'blur(8px)',
                  border: '2px solid rgba(255, 255, 255, 0.4)',
                  color: 'white',
                  fontWeight: '900',
                  fontSize: '11px',
                  letterSpacing: '1px',
                  boxShadow: '0 4px 20px rgba(255, 0, 127, 0.6)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                }}
                title="Pop a Wheelie!"
              >
                <span style={{ fontSize: '16px' }}>🚀</span>
                <span>WHEEL</span>
              </button>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                <button
                  onPointerDown={() => {
                    hapticTap();
                    inputState.brake = true;
                  }}
                  onPointerUp={() => (inputState.brake = false)}
                  onPointerLeave={() => (inputState.brake = false)}
                  className="control-btn"
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'rgba(255, 59, 48, 0.82)',
                    backdropFilter: 'blur(8px)',
                    border: '2px solid rgba(255, 255, 255, 0.35)',
                    color: 'white',
                    fontWeight: '900',
                    fontSize: '13px',
                    letterSpacing: '1px',
                    boxShadow: '0 4px 18px rgba(255, 59, 48, 0.5)',
                    cursor: 'pointer',
                  }}
                >
                  BRK
                </button>

                <button
                  onPointerDown={() => {
                    hapticTap();
                    inputState.gas = true;
                  }}
                  onPointerUp={() => (inputState.gas = false)}
                  onPointerLeave={() => (inputState.gas = false)}
                  className={showGhost ? 'ghost-pulse control-btn' : 'control-btn'}
                  style={{
                    width: '78px',
                    height: '78px',
                    borderRadius: '50%',
                    background: 'rgba(52, 199, 89, 0.88)',
                    backdropFilter: 'blur(8px)',
                    border: '2px solid rgba(255, 255, 255, 0.45)',
                    color: 'white',
                    fontWeight: '900',
                    fontSize: '15px',
                    letterSpacing: '1px',
                    boxShadow: '0 6px 22px rgba(52, 199, 89, 0.55)',
                    cursor: 'pointer',
                  }}
                >
                  GAS
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FINISH SCREEN LAYER (With Full Roblox Stunt Recap) */}
        {gameState === 'FINISHED' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(5,8,14,0.95)',
              color: 'white',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 35,
              padding: '20px',
              overflowY: 'auto',
            }}
          >
            <h1
              style={{
                fontSize: '44px',
                margin: '0 0 4px 0',
                color: '#e31c25',
                fontStyle: 'italic',
                fontWeight: '900',
                textShadow: '0 4px 20px rgba(227,28,37,0.4)',
              }}
            >
              FINISH LINE! 🏁
            </h1>
            <p style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#ccc' }}>
              Kathmandu Ring Road Completed
            </p>

            {/* Score & Coins Summary */}
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center', margin: '8px 0' }}>
              <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.06)', padding: '8px 18px', borderRadius: '10px' }}>
                <span style={{ fontSize: '10px', color: '#aaa', display: 'block', textTransform: 'uppercase' }}>FINAL SCORE</span>
                <span style={{ fontSize: '32px', color: '#f7b500', fontWeight: '900' }}>{score}</span>
              </div>
              <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.06)', padding: '8px 18px', borderRadius: '10px' }}>
                <span style={{ fontSize: '10px', color: '#aaa', display: 'block', textTransform: 'uppercase' }}>COINS</span>
                <span style={{ fontSize: '32px', color: '#00e5ff', fontWeight: '900' }}>{coinsCollected} 🪙</span>
              </div>
              <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.06)', padding: '8px 18px', borderRadius: '10px' }}>
                <span style={{ fontSize: '10px', color: '#aaa', display: 'block', textTransform: 'uppercase' }}>TIME</span>
                <span style={{ fontSize: '22px', color: '#ffffff', fontFamily: 'monospace', fontWeight: 'bold' }}>
                  {Math.floor(raceTime / 60)}:{(raceTime % 60).toFixed(1)}s
                </span>
              </div>
            </div>

            {/* ROBLOX STUNT STATS RECAP GRID */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '8px',
                background: 'rgba(15, 20, 28, 0.85)',
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                margin: '10px 0 16px 0',
                maxWidth: '480px',
                width: '90%',
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '18px', display: 'block' }}>🚀</span>
                <span style={{ fontSize: '9px', color: '#aaa', display: 'block' }}>TOP SPEED</span>
                <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#ff5500' }}>
                  {finalStuntStats.topSpeedKmh} KM/H
                </span>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '18px', display: 'block' }}>🦅</span>
                <span style={{ fontSize: '9px', color: '#aaa', display: 'block' }}>AIRTIME</span>
                <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#00e5ff' }}>
                  {finalStuntStats.airtimeTotal.toFixed(1)}s
                </span>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '18px', display: 'block' }}>🔥</span>
                <span style={{ fontSize: '9px', color: '#aaa', display: 'block' }}>WHEELIE</span>
                <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#ff007f' }}>
                  {finalStuntStats.longestWheelie.toFixed(1)}s
                </span>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '18px', display: 'block' }}>🎯</span>
                <span style={{ fontSize: '9px', color: '#aaa', display: 'block' }}>RINGS</span>
                <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#f7b500' }}>
                  {finalStuntStats.ringsCollected} / 8
                </span>
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#1b1e24',
                border: '2px solid #333',
                borderRadius: '12px',
                padding: '12px 24px',
                textAlign: 'center',
                marginBottom: '18px',
                width: '85%',
                maxWidth: '360px',
              }}
            >
              <p style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Reward Unlocked
              </p>
              <h3 style={{ margin: 0, color: '#fff', fontSize: '18px', fontWeight: 'bold' }}>
                {getRewardTier(score)}
              </h3>
            </div>

            {!voucherCode ? (
              <button
                onClick={async () => {
                  try {
                    const res = await fetch(`${API_BASE_URL}/api/races`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ score, speedKmh, coinsCollected }),
                    });
                    const data = await res.json();
                    setVoucherCode(data.voucherCode);
                  } catch (err) {
                    console.error('Failed to claim voucher', err);
                  }
                }}
                style={{
                  padding: '14px 40px',
                  fontSize: '18px',
                  cursor: 'pointer',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #e31c25 0%, #b8141c 100%)',
                  color: 'white',
                  border: 'none',
                  fontWeight: 'bold',
                  marginBottom: '12px',
                  boxShadow: '0 4px 18px rgba(227,28,37,0.5)',
                }}
              >
                Claim Voucher
              </button>
            ) : (
              <div
                style={{
                  backgroundColor: '#fff',
                  color: '#000',
                  padding: '12px 25px',
                  borderRadius: '10px',
                  marginBottom: '12px',
                  textAlign: 'center',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                }}
              >
                <p style={{ margin: '0 0 4px 0', fontSize: '11px', fontWeight: 'bold', color: '#666' }}>Your Voucher Code:</p>
                <h2 style={{ margin: 0, color: '#e31c25', letterSpacing: '2px', fontSize: '26px' }}>{voucherCode}</h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#888' }}>Take a screenshot to redeem at Bajaj Nepal!</p>
              </div>
            )}

            <button
              onClick={() => window.location.reload()}
              style={{
                background: 'none',
                border: 'none',
                color: '#aaa',
                textDecoration: 'underline',
                fontSize: '14px',
                cursor: 'pointer',
                marginTop: '4px',
              }}
            >
              Race Again
            </button>
          </div>
        )}
      </div>
    </>
  );
}
