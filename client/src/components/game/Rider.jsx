import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/* ------------------------------------------------------------------ */
/*  Procedural Textures for Lifelike Racing Suit & Gear               */
/* ------------------------------------------------------------------ */

const texCache = {};

function getCanvasTexture(key, width, height, draw) {
  if (texCache[key]) return texCache[key];
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  draw(ctx, width, height);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  texCache[key] = tex;
  return tex;
}

// 1. Carbon Fiber 2x2 Twill Weave Pattern
function getCarbonFiberTexture() {
  return getCanvasTexture('carbon_fiber', 64, 64, (ctx, w, h) => {
    ctx.fillStyle = '#14161a';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#282b33';
    const s = 16;
    for (let y = 0; y < h; y += s) {
      for (let x = 0; x < w; x += s) {
        if ((x / s + y / s) % 2 === 0) {
          ctx.fillRect(x, y, s, s);
          ctx.fillStyle = '#3a3f4b';
          ctx.fillRect(x + 2, y + 2, s - 4, s - 4);
          ctx.fillStyle = '#282b33';
        }
      }
    }
  });
}

// 2. Kevlar Accordion Stretch Flex Zones
function getAccordionTexture() {
  return getCanvasTexture('accordion_kevlar', 32, 64, (ctx, w, h) => {
    ctx.fillStyle = '#111215';
    ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 8) {
      ctx.fillStyle = '#23252b';
      ctx.fillRect(0, y, w, 4);
      ctx.fillStyle = '#08080a';
      ctx.fillRect(0, y + 4, w, 4);
    }
  });
}

// 3. Bajaj Racing Decal Texture for Chest & Speed Hump
function getBajajRacingDecal() {
  return getCanvasTexture('bajaj_decal', 256, 128, (ctx, w, h) => {
    ctx.fillStyle = '#121316';
    ctx.fillRect(0, 0, w, h);

    // Diagonal speed slash
    ctx.fillStyle = '#e31c25';
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(w * 0.45, 0);
    ctx.lineTo(w * 0.6, 0);
    ctx.lineTo(w * 0.15, h);
    ctx.closePath();
    ctx.fill();

    // "BAJAJ" Brand Name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('BAJAJ', w * 0.52, 42);

    // "PULSAR RACING" Sub-text
    ctx.fillStyle = '#f7b500';
    ctx.font = '900 18px sans-serif';
    ctx.letterSpacing = '3px';
    ctx.fillText('PULSAR RACING', w * 0.52, 84);

    // Border trim
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.strokeRect(6, 6, w - 12, h - 12);
  });
}

// 4. Nepal Flag Shoulder Badge
function getNepalFlagBadge() {
  return getCanvasTexture('nepal_badge', 128, 128, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#003893'; // Blue outer border
    ctx.beginPath();
    ctx.moveTo(14, 10);
    ctx.lineTo(105, 52);
    ctx.lineTo(44, 52);
    ctx.lineTo(110, 116);
    ctx.lineTo(14, 116);
    ctx.closePath();
    ctx.fill();

    // Crimson inner triangles
    ctx.fillStyle = '#dc143c';
    ctx.beginPath();
    ctx.moveTo(22, 22);
    ctx.lineTo(92, 48);
    ctx.lineTo(38, 48);
    ctx.lineTo(96, 108);
    ctx.lineTo(22, 108);
    ctx.closePath();
    ctx.fill();

    // White Moon & Sun
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(42, 38, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(46, 82, 9, 0, Math.PI * 2);
    ctx.fill();
  });
}

/**
 * Realistic 3D Motorcycle Racer with:
 * - MotoGP-Spec Sculpted Anatomy & Ergonomic Forward Tuck
 * - Biomechanical Micro-Vibrations & Breathing Dynamics
 * - High-Speed Aerodynamic Wind Flutter
 * - Active Counter-Steering Arm Kinematics & Throttle Roll
 * - Iridescent Mirrored Helmet Visor & Carbon-Fiber Armor Plates
 */
