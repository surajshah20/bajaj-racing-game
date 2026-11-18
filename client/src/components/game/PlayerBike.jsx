import { useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { inputState, engineAudio } from '../../utils/store';
import { trackCurve, TRACK_LENGTH } from '../../utils/trackPath';
import { BAJAJ_BIKES } from '../../utils/bikeConfig';
import Rider from './Rider';
import ExhaustParticles from './ExhaustParticles';
import BikeVFX from './BikeVFX';

export default function PlayerBike({
  bikeRef: externalRef,
  selectedBike = BAJAJ_BIKES[0],
  gameState,
  setGameState,
  obstacles = [],
  nitroPads = [],
  collectibles = [],
  megaRamps = [],
  trafficRef,
  onCollectCoin,
  onNearMiss,
  onStunt,
  cameraMode = 0, // 0: Chase, 1: Close, 2: Far
  setScore,
  setSpeedKmh,
  setProgress,
  triggerFlash,
  stuntStatsRef,
  setIsAirborneState,
  setIsNitroState,
}) {
  const localRef = useRef();
  const bikeRef = externalRef ?? localRef;

  const hitObstacles = useRef(new Set());
  const nearMissedObstacles = useRef(new Set());
  const nearMissedTraffic = useRef(new Set());
  const hitNitros = useRef(new Set());
  const hitRamps = useRef(new Set());
  const collectedCoins = useRef(new Set());
  const collectedRings = useRef(new Set());

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

  // 1. VERTICAL AIRTIME JUMP PHYSICS
  const verticalOffset = useRef(0);
  const verticalVelocity = useRef(0);
  const isAirborne = useRef(false);
  const airtimeTimer = useRef(0);

  // 2. WHEELIE & STOPPIE MECHANICS
  const wheeliePitch = useRef(0);
  const wheelieTimer = useRef(0);
  const isScrapingSparks = useRef(false);

  // 3. SLIPSTREAM DRAFTING
  const draftTimer = useRef(0);
  const isDrafting = useRef(false);

  // 4. CRASH TUMBLING
  const crashTimer = useRef(0);
  const isCrashing = useRef(false);

  // Horn debounce
  const hornCooldown = useRef(0);

  const brakeLightRef = useRef();

  const bikeStateRef = useRef({
    lean: 0,
    isAccelerating: false,
    isBraking: false,
    speedRatio: 0,
    isNitro: false,
    isAirborne: false,
    isWheelie: false,
    isScraping: false,
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

    // 1. SHOWROOM ORBIT CAMERA (when in MENU state)
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
      bikeRef.current.position.set(startPt.x, startPt.y, startPt.z);
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

    // 2. NITRO CONFIGURATION
    if (nitroBoostTime.current > 0) nitroBoostTime.current -= delta;
    const isNitro = nitroBoostTime.current > 0;
    if (setIsNitroState) setIsNitroState(isNitro);

    const baseTopSpeed = selectedBike.topSpeed || 48;
    const maxSpeed = isNitro ? (selectedBike.nitroTopSpeed || 72) : baseTopSpeed;
    const baseAccel = isNitro ? 72 : (selectedBike.accel || 38);

    const currentSpeed = velocity.current;
    const speedRatio = Math.min(1.0, currentSpeed / maxSpeed);

    // Track statistics for podium recap
    if (stuntStatsRef?.current) {
      const kmh = Math.round(currentSpeed * 2.35);
      if (kmh > stuntStatsRef.current.topSpeedKmh) {
        stuntStatsRef.current.topSpeedKmh = kmh;
      }
    }

    // CRASH HANDLING (Tumbling state)
    if (isCrashing.current) {
      crashTimer.current -= delta;
      velocity.current = Math.max(0, velocity.current - 45 * delta);
      crashWobble.current = 0.55;
      if (crashTimer.current <= 0) {
        isCrashing.current = false;
        lateralOffset.current = 0; // Return safely to center lane
      }
    } else {
      // THROTTLE & BRAKE DRIVING
      if (inputState.gas) {
        const torque = baseAccel * Math.max(0.25, 1.0 - Math.pow(speedRatio, 1.6) * 0.82);
        velocity.current = Math.min(maxSpeed, currentSpeed + torque * delta);
      } else if (inputState.brake) {
        velocity.current = Math.max(0, currentSpeed - 54 * delta);
        if (currentSpeed > 15) {
          engineAudio.playSkidScreech();
        }
      } else {
        const rollingDrag = 8.5 + currentSpeed * 0.08;
        velocity.current = Math.max(0, currentSpeed - rollingDrag * delta);
      }
    }

    setSpeedKmh(Math.round(velocity.current * 2.35));
    engineAudio.updatePitch(speedRatio, inputState.gas, inputState.brake);
    setProgress(Math.min(100, trackProgress.current * 100));

    // Spline progression
    const distanceToMove = velocity.current * delta;
    trackProgress.current += distanceToMove / TRACK_LENGTH;

    const safeT = trackProgress.current % 1.0;
    const pointOnCurve = trackCurve.getPointAt(safeT);
    const tangent = trackCurve.getTangentAt(safeT);
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

    // 3. STEERING & LATERAL INERTIA
    let steerInput = 0;
    if (inputState.left) steerInput -= 1;
    if (inputState.right) steerInput += 1;

    const agilityMultiplier = (selectedBike.handling || 88) / 88;
    const steerForce = (38 * agilityMultiplier) * Math.max(0.3, 1.0 - speedRatio * 0.35);
    const lateralDrag = 8.0;

    lateralVelocity.current += (steerInput * steerForce - lateralVelocity.current * lateralDrag) * delta;
    lateralOffset.current += lateralVelocity.current * delta;
    lateralOffset.current = THREE.MathUtils.clamp(lateralOffset.current, -8.2, 8.2);

    // 4. MOTORCYCLE ROLL (LEAN)
    const maxLean = 0.52; // ~30 degrees
    const targetLean = (lateralVelocity.current / 7.5) * maxLean;
    currentLean.current = THREE.MathUtils.lerp(currentLean.current, targetLean, delta * 14);

    // 5. WHEELIE MECHANIC (Space / Shift / Wheelie button)
    const isWheeliePressed = inputState.wheelie && velocity.current > 8 && !isAirborne.current && !isCrashing.current;
    if (isWheeliePressed) {
      wheeliePitch.current = THREE.MathUtils.lerp(wheeliePitch.current, 0.46, delta * 9);
      wheelieTimer.current += delta;
      isScrapingSparks.current = wheeliePitch.current > 0.41;

      // Continuous points reward for holding wheelie
      if (wheelieTimer.current > 0.4) {
        setScore((prev) => prev + Math.round(delta * 120));
      }

      if (stuntStatsRef?.current && wheelieTimer.current > stuntStatsRef.current.longestWheelie) {
        stuntStatsRef.current.longestWheelie = wheelieTimer.current;
      }
    } else {
      if (wheelieTimer.current > 1.0 && onStunt) {
        onStunt({
          type: 'wheelie',
          title: '🔥 SICK WHEELIE!',
          points: Math.round(wheelieTimer.current * 250),
        });
      }
      wheelieTimer.current = 0;
      wheeliePitch.current = THREE.MathUtils.lerp(wheeliePitch.current, 0, delta * 12);
      isScrapingSparks.current = false;
    }

    // 6. VERTICAL AIRTIME JUMP & GRAVITY PHYSICS
    if (isAirborne.current) {
      verticalVelocity.current -= 28.0 * delta; // Gravity
      verticalOffset.current += verticalVelocity.current * delta;
      airtimeTimer.current += delta;

      if (stuntStatsRef?.current) {
        stuntStatsRef.current.airtimeTotal += delta;
      }

      // Check mid-air floating Neon Rings collection
      megaRamps.forEach((ramp) => {
        if (!ramp.ring.collected && !collectedRings.current.has(ramp.ring.id)) {
          const ringPos = new THREE.Vector3(ramp.ring.x, ramp.ring.y, ramp.ring.z);
          const currentBikePos = new THREE.Vector3(
            pointOnCurve.x + normal.x * lateralOffset.current,
            pointOnCurve.y + verticalOffset.current,
            pointOnCurve.z + normal.z * lateralOffset.current
          );
          if (currentBikePos.distanceTo(ringPos) < 3.8) {
            ramp.ring.collected = true;
            collectedRings.current.add(ramp.ring.id);
            setScore((prev) => prev + 1000);
            engineAudio.playRingChime();
            if (stuntStatsRef?.current) stuntStatsRef.current.ringsCollected += 1;
            if (onStunt) {
              onStunt({
                type: 'ring',
                title: '🎯 NEON RING CLEARED!',
                points: 1000,
              });
            }
            if (navigator.vibrate) navigator.vibrate([60, 40, 80]);
          }
        }
      });

      // Landing check
      if (verticalOffset.current <= 0) {
        verticalOffset.current = 0;
        verticalVelocity.current = 0;
        isAirborne.current = false;
        if (setIsAirborneState) setIsAirborneState(false);
        engineAudio.playLandThud();
        crashWobble.current = 0.22; // Landing shock bounce

        if (airtimeTimer.current >= 0.7 && onStunt) {
          onStunt({
            type: 'airtime',
            title: '🦅 SICK AIRTIME!',
            points: Math.round(airtimeTimer.current * 420),
          });
          setScore((prev) => prev + Math.round(airtimeTimer.current * 420));
        }
        airtimeTimer.current = 0;
      }
    } else {
      // Check Mega Ramps launch
      megaRamps.forEach((ramp, idx) => {
        if (!hitRamps.current.has(idx)) {
          const rampPos = new THREE.Vector3(ramp.x, ramp.y, ramp.z);
          const currentBikePos = new THREE.Vector3(
            pointOnCurve.x + normal.x * lateralOffset.current,
            pointOnCurve.y,
            pointOnCurve.z + normal.z * lateralOffset.current
          );
          if (currentBikePos.distanceTo(rampPos) < 3.2 && currentSpeed > 14) {
            hitRamps.current.add(idx);
            isAirborne.current = true;
            if (setIsAirborneState) setIsAirborneState(true);
            verticalVelocity.current = 15.0 + speedRatio * 13.0; // Huge vertical launch!
            velocity.current = Math.min(maxSpeed * 1.25, velocity.current + 22.0); // Mega boost!
            nitroBoostTime.current = 3.5;
            engineAudio.playAirtimeJump();
            crashWobble.current = 0.15;
            if (navigator.vibrate) navigator.vibrate([80, 50, 100]);
          }
        }
      });
    }

    // Suspension pitch
    let targetPitch = 0;
    if (inputState.brake && currentSpeed > 4) targetPitch = -0.065;
    else if (inputState.gas && speedRatio < 0.85) targetPitch = 0.038;
    currentPitch.current = THREE.MathUtils.lerp(currentPitch.current, targetPitch, delta * 8);
    crashWobble.current = THREE.MathUtils.lerp(crashWobble.current, 0, delta * 8);

    // True heading vector
    const headingVector = new THREE.Vector3()
      .copy(tangent)
      .multiplyScalar(Math.max(2.0, velocity.current))
      .addScaledVector(normal, lateralVelocity.current * 0.9)
      .normalize();

    // 7. POSITION BIKE ON 3D ROAD WITH AIRTIME ELEVATION & WHEELIE LIFT
    const wheelieLift = wheeliePitch.current * 0.65;
    bikeRef.current.position.x = pointOnCurve.x + normal.x * lateralOffset.current;
    bikeRef.current.position.y = pointOnCurve.y + verticalOffset.current + wheelieLift;
    bikeRef.current.position.z = pointOnCurve.z + normal.z * lateralOffset.current;

    // Apply rotation from true heading
    const rotMatrix = new THREE.Matrix4().lookAt(
      bikeRef.current.position,
      new THREE.Vector3().addVectors(bikeRef.current.position, headingVector),
      new THREE.Vector3(0, 1, 0)
    );
    bikeRef.current.quaternion.setFromRotationMatrix(rotMatrix);

    // Apply roll lean, wheelie pitch, and wobble
    const wobbleZ = Math.sin(state.clock.elapsedTime * 36) * crashWobble.current;
    const wobbleX = Math.cos(state.clock.elapsedTime * 26) * crashWobble.current * 0.35;
    bikeRef.current.rotateZ(currentLean.current + wobbleZ);
    bikeRef.current.rotateX(currentPitch.current + wheeliePitch.current + wobbleX);

    // LED Taillight
    if (brakeLightRef.current) {
      brakeLightRef.current.material.emissiveIntensity = inputState.brake ? 6.5 : 0.8;
    }

    // 8. MOVING HIGHWAY TRAFFIC & SLIPSTREAM DRAFTING
    if (trafficRef?.current) {
      let isBehindAnyVehicle = false;

      trafficRef.current.forEach((veh) => {
        const vehPos = new THREE.Vector3(veh.x, veh.y, veh.z);
        const dist = bikeRef.current.position.distanceTo(vehPos);

        // Crash into bus / microbus / taxi
        if (dist < 2.5 && !isCrashing.current) {
          isCrashing.current = true;
          crashTimer.current = 1.3;
          velocity.current = Math.max(5, velocity.current * 0.28);
          setScore((prev) => Math.max(0, prev - 600));
          crashWobble.current = 0.55;
          engineAudio.playCrash();
          triggerFlash();
          if (navigator.vibrate) navigator.vibrate([260]);
        } else if (dist <= 4.2 && velocity.current > 14 && !nearMissedTraffic.current.has(veh.id)) {
          // Near miss slalom between moving traffic
          nearMissedTraffic.current.add(veh.id);
          setTimeout(() => nearMissedTraffic.current.delete(veh.id), 3000);
          setScore((prev) => prev + 150);
          engineAudio.playNearMiss();
          if (onNearMiss) onNearMiss();
          if (stuntStatsRef?.current) stuntStatsRef.current.nearMissCount += 1;
          if (onStunt) {
            onStunt({
              type: 'nearmiss',
              title: '⚡ TRAFFIC SLALOM!',
              points: 150,
            });
          }
        }

        // Slipstream drafting: riding directly behind vehicle in same lane
        const laneDiff = Math.abs(lateralOffset.current - veh.lane);
        const deltaProgress = ((safeT - veh.t + 1) % 1.0) * TRACK_LENGTH;
        if (laneDiff < 1.6 && deltaProgress < 0 && deltaProgress > -16.0 && velocity.current > 20) {
          isBehindAnyVehicle = true;
        }
      });

      if (isBehindAnyVehicle) {
        draftTimer.current += delta;
        isDrafting.current = true;
        if (draftTimer.current >= 1.5) {
          // Explode out of slipstream with turbo boost!
          velocity.current = Math.min(maxSpeed * 1.25, velocity.current + 22.0);
          nitroBoostTime.current = 2.8;
          engineAudio.playDraftBoost();
          draftTimer.current = 0;
          setScore((prev) => prev + 300);
          if (onStunt) {
            onStunt({
              type: 'slipstream',
              title: '💨 SLIPSTREAM BOOST!',
              points: 300,
            });
          }
          if (navigator.vibrate) navigator.vibrate([50, 40, 70]);
        }
      } else {
        draftTimer.current = Math.max(0, draftTimer.current - delta * 2);
        isDrafting.current = false;
      }
    }

    // 9. NEPALI MUSICAL HORN
    if (inputState.horn) {
      if (hornCooldown.current <= 0) {
        engineAudio.playHorn();
        hornCooldown.current = 0.65;
        if (onStunt) {
          onStunt({
            type: 'horn',
            title: '📢 PE-PEE-POO!',
            points: 50,
          });
        }
      }
    }
    if (hornCooldown.current > 0) hornCooldown.current -= delta;

    // 10. STATIC OBSTACLES
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
          if (stuntStatsRef?.current) stuntStatsRef.current.nearMissCount += 1;
        }
      }
    });

    // 11. NITRO PADS
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

    // 12. DASHAIN COINS
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

    // Update child state ref for Rider & VFX
    bikeStateRef.current.lean = currentLean.current;
    bikeStateRef.current.isAccelerating = inputState.gas;
    bikeStateRef.current.isBraking = inputState.brake;
    bikeStateRef.current.speedRatio = speedRatio;
    bikeStateRef.current.isNitro = isNitro;
    bikeStateRef.current.isAirborne = isAirborne.current;
    bikeStateRef.current.isWheelie = isWheeliePressed;
    bikeStateRef.current.isScraping = isScrapingSparks.current;

    // 13. BUTTERY-SMOOTH ARCADE CAMERA
    const bikePos = bikeRef.current.position;

    if (!cameraInitialized.current) {
      camHeading.current.copy(headingVector);
      state.camera.position.set(
        bikePos.x - headingVector.x * 6.5,
        bikePos.y + 3.2,
        bikePos.z - headingVector.z * 6.5
      );
      state.camera.lookAt(bikePos.x + headingVector.x * 24.0, bikePos.y + 1.2, bikePos.z + headingVector.z * 24.0);
      cameraInitialized.current = true;
    }

    const headingSmoothFactor = Math.min(1.0, delta * 10);
    camHeading.current.lerp(headingVector, headingSmoothFactor).normalize();

    let followDist = 6.4 + speedRatio * 1.0;
    let camHeight = 3.2 + speedRatio * 0.3;
    let lookAhead = 24.0;
    let baseFov = 58;

    if (cameraMode === 1) {
      followDist = 4.8 + speedRatio * 0.4;
      camHeight = 2.4 + speedRatio * 0.2;
      lookAhead = 20.0;
      baseFov = 64;
    } else if (cameraMode === 2) {
      followDist = 10.0 + speedRatio * 1.2;
      camHeight = 5.2 + speedRatio * 0.4;
      lookAhead = 28.0;
      baseFov = 54;
    }

    // Slightly elevate camera during big vertical airtime
    if (isAirborne.current) {
      camHeight += Math.min(4.0, verticalOffset.current * 0.35);
      followDist += 0.8;
    }

    state.camera.position.set(
      bikePos.x - camHeading.current.x * followDist,
      bikePos.y + camHeight,
      bikePos.z - camHeading.current.z * followDist
    );

    const lookTarget = new THREE.Vector3(
      bikePos.x + headingVector.x * lookAhead,
      bikePos.y + 1.3,
      bikePos.z + headingVector.z * lookAhead
    );

    state.camera.lookAt(lookTarget);
    state.camera.rotateZ(currentLean.current * 0.14);

    // Dynamic FOV rush during high speed / nitro boost / mega jumps
    const targetFov = baseFov + speedRatio * (isNitro ? 18 : 10) + (isAirborne.current ? 8 : 0);
    state.camera.fov = THREE.MathUtils.lerp(state.camera.fov, targetFov, delta * 6);
    state.camera.updateProjectionMatrix();
  });

  return (
    <group ref={bikeRef} position={[0, 0, 0]}>
      {/* 3D Bajaj Motorcycle Model */}
      <primitive object={scene} scale={2.0} rotation={[0, Math.PI, 0]} />

      {/* 3D Realistic Racer Character */}
      <Rider
        bikeStateRef={bikeStateRef}
        accentColor={selectedBike.color}
        scale={2.0}
        position={[0, 1.64, 0.36]}
        rotation={[0, Math.PI, 0]}
      />

      {/* Exhaust Smoke & Blue Nitro Flame VFX */}
      <ExhaustParticles bikeRef={bikeRef} bikeStateRef={bikeStateRef} />

      {/* Neon Underglow, Sparks & Skid Smoke VFX */}
      <BikeVFX bikeRef={bikeRef} bikeStateRef={bikeStateRef} accentColor={selectedBike.color} />

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
