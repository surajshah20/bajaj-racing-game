import { useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { inputState, engineAudio } from '../../utils/store';
import { trackCurve, TRACK_LENGTH } from '../../utils/trackPath';
import { BAJAJ_BIKES } from '../../utils/bikeConfig';
import Rider from './Rider';
import ExhaustParticles from './ExhaustParticles';

export default function PlayerBike({
  bikeRef: externalRef,
  selectedBike = BAJAJ_BIKES[0],
  gameState,
  setGameState,
  obstacles,
  nitroPads,
  collectibles = [],
  onCollectCoin,
  onNearMiss,
  cameraMode = 0, // 0: Chase, 1: Close, 2: Far
  setScore,
  setSpeedKmh,
  setProgress,
  triggerFlash,
}) {
  const localRef = useRef();
  const bikeRef = externalRef ?? localRef;

  const hitObstacles = useRef(new Set());
  const nearMissedObstacles = useRef(new Set());
  const hitNitros = useRef(new Set());
  const collectedCoins = useRef(new Set());

  const velocity = useRef(0);
  const lateralVelocity = useRef(0);
  const currentLean = useRef(0);
  const currentPitch = useRef(0);
  const crashWobble = useRef(0);
  const nitroBoostTime = useRef(0);
  const trackProgress = useRef(0);
  const lateralOffset = useRef(0);
  const cameraInitialized = useRef(false);
  const camHeading = useRef(new THREE.Vector3(0, 0, 1));

  const brakeLightRef = useRef();

  const bikeStateRef = useRef({
    lean: 0,
    isAccelerating: false,
    isBraking: false,
    speedRatio: 0,
    isNitro: false,
  });

  const { scene } = useGLTF('/bike.glb');

  useLayoutEffect(() => {
    scene.traverse((child) => {
      if (!child.isMesh) return;
      child.castShadow = true;
      child.receiveShadow = true;
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      mats.forEach((m) => {
        if (m?.map) m.map.anisotropy = 8;
        if (m) m.needsUpdate = true;
      });
    });
  }, [scene]);

  useFrame((state, delta) => {
    if (!bikeRef.current) return;

    // 1. CINEMATIC SHOWROOM ORBIT CAMERA (when in MENU state)
    if (gameState === 'MENU') {
      const startPt = trackCurve.getPointAt(0);
      const angle = state.clock.elapsedTime * 0.4;
      const radius = 6.8;
      state.camera.position.set(
        startPt.x + Math.sin(angle) * radius,
        startPt.y + 2.0 + Math.sin(angle * 0.6) * 0.2,
        startPt.z + Math.cos(angle) * radius
      );
      state.camera.lookAt(startPt.x, 1.35, startPt.z);
      state.camera.fov = 48;
      state.camera.updateProjectionMatrix();

      // Reset bike on start line
      bikeRef.current.position.set(startPt.x, 0, startPt.z);
      const tg = trackCurve.getTangentAt(0);
      bikeRef.current.quaternion.setFromRotationMatrix(
        new THREE.Matrix4().lookAt(startPt, new THREE.Vector3().addVectors(startPt, tg), new THREE.Vector3(0, 1, 0))
      );
      engineAudio.updatePitch(0, false, false);
      return;
    }

    if (gameState !== 'PLAYING') {
      if (gameState === 'PAUSED' || gameState === 'COUNTDOWN') {
        engineAudio.updatePitch(0, false, false);
      }
      return;
    }

    if (trackProgress.current >= 1.0) {
      setGameState('FINISHED');
      engineAudio.stop();
      return;
    }

    // 2. NITRO & TOP SPEED CONFIGURATION
    if (nitroBoostTime.current > 0) nitroBoostTime.current -= delta;
    const isNitro = nitroBoostTime.current > 0;

    const baseTopSpeed = selectedBike.topSpeed || 48;
    const maxSpeed = isNitro ? (selectedBike.nitroTopSpeed || 68) : baseTopSpeed;
    const baseAccel = isNitro ? 66 : (selectedBike.accel || 38);

    // Dynamic torque curve: powerful low-end acceleration, aerodynamic drag near top speed
    const currentSpeed = velocity.current;
    const speedRatio = Math.min(1.0, currentSpeed / maxSpeed);

    if (inputState.gas) {
      const torque = baseAccel * Math.max(0.25, 1.0 - Math.pow(speedRatio, 1.6) * 0.82);
      velocity.current = Math.min(maxSpeed, currentSpeed + torque * delta);
    } else if (inputState.brake) {
      velocity.current = Math.max(0, currentSpeed - 54 * delta);
    } else {
      const rollingDrag = 8.5 + currentSpeed * 0.08;
      velocity.current = Math.max(0, currentSpeed - rollingDrag * delta);
    }

    setSpeedKmh(Math.round(velocity.current * 2.35));
    engineAudio.updatePitch(speedRatio, inputState.gas, inputState.brake);
    setProgress(Math.min(100, trackProgress.current * 100));

    // Distance progression along Ring Road spline
    const distanceToMove = velocity.current * delta;
    trackProgress.current += distanceToMove / TRACK_LENGTH;

    const safeT = trackProgress.current % 1.0;
    const pointOnCurve = trackCurve.getPointAt(safeT);
    const tangent = trackCurve.getTangentAt(safeT);
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

    // 3. REALISTIC INERTIAL STEERING & GYROSCOPIC STABILITY
    let steerInput = 0;
    if (inputState.left) steerInput -= 1;
    if (inputState.right) steerInput += 1;

    // Agility factor from selected bike (e.g. Pulsar NS200 turns faster)
    const agilityMultiplier = (selectedBike.handling || 88) / 88;
    const steerForce = (38 * agilityMultiplier) * Math.max(0.3, 1.0 - speedRatio * 0.35);
    const lateralDrag = 8.0;

    lateralVelocity.current += (steerInput * steerForce - lateralVelocity.current * lateralDrag) * delta;
    lateralOffset.current += lateralVelocity.current * delta;
    lateralOffset.current = THREE.MathUtils.clamp(lateralOffset.current, -8.2, 8.2);

    // 4. REAL MOTORCYCLE LEAN (ROLL) - LEANS INTO TURN
    // When steering RIGHT (lateralVelocity > 0), the bike rolls RIGHT into the turn
    const maxLean = 0.52; // ~30 degrees
    const targetLean = (lateralVelocity.current / 7.5) * maxLean;
    currentLean.current = THREE.MathUtils.lerp(currentLean.current, targetLean, delta * 14);

    // Crash wobble damping
    crashWobble.current = THREE.MathUtils.lerp(crashWobble.current, 0, delta * 8);

    // Suspension pitch: fork compression (dive) under brake, rear squat under gas
    let targetPitch = 0;
    if (inputState.brake && currentSpeed > 4) targetPitch = -0.065;
    else if (inputState.gas && speedRatio < 0.85) targetPitch = 0.038;
    currentPitch.current = THREE.MathUtils.lerp(currentPitch.current, targetPitch, delta * 8);

    // 5. TRUE HEADING VECTOR (YAW)
    // When changing lanes diagonally, the bike points in its true direction of travel!
    const headingVector = new THREE.Vector3()
      .copy(tangent)
      .multiplyScalar(Math.max(2.0, velocity.current))
      .addScaledVector(normal, lateralVelocity.current * 0.9)
      .normalize();

    // Position bike on 3D road surface with elevation
    bikeRef.current.position.x = pointOnCurve.x + normal.x * lateralOffset.current;
    bikeRef.current.position.y = pointOnCurve.y;
    bikeRef.current.position.z = pointOnCurve.z + normal.z * lateralOffset.current;

    // Apply rotation from true heading vector
    const rotMatrix = new THREE.Matrix4().lookAt(
      bikeRef.current.position,
      new THREE.Vector3().addVectors(bikeRef.current.position, headingVector),
      new THREE.Vector3(0, 1, 0)
    );
    bikeRef.current.quaternion.setFromRotationMatrix(rotMatrix);

    // Apply roll lean & crash bounce
    const wobbleZ = Math.sin(state.clock.elapsedTime * 36) * crashWobble.current;
    const wobbleX = Math.cos(state.clock.elapsedTime * 26) * crashWobble.current * 0.35;
    bikeRef.current.rotateZ(currentLean.current + wobbleZ);
    bikeRef.current.rotateX(currentPitch.current + wobbleX);

    // LED Taillight activation
    if (brakeLightRef.current) {
      brakeLightRef.current.material.emissiveIntensity = inputState.brake ? 6.5 : 0.8;
    }

    // 6. OBSTACLE COLLISIONS & SLALOM NEAR-MISS
    obstacles.forEach((obs, index) => {
      if (!hitObstacles.current.has(index) && !nearMissedObstacles.current.has(index)) {
        const dist = bikeRef.current.position.distanceTo(new THREE.Vector3(obs.x, obs.y || 0, obs.z));
        if (dist < 1.9) {
          hitObstacles.current.add(index);
          velocity.current = Math.max(8, velocity.current * 0.36);
          setScore((prev) => Math.max(0, prev - 500));
          crashWobble.current = 0.35;
          engineAudio.playCrash();
          triggerFlash();
          if (navigator.vibrate) navigator.vibrate([240]);
        } else if (dist <= 3.3 && velocity.current > 14) {
          nearMissedObstacles.current.add(index);
          setScore((prev) => prev + 150);
          engineAudio.playNearMiss();
          if (onNearMiss) onNearMiss();
          if (navigator.vibrate) navigator.vibrate(25);
        }
      }
    });

    // Nitro boost pickups
    nitroPads.forEach((pad, index) => {
      if (!hitNitros.current.has(index)) {
        const dist = bikeRef.current.position.distanceTo(new THREE.Vector3(pad.x, pad.y || 0, pad.z));
        if (dist < 2.8) {
          hitNitros.current.add(index);
          nitroBoostTime.current = 3.2;
          engineAudio.playNitro();
          if (navigator.vibrate) navigator.vibrate([60, 40, 80]);
        }
      }
    });

    // Dashain coins
    collectibles.forEach((item, index) => {
      if (!collectedCoins.current.has(index) && !item.collected) {
        const dist = bikeRef.current.position.distanceTo(new THREE.Vector3(item.x, (item.y || 0) + 0.6, item.z));
        if (dist < 2.4) {
          collectedCoins.current.add(index);
          item.collected = true;
          setScore((prev) => prev + 250);
          engineAudio.playCoin();
          if (onCollectCoin) onCollectCoin(item);
          if (navigator.vibrate) navigator.vibrate(30);
        }
      }
    });

    // Update child state ref
    bikeStateRef.current.lean = currentLean.current;
    bikeStateRef.current.isAccelerating = inputState.gas;
    bikeStateRef.current.isBraking = inputState.brake;
    bikeStateRef.current.speedRatio = speedRatio;
    bikeStateRef.current.isNitro = isNitro;

    // 7. BUTTERY-SMOOTH ARCADE CHASE CAMERA (NO JITTER / ZERO LAG)
    const bikePos = bikeRef.current.position;

    if (!cameraInitialized.current) {
      camHeading.current.copy(headingVector);
      state.camera.position.set(
        bikePos.x - headingVector.x * 6.2,
        bikePos.y + 3.2,
        bikePos.z - headingVector.z * 6.2
      );
      state.camera.lookAt(bikePos.x + headingVector.x * 24.0, bikePos.y + 1.2, bikePos.z + headingVector.z * 24.0);
      cameraInitialized.current = true;
    }

    // Smooth camera angular heading (NOT forward distance!)
    // This completely eliminates high-speed camera oscillation and stutter!
    const headingSmoothFactor = Math.min(1.0, delta * 10);
    camHeading.current.lerp(headingVector, headingSmoothFactor).normalize();

    let followDist = 6.2 + speedRatio * 0.8;
    let camHeight = 3.2 + speedRatio * 0.3;
    let lookAhead = 24.0;
    let baseFov = 58;

    if (cameraMode === 1) {
      // MODE 1: CLOSE ACTION CHASE (Tighter behind rider)
      followDist = 4.6 + speedRatio * 0.4;
      camHeight = 2.4 + speedRatio * 0.2;
      lookAhead = 20.0;
      baseFov = 64;
    } else if (cameraMode === 2) {
      // MODE 2: FAR BROADCAST CHASE (Elevated tactical view)
      followDist = 9.8 + speedRatio * 1.0;
      camHeight = 5.0 + speedRatio * 0.4;
      lookAhead = 28.0;
      baseFov = 54;
    }

    // Anchor camera directly to bike position with smoothed directional heading
    state.camera.position.set(
      bikePos.x - camHeading.current.x * followDist,
      bikePos.y + camHeight,
      bikePos.z - camHeading.current.z * followDist
    );

    const lookTarget = new THREE.Vector3(
      bikePos.x + headingVector.x * lookAhead,
      bikePos.y + 1.2,
      bikePos.z + headingVector.z * lookAhead
    );

    state.camera.lookAt(lookTarget);
    state.camera.rotateZ(currentLean.current * 0.14);

    // Dynamic FOV rush during high speed / nitro boost
    const targetFov = baseFov + speedRatio * (isNitro ? 16 : 8);
    state.camera.fov = THREE.MathUtils.lerp(state.camera.fov, targetFov, delta * 6);
    state.camera.updateProjectionMatrix();
  });

  return (
    <group ref={bikeRef} position={[0, 0, 0]}>
      {/* 3D Bajaj Motorcycle */}
      <primitive object={scene} scale={2.0} rotation={[0, Math.PI, 0]} />

      {/* 3D Stylized Rider Character in matching Bajaj gear */}
      <Rider
        bikeStateRef={bikeStateRef}
        accentColor={selectedBike.color}
        scale={2.0}
        position={[0, 1.64, 0.36]}
        rotation={[0, Math.PI, 0]}
      />

      {/* Dynamic Exhaust Smoke & Nitro Flame Particle Trail */}
      <ExhaustParticles bikeRef={bikeRef} bikeStateRef={bikeStateRef} />

      {/* Working Red LED Taillight */}
      <mesh ref={brakeLightRef} position={[0, 1.55, 1.75]}>
        <boxGeometry args={[0.32, 0.10, 0.08]} />
        <meshStandardMaterial
          color="#ff0000"
          emissive="#ff1111"
          emissiveIntensity={0.8}
          roughness={0.2}
        />
      </mesh>
    </group>
  );
}

useGLTF.preload('/bike.glb');
