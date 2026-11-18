import * as THREE from 'three';
import { trackCurve } from './trackPath';

export const MEGA_RAMP_T_LOCATIONS = [0.08, 0.22, 0.38, 0.58, 0.68, 0.75, 0.84, 0.94];

// Pre-calculated 3D positions and orientations for Roblox Stunt Mega Ramps
export const STATIC_MEGA_RAMPS = MEGA_RAMP_T_LOCATIONS.map((t, idx) => {
  const p = trackCurve.getPointAt(t);
  const tg = trackCurve.getTangentAt(t);
  const norm = new THREE.Vector3(-tg.z, 0, tg.x).normalize();
  const offset = idx % 2 === 0 ? 3.2 : -3.2; // Alternate center-left and center-right lanes
  const rotY = Math.atan2(tg.x, tg.z);

  const rampPos = new THREE.Vector3(
    p.x + norm.x * offset,
    p.y,
    p.z + norm.z * offset
  );

  // Floating neon ring placed 22 meters forward along the flight path, elevated +8.8m
  const ringT = (t + 0.007) % 1.0;
  const ringP = trackCurve.getPointAt(ringT);
  const ringNorm = new THREE.Vector3(-tg.z, 0, tg.x).normalize();
  const ringPos = new THREE.Vector3(
    ringP.x + ringNorm.x * offset,
    ringP.y + 8.8,
    ringP.z + ringNorm.z * offset
  );

  return {
    id: `ramp-${idx}`,
    t,
    x: rampPos.x,
    y: rampPos.y,
    z: rampPos.z,
    rotY,
    offset,
    ring: {
      id: `ring-${idx}`,
      x: ringPos.x,
      y: ringPos.y,
      z: ringPos.z,
      rotY,
      collected: false,
    },
  };
});

// Initial positions and configuration for animated Kathmandu Highway Traffic
export const INITIAL_TRAFFIC = [
  { id: 'bus-1', type: 'bus', lane: 3.5, t: 0.05, speed: 18, color: '#006b38' },
  { id: 'micro-1', type: 'micro', lane: -3.5, t: 0.12, speed: 22, color: '#f0f2f5' },
  { id: 'taxi-1', type: 'taxi', lane: -7.0, t: 0.18, speed: 24, color: '#d32f2f' },
  { id: 'bus-2', type: 'bus', lane: 7.0, t: 0.25, speed: 17, color: '#005a9c' },
  { id: 'micro-2', type: 'micro', lane: 3.5, t: 0.33, speed: 23, color: '#ffffff' },
  { id: 'taxi-2', type: 'taxi', lane: -3.5, t: 0.40, speed: 25, color: '#e6a817' },
  { id: 'bus-3', type: 'bus', lane: -7.0, t: 0.48, speed: 19, color: '#006b38' },
  { id: 'micro-3', type: 'micro', lane: 7.0, t: 0.55, speed: 22, color: '#ffffff' },
  { id: 'taxi-3', type: 'taxi', lane: 3.5, t: 0.63, speed: 24, color: '#d32f2f' },
  { id: 'bus-4', type: 'bus', lane: -3.5, t: 0.70, speed: 18, color: '#005a9c' },
  { id: 'micro-4', type: 'micro', lane: -7.0, t: 0.77, speed: 23, color: '#f0f2f5' },
  { id: 'taxi-4', type: 'taxi', lane: 7.0, t: 0.83, speed: 25, color: '#e6a817' },
  { id: 'bus-5', type: 'bus', lane: 3.5, t: 0.89, speed: 18, color: '#006b38' },
  { id: 'micro-5', type: 'micro', lane: -3.5, t: 0.95, speed: 22, color: '#ffffff' },
];