export default function Rider({ bikeStateRef, accentColor = '#e31c25', ...groupProps }) {
  const spineGroup = useRef();
  const headGroup = useRef();
  const leftLegRef = useRef();
  const rightLegRef = useRef();
  const leftArmRef = useRef();
  const rightArmRef = useRef();
  const rightHandRef = useRef();
  const speedHumpRef = useRef();

  const textures = useMemo(() => ({
    carbon: getCarbonFiberTexture(),
    accordion: getAccordionTexture(),
    bajajDecal: getBajajRacingDecal(),
    nepalBadge: getNepalFlagBadge(),
  }), []);

  useFrame((state, delta) => {
    if (!spineGroup.current || !bikeStateRef?.current) return;

    const {
      lean = 0,
      isAccelerating = false,
      isBraking = false,
      speedRatio = 0,
      isWheelie = false,
      isAirborne = false,
    } = bikeStateRef.current;

    // 1. BIOMECHANICAL MICRO-VIBRATION & IDLE BREATHING
    const time = state.clock.elapsedTime;
    const idleBreath = Math.sin(time * 2.8) * 0.012;
    const rpmVibration = (Math.sin(time * 65.0) + Math.cos(time * 52.0)) * speedRatio * 0.006;
    const windFlutter = speedRatio > 0.45 ? Math.sin(time * 32.0) * 0.016 * speedRatio : 0;

    // 2. DYNAMIC RACING POSTURE
    // - Full throttle: deep aerodynamic tuck over the fuel tank
    // - Braking: sit up into the air-stream to catch wind and brace arms
    // - Wheelie: torso rocks back, center of gravity moves over rear wheel
    let targetTuck = 0.32 + speedRatio * 0.18 + idleBreath;
    if (isAccelerating) targetTuck += 0.12;
    if (isBraking) targetTuck = 0.10;
    if (isWheelie) targetTuck = -0.22;
    if (isAirborne) targetTuck = 0.20;

    // 3. APEX HANG-OFF & KINEMATICS
    // Note: Rider group is rotated Math.PI around Y, so signs invert for correct world orientation
    const targetBodyRoll = -lean * 0.75 + windFlutter;
    const targetBodyShiftX = -lean * 0.24;

    spineGroup.current.rotation.x = THREE.MathUtils.lerp(spineGroup.current.rotation.x, targetTuck, delta * 12);
    spineGroup.current.rotation.z = THREE.MathUtils.lerp(spineGroup.current.rotation.z, targetBodyRoll, delta * 14);
    spineGroup.current.position.x = THREE.MathUtils.lerp(spineGroup.current.position.x, targetBodyShiftX, delta * 12);
    spineGroup.current.position.y = 0.10 + rpmVibration;

    // 4. APEX EYE & VISOR TRACKING (Rider looks through curve toward the exit)
    if (headGroup.current) {
      const targetHeadYaw = -lean * 0.62 + (Math.sin(time * 22.0) * windFlutter * 0.5);
      const targetHeadPitch = -targetTuck * 0.82 + (isAccelerating ? 0.08 : 0);
      headGroup.current.rotation.y = THREE.MathUtils.lerp(headGroup.current.rotation.y, targetHeadYaw, delta * 14);
      headGroup.current.rotation.x = THREE.MathUtils.lerp(headGroup.current.rotation.x, targetHeadPitch, delta * 12);
      headGroup.current.rotation.z = THREE.MathUtils.lerp(headGroup.current.rotation.z, -lean * 0.18, delta * 12);
    }

    // 5. COUNTER-STEERING ARM KINEMATICS & THROTTLE ROLL
    if (leftArmRef.current && rightArmRef.current) {
      const armPushPull = lean * 0.04;
      leftArmRef.current.position.z = 0.08 - armPushPull;
      rightArmRef.current.position.z = 0.08 + armPushPull;

      if (rightHandRef.current) {
        // Twist right wrist backward during throttle acceleration
        const targetThrottleRoll = isAccelerating ? 0.38 : 0.05;
        rightHandRef.current.rotation.x = THREE.MathUtils.lerp(rightHandRef.current.rotation.x, targetThrottleRoll, delta * 14);
      }
    }

    // 6. KNEE SLIDERS / PUCKS TARMAC DRAG
    if (leftLegRef.current && rightLegRef.current) {
      const leftKneeKick = lean > 0.04 ? lean * 0.65 : 0;
      const rightKneeKick = lean < -0.04 ? -lean * 0.65 : 0;
      leftLegRef.current.rotation.z = THREE.MathUtils.lerp(leftLegRef.current.rotation.z, -0.18 - leftKneeKick, delta * 12);
      rightLegRef.current.rotation.z = THREE.MathUtils.lerp(rightLegRef.current.rotation.z, 0.18 + rightKneeKick, delta * 12);
    }
  });

  return (
    <group {...groupProps}>
      {/* ============================================================ */}
      {/* LOWER BODY: Hips, Saddle Seat, Legs & Microfiber Racing Boots*/}
      {/* ============================================================ */}
      <group position={[0, 0, 0]}>
        {/* Anatomical Hip & Seat Cushion */}
        <mesh position={[0, 0.06, -0.03]} castShadow receiveShadow>
          <boxGeometry args={[0.34, 0.16, 0.32]} />
          <meshStandardMaterial color="#131417" roughness={0.8} />
        </mesh>
        {/* Kevlar Accordion Lower Back Flex Band */}
        <mesh position={[0, 0.14, -0.15]} rotation={[-0.38, 0, 0]} castShadow>
          <boxGeometry args={[0.26, 0.09, 0.08]} />
          <meshStandardMaterial map={textures.accordion} roughness={0.9} />
        </mesh>

        {/* ---------------- LEFT LEG & BOOT ---------------- */}
        <group ref={leftLegRef} position={[-0.15, 0.02, 0.02]} rotation={[0.48, 0.08, -0.18]}>
          {/* Thigh (gripping the fuel tank tightly) */}
          <mesh position={[0, -0.19, 0.14]} rotation={[-0.72, 0, 0]} castShadow>
            <cylinderGeometry args={[0.082, 0.070, 0.38, 14]} />
            <meshStandardMaterial color="#16171b" roughness={0.65} />
          </mesh>
          {/* Accent Racing Leather Stripe on Thigh */}
          <mesh position={[-0.045, -0.19, 0.15]} rotation={[-0.72, 0, 0]}>
            <boxGeometry args={[0.018, 0.34, 0.065]} />
            <meshStandardMaterial color={accentColor} roughness={0.35} />
          </mesh>

          {/* Hard Dual-Compound Knee Slider (Tarmac Scuff Puck) */}
          <mesh position={[-0.078, -0.32, 0.30]} rotation={[0, -0.22, 0]} castShadow>
            <boxGeometry args={[0.048, 0.095, 0.11]} />
            <meshStandardMaterial color="#ffffff" roughness={0.25} />
          </mesh>
          <mesh position={[-0.062, -0.32, 0.28]}>
            <cylinderGeometry args={[0.062, 0.062, 0.075, 12]} />
            <meshStandardMaterial map={textures.carbon} roughness={0.5} />
          </mesh>

          {/* Calf / Shin Guard with Kevlar Flex Accordion */}
          <mesh position={[0, -0.38, 0.11]} rotation={[0.68, 0, 0]} castShadow>
            <cylinderGeometry args={[0.066, 0.056, 0.34, 12]} />
            <meshStandardMaterial color="#141518" roughness={0.7} />
          </mesh>

          {/* High-Top Microfiber Racing Boot */}
          <mesh position={[0, -0.50, -0.04]} rotation={[0.08, 0, 0]} castShadow>
            <boxGeometry args={[0.085, 0.098, 0.21]} />
            <meshStandardMaterial color="#0f1012" roughness={0.4} />
          </mesh>
          {/* Replaceable Magnesium Toe Slider on outer boot */}
          <mesh position={[-0.048, -0.53, 0.03]} rotation={[0, 0.2, 0]}>
            <boxGeometry args={[0.022, 0.038, 0.085]} />
            <meshStandardMaterial color="#e5e9f0" metalness={0.92} roughness={0.15} />
          </mesh>
        </group>

        {/* ---------------- RIGHT LEG & BOOT ---------------- */}
        <group ref={rightLegRef} position={[0.15, 0.02, 0.02]} rotation={[0.48, -0.08, 0.18]}>
          {/* Thigh (gripping the fuel tank tightly) */}
          <mesh position={[0, -0.19, 0.14]} rotation={[-0.72, 0, 0]} castShadow>
            <cylinderGeometry args={[0.082, 0.070, 0.38, 14]} />
            <meshStandardMaterial color="#16171b" roughness={0.65} />
          </mesh>
          {/* Accent Racing Leather Stripe on Thigh */}
          <mesh position={[0.045, -0.19, 0.15]} rotation={[-0.72, 0, 0]}>
            <boxGeometry args={[0.018, 0.34, 0.065]} />
            <meshStandardMaterial color={accentColor} roughness={0.35} />
          </mesh>

          {/* Hard Dual-Compound Knee Slider (Tarmac Scuff Puck) */}
          <mesh position={[0.078, -0.32, 0.30]} rotation={[0, 0.22, 0]} castShadow>
            <boxGeometry args={[0.048, 0.095, 0.11]} />
            <meshStandardMaterial color="#ffffff" roughness={0.25} />
          </mesh>
          <mesh position={[0.062, -0.32, 0.28]}>
            <cylinderGeometry args={[0.062, 0.062, 0.075, 12]} />
            <meshStandardMaterial map={textures.carbon} roughness={0.5} />
          </mesh>

          {/* Calf / Shin Guard with Kevlar Flex Accordion */}
          <mesh position={[0, -0.38, 0.11]} rotation={[0.68, 0, 0]} castShadow>
            <cylinderGeometry args={[0.066, 0.056, 0.34, 12]} />
            <meshStandardMaterial color="#141518" roughness={0.7} />
          </mesh>

          {/* High-Top Microfiber Racing Boot */}
          <mesh position={[0, -0.50, -0.04]} rotation={[0.08, 0, 0]} castShadow>
            <boxGeometry args={[0.085, 0.098, 0.21]} />
            <meshStandardMaterial color="#0f1012" roughness={0.4} />
          </mesh>
          {/* Replaceable Magnesium Toe Slider on outer boot */}
          <mesh position={[0.048, -0.53, 0.03]} rotation={[0, -0.2, 0]}>
            <boxGeometry args={[0.022, 0.038, 0.085]} />
            <meshStandardMaterial color="#e5e9f0" metalness={0.92} roughness={0.15} />
          </mesh>
        </group>
      </group>

      {/* ============================================================ */}
      {/* UPPER BODY: Contoured Torso, Aerodynamic Hump, Arms & Helmet */}
      {/* ============================================================ */}
      <group ref={spineGroup} position={[0, 0.10, 0]}>
        {/* Lumbar Waist with Ergonomic Leather Taper */}
        <mesh position={[0, 0.12, 0.02]} castShadow>
          <cylinderGeometry args={[0.18, 0.155, 0.20, 14]} />
          <meshStandardMaterial color="#16171b" roughness={0.65} />
        </mesh>

        {/* Muscular Chest & Upper Torso */}
        <mesh position={[0, 0.28, 0.04]} castShadow>
          <boxGeometry args={[0.39, 0.24, 0.27]} />
          <meshStandardMaterial color="#141518" roughness={0.6} />
        </mesh>

        {/* Official BAJAJ Racing Chest Livery Emblem */}
        <mesh position={[0, 0.29, 0.18]}>
          <planeGeometry args={[0.26, 0.13]} />
          <meshStandardMaterial map={textures.bajajDecal} roughness={0.4} />
        </mesh>

        {/* Ergonomic Molded Spine Guard Backbone Plates */}
        <mesh position={[0, 0.28, -0.10]} castShadow>
          <boxGeometry args={[0.17, 0.28, 0.025]} />
          <meshStandardMaterial map={textures.carbon} roughness={0.4} />
        </mesh>

        {/* Aerodynamic Speed Hump on Upper Back (MotoGP Style) */}
        <group ref={speedHumpRef} position={[0, 0.38, -0.16]}>
          <mesh rotation={[-0.48, 0, 0]} castShadow>
            <boxGeometry args={[0.17, 0.26, 0.12]} />
            <meshStandardMaterial color="#101114" roughness={0.35} />
          </mesh>
          {/* Top Aerodynamic Air Foil on Hump */}
          <mesh position={[0, 0.06, -0.04]} rotation={[-0.55, 0, 0]} castShadow>
            <boxGeometry args={[0.13, 0.14, 0.09]} />
            <meshStandardMaterial color={accentColor} roughness={0.3} />
          </mesh>
          {/* Bajaj Racing Badge on Upper Speed Hump */}
          <mesh position={[0, 0.05, -0.09]} rotation={[-0.55, Math.PI, 0]}>
            <planeGeometry args={[0.12, 0.06]} />
            <meshStandardMaterial map={textures.bajajDecal} roughness={0.35} />
          </mesh>
        </group>

        {/* Titanium Dual-Compound Shoulder Sliders */}
        <mesh position={[-0.23, 0.36, 0.04]} rotation={[0, 0, 0.32]} castShadow>
          <sphereGeometry args={[0.082, 14, 12]} />
          <meshStandardMaterial color="#d8dde6" metalness={0.92} roughness={0.16} />
        </mesh>
        <mesh position={[0.23, 0.36, 0.04]} rotation={[0, 0, -0.32]} castShadow>
          <sphereGeometry args={[0.082, 14, 12]} />
          <meshStandardMaterial color="#d8dde6" metalness={0.92} roughness={0.16} />
        </mesh>

        {/* Nepal National Flag Emblem on Right Shoulder */}
        <mesh position={[0.21, 0.28, 0.04]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[0.09, 0.09]} />
          <meshStandardMaterial map={textures.nepalBadge} transparent roughness={0.3} />
        </mesh>

        {/* ---------------- LEFT ARM & CLUTCH GLOVE ---------------- */}
        <group ref={leftArmRef} position={[-0.20, 0.34, 0.08]}>
          {/* Bicep / Upper Arm */}
          <mesh position={[-0.07, -0.11, 0.14]} rotation={[0.78, 0.18, -0.28]} castShadow>
            <cylinderGeometry args={[0.059, 0.053, 0.30, 12]} />
            <meshStandardMaterial color={accentColor} roughness={0.5} />
          </mesh>
          {/* Carbon Fiber Elbow Slider with Spark Scuff Insert */}
          <mesh position={[-0.11, -0.22, 0.26]}>
            <sphereGeometry args={[0.054, 10, 10]} />
            <meshStandardMaterial map={textures.carbon} metalness={0.7} roughness={0.25} />
          </mesh>
          {/* Forearm Angled Forward Toward Handlebar */}
          <mesh position={[-0.10, -0.24, 0.38]} rotation={[0.42, 0.22, -0.12]} castShadow>
            <cylinderGeometry args={[0.053, 0.047, 0.28, 12]} />
            <meshStandardMaterial color="#16171b" roughness={0.65} />
          </mesh>
          {/* Full-Gauntlet Racing Glove with Carbon Knuckle Plate */}
          <mesh position={[-0.12, -0.32, 0.52]} rotation={[0.2, 0.15, 0]} castShadow>
            <boxGeometry args={[0.078, 0.072, 0.12]} />
            <meshStandardMaterial color="#0e0f12" roughness={0.4} />
          </mesh>
          <mesh position={[-0.12, -0.288, 0.53]}>
            <boxGeometry args={[0.068, 0.022, 0.065]} />
            <meshStandardMaterial map={textures.carbon} metalness={0.8} roughness={0.2} />
          </mesh>
        </group>

        {/* ---------------- RIGHT ARM & THROTTLE GLOVE ---------------- */}
        <group ref={rightArmRef} position={[0.20, 0.34, 0.08]}>
          {/* Bicep / Upper Arm */}
          <mesh position={[0.07, -0.11, 0.14]} rotation={[0.78, -0.18, 0.28]} castShadow>
            <cylinderGeometry args={[0.059, 0.053, 0.30, 12]} />
            <meshStandardMaterial color={accentColor} roughness={0.5} />
          </mesh>
          {/* Carbon Fiber Elbow Slider with Spark Scuff Insert */}
          <mesh position={[0.11, -0.22, 0.26]}>
            <sphereGeometry args={[0.054, 10, 10]} />
            <meshStandardMaterial map={textures.carbon} metalness={0.7} roughness={0.25} />
          </mesh>
          {/* Forearm Angled Forward Toward Throttle Grip */}
          <mesh position={[0.10, -0.24, 0.38]} rotation={[0.42, -0.22, 0.12]} castShadow>
            <cylinderGeometry args={[0.053, 0.047, 0.28, 12]} />
            <meshStandardMaterial color="#16171b" roughness={0.65} />
          </mesh>
          {/* Dynamic Throttle Wrist (Rolls when accelerating) */}
          <group ref={rightHandRef} position={[0.12, -0.32, 0.52]}>
            <mesh rotation={[0.2, -0.15, 0]} castShadow>
              <boxGeometry args={[0.078, 0.072, 0.12]} />
              <meshStandardMaterial color="#0e0f12" roughness={0.4} />
            </mesh>
            <mesh position={[0, 0.032, 0.01]}>
              <boxGeometry args={[0.068, 0.022, 0.065]} />
              <meshStandardMaterial map={textures.carbon} metalness={0.8} roughness={0.2} />
            </mesh>
          </group>
        </group>

        {/* ---------------- AERODYNAMIC RACING HELMET & VISOR ---------------- */}
        <group ref={headGroup} position={[0, 0.46, 0.08]}>
          {/* Padded Flame-Retardant Neck Balaclava */}
          <mesh position={[0, -0.04, 0]} castShadow>
            <cylinderGeometry args={[0.070, 0.085, 0.09, 14]} />
            <meshStandardMaterial color="#121316" roughness={0.9} />
          </mesh>

          {/* Main Aerodynamic Helmet Shell (Teardrop Race Profile) */}
          <mesh position={[0, 0.11, 0.01]} castShadow>
            <sphereGeometry args={[0.176, 28, 24]} />
            <meshStandardMaterial color={accentColor} roughness={0.18} metalness={0.35} />
          </mesh>

          {/* Chin Bar Guard with High-Flow Mouth Intake Mesh */}
          <mesh position={[0, 0.04, 0.145]} rotation={[0.22, 0, 0]} castShadow>
            <boxGeometry args={[0.155, 0.105, 0.12]} />
            <meshStandardMaterial color="#101114" roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.03, 0.21]}>
            <boxGeometry args={[0.065, 0.028, 0.01]} />
            <meshStandardMaterial color="#2b2f38" metalness={0.6} roughness={0.4} />
          </mesh>

          {/* Top Brow Ram-Air Scoops */}
          {[-0.045, 0.045].map((x) => (
            <mesh key={`vent-${x}`} position={[x, 0.22, 0.10]} rotation={[-0.3, 0, 0]}>
              <boxGeometry args={[0.026, 0.015, 0.06]} />
              <meshStandardMaterial color="#0a0b0d" metalness={0.7} roughness={0.2} />
            </mesh>
          ))}

          {/* Rear Aerodynamic Kamm-Tail Diffuser / Downforce Spoiler */}
          <mesh position={[0, 0.165, -0.105]} rotation={[-0.45, 0, 0]} castShadow>
            <boxGeometry args={[0.125, 0.052, 0.16]} />
            <meshStandardMaterial color="#08090a" roughness={0.18} metalness={0.5} />
          </mesh>

          {/* Reflective Iridescent Gold / Deep Smoke Mirrored Visor */}
          <mesh position={[0, 0.125, 0.144]} rotation={[0.12, 0, 0]}>
            <cylinderGeometry args={[0.154, 0.154, 0.088, 24, 1, false, -Math.PI * 0.38, Math.PI * 0.76]} />
            <meshStandardMaterial
              color="#090d14"
              emissive="#1a2e40"
              emissiveIntensity={0.45}
              metalness={0.98}
              roughness={0.04}
            />
          </mesh>

          {/* Visor Side Pivot Ratchet Mechanisms */}
          {[-0.168, 0.168].map((x) => (
            <group key={`pivot-${x}`} position={[x, 0.115, 0.04]} rotation={[0, Math.PI / 2, 0]}>
              <mesh>
                <cylinderGeometry args={[0.026, 0.026, 0.012, 12]} />
                <meshStandardMaterial map={textures.carbon} metalness={0.8} roughness={0.2} />
              </mesh>
            </group>
          ))}
        </group>
      </group>
    </group>
  );
}
