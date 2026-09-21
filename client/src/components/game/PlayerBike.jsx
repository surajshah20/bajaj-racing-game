import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { inputState, engineAudio } from '../../utils/store';
import { trackCurve, TRACK_LENGTH } from '../../utils/trackPath';

export default function PlayerBike({ gameState, setGameState, obstacles, nitroPads, setScore, setSpeedKmh, setProgress, triggerFlash }) {
  const bikeRef = useRef();
  const hitObstacles = useRef(new Set());
  const hitNitros = useRef(new Set());
  const velocity = useRef(0);
  const currentLean = useRef(0);
  const nitroBoostTime = useRef(0);
  const trackProgress = useRef(0); // 0.0 to 1.0 (One full lap)
  const lateralOffset = useRef(0); // -6 (left) to +6 (right)
  const { scene } = useGLTF('/bike.glb');

  useFrame((state, delta) => {
    if (!bikeRef.current || gameState !== 'PLAYING') {
      if (gameState === 'PAUSED' || gameState === 'COUNTDOWN' || gameState === 'MENU') engineAudio.updatePitch(0);
      return;
    }

    // Laps and Finish Logic
    if (trackProgress.current >= 1.0) {
      setGameState('FINISHED');
      engineAudio.stop();
      return;
    }

    if (nitroBoostTime.current > 0) nitroBoostTime.current -= delta;
    const isNitro = nitroBoostTime.current > 0;

    const maxSpeed = isNitro ? 85 : 55;
    const accel = isNitro ? 45 : 25;
    const drag = 12;
    const brakeForce = 45;

    if (inputState.gas) velocity.current = Math.min(maxSpeed, velocity.current + accel * delta);
    else if (inputState.brake) velocity.current = Math.max(0, velocity.current - brakeForce * delta);
    else velocity.current = Math.max(0, velocity.current - drag * delta);

    setSpeedKmh(Math.round(velocity.current * 2.2));
    engineAudio.updatePitch(velocity.current / maxSpeed);

    setProgress(Math.min(100, (trackProgress.current * 100)));

    // 1. Move forward along the curve
    const distanceToMove = velocity.current * delta;
    trackProgress.current += distanceToMove / TRACK_LENGTH;
    
    // Ensure we don't crash the curve function if we exceed 1.0
    const safeT = trackProgress.current % 1.0; 
    
    // 2. Get current curve data
    const pointOnCurve = trackCurve.getPointAt(safeT);
    const tangent = trackCurve.getTangentAt(safeT);
    
    // 3. Calculate steering (Left/Right offset relative to the curve)
    const turnRate = 12 * (velocity.current / maxSpeed) * delta;
    let targetLean = 0;

    if (velocity.current > 1) {
      if (inputState.left && lateralOffset.current > -6) {
        lateralOffset.current -= turnRate; targetLean = 0.4;
      } else if (inputState.right && lateralOffset.current < 6) {
        lateralOffset.current += turnRate; targetLean = -0.4;
      }
    }
    currentLean.current = THREE.MathUtils.lerp(currentLean.current, targetLean, 0.12);

    // 4. Apply curve position + lateral steering offset
    // The normal vector is perpendicular to the tangent (pointing left/right)
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    
    bikeRef.current.position.x = pointOnCurve.x + (normal.x * lateralOffset.current);
    bikeRef.current.position.z = pointOnCurve.z + (normal.z * lateralOffset.current);
    bikeRef.current.position.y = 0;

    // 5. Rotate bike to follow curve + apply lean
    // We create a dummy matrix to look along the tangent, then apply the lean
    const targetRotation = new THREE.Matrix4().lookAt(
      bikeRef.current.position, 
      new THREE.Vector3(bikeRef.current.position.x + tangent.x, 0, bikeRef.current.position.z + tangent.z), 
      new THREE.Vector3(0, 1, 0)
    );
    bikeRef.current.quaternion.setFromRotationMatrix(targetRotation);
    bikeRef.current.rotateZ(currentLean.current);

    // Collision logic (Simplified for distance)
    obstacles.forEach((obs, index) => {
      if (!hitObstacles.current.has(index)) {
        const dist = bikeRef.current.position.distanceTo(new THREE.Vector3(obs.x, 0, obs.z));
        if (dist < 1.8) {
          hitObstacles.current.add(index);
          velocity.current = Math.max(8, velocity.current * 0.4);
          setScore((prev) => Math.max(0, prev - 500));
          triggerFlash();
          if (navigator.vibrate) navigator.vibrate([200]);
        }
      }
    });

    nitroPads.forEach((pad, index) => {
      if (!hitNitros.current.has(index)) {
        const dist = bikeRef.current.position.distanceTo(new THREE.Vector3(pad.x, 0, pad.z));
        if (dist < 2.5) {
          hitNitros.current.add(index);
          nitroBoostTime.current = 3.0; 
          if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
        }
      }
    });

    // 6. Camera follows the curve slightly behind the bike
    const camDistance = 12 + (velocity.current / 55) * 3;
    const camOffsetT = Math.max(0, safeT - (camDistance / TRACK_LENGTH));
    const camPoint = trackCurve.getPointAt(camOffsetT);
    
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, camPoint.x + (normal.x * lateralOffset.current), 0.1);
    state.camera.position.y = 5;
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, camPoint.z + (normal.z * lateralOffset.current), 0.1);
    
    // Look at a point slightly ahead on the curve
    const lookAheadT = (safeT + (10 / TRACK_LENGTH)) % 1.0;
    const lookAheadPoint = trackCurve.getPointAt(lookAheadT);
    state.camera.lookAt(lookAheadPoint.x, 1.5, lookAheadPoint.z);
  });

  return (
    <mesh ref={bikeRef} position={[0, 0, 0]}>
      <primitive object={scene} scale={3.4} />
    </mesh>
  );
}