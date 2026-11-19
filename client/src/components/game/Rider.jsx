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
    ctx.fillStyle = '#111317';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#22252c';
    const s = 16;
    for (let y = 0; y < h; y += s) {
      for (let x = 0; x < w; x += s) {
        if ((x / s + y / s) % 2 === 0) {
          ctx.fillRect(x, y, s, s);
          ctx.fillStyle = '#2e333d';
          ctx.fillRect(x + 2, y + 2, s - 4, s - 4);
          ctx.fillStyle = '#22252c';
        }
      }
    }
  });
}

// 2. Kevlar Accordion Stretch Flex Zones
function getAccordionTexture() {
  return getCanvasTexture('accordion_kevlar', 32, 64, (ctx, w, h) => {
    ctx.fillStyle = '#0f1013';
    ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 8) {
      ctx.fillStyle = '#1e2026';
      ctx.fillRect(0, y, w, 4);
      ctx.fillStyle = '#0a0a0d';
      ctx.fillRect(0, y + 4, w, 4);
    }
  });
}

// 3. Bajaj Racing Decal Texture for Chest & Speed Hump
function getBajajRacingDecal() {
  return getCanvasTexture('bajaj_decal', 256, 128, (ctx, w, h) => {
    ctx.fillStyle = '#111215';
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

// 5. Racing Helmet Graphic Stripe Texture
function getHelmetGraphicTexture() {
  return getCanvasTexture('helmet_stripe', 128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#e31c25';
    ctx.fillRect(0, 0, w, h);

    // Center dual white racing stripes
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(w * 0.44, 0, w * 0.035, h);
    ctx.fillRect(w * 0.525, 0, w * 0.035, h);

    // Center carbon accent band
    ctx.fillStyle = '#111215';
    ctx.fillRect(w * 0.48, 0, w * 0.04, h);
  });
}

/**
 * Realistic 3D Motorcycle Racer with:
 * - Natural Anatomical Proportions & Ergonomic Forward Racing Tuck
 * - Low-profile aerodynamic speed hump & contoured carbon shoulder armor
 * - Biomechanical micro-vibrations, idle breathing & high-speed wind flutter
 * - Active counter-steering arm kinematics & throttle wrist roll
 * - Iridescent mirrored helmet visor with racing graphics
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
    helmetGraphic: getHelmetGraphicTexture(),
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
    const rpmVibration = (Math.sin(time * 65.0) + Math.cos(time * 52.0)) * speedRatio * 0.005;
    const windFlutter = speedRatio > 0.45 ? Math.sin(time * 30.0) * 0.014 * speedRatio : 0;

    // 2. DYNAMIC RACING POSTURE
    // Natural forward racing tuck: chest resting low over the fuel tank
    let targetTuck = 0.42 + speedRatio * 0.16 + idleBreath;
    if (isAccelerating) targetTuck += 0.12;
    if (isBraking) targetTuck = 0.18;      // Sit up into airstream to catch wind
    if (isWheelie) targetTuck = -0.22;     // Torso rocks back during wheelie
    if (isAirborne) targetTuck = 0.28;

    // 3. APEX HANG-OFF & LATERAL BODY SHIFT
    // Rider hangs off the inside of the turn into the apex
    const targetBodyRoll = -lean * 0.70 + windFlutter;
    const targetBodyShiftX = -lean * 0.22;

    spineGroup.current.rotation.x = THREE.MathUtils.lerp(spineGroup.current.rotation.x, targetTuck, delta * 12);
    spineGroup.current.rotation.z = THREE.MathUtils.lerp(spineGroup.current.rotation.z, targetBodyRoll, delta * 14);
    spineGroup.current.position.x = THREE.MathUtils.lerp(spineGroup.current.position.x, targetBodyShiftX, delta * 12);
    spineGroup.current.position.y = 0.10 + rpmVibration;

    // 4. APEX EYE & VISOR TRACKING (Rider looks up through visor toward corner exit)
    if (headGroup.current) {
      const targetHeadYaw = -lean * 0.58 + (Math.sin(time * 22.0) * windFlutter * 0.5);
      const targetHeadPitch = -targetTuck * 0.78 + (isAccelerating ? 0.06 : 0);
      headGroup.current.rotation.y = THREE.MathUtils.lerp(headGroup.current.rotation.y, targetHeadYaw, delta * 14);
      headGroup.current.rotation.x = THREE.MathUtils.lerp(headGroup.current.rotation.x, targetHeadPitch, delta * 12);
      headGroup.current.rotation.z = THREE.MathUtils.lerp(headGroup.current.rotation.z, -lean * 0.16, delta * 12);
    }

    // 5. COUNTER-STEERING ARM KINEMATICS & THROTTLE ROLL
    if (leftArmRef.current && rightArmRef.current) {
      const armPushPull = lean * 0.035;
      leftArmRef.current.position.z = 0.06 - armPushPull;
      rightArmRef.current.position.z = 0.06 + armPushPull;

      if (rightHandRef.current) {
        // Twist right wrist backward during throttle acceleration
        const targetThrottleRoll = isAccelerating ? 0.36 : 0.04;
        rightHandRef.current.rotation.x = THREE.MathUtils.lerp(rightHandRef.current.rotation.x, targetThrottleRoll, delta * 14);
      }
    }

    // 6. KNEE SLIDERS / PUCKS TARMAC DRAG
    if (leftLegRef.current && rightLegRef.current) {
      const leftKneeKick = lean > 0.04 ? lean * 0.60 : 0;
      const rightKneeKick = lean < -0.04 ? -lean * 0.60 : 0;
      leftLegRef.current.rotation.z = THREE.MathUtils.lerp(leftLegRef.current.rotation.z, -0.16 - leftKneeKick, delta * 12);
      rightLegRef.current.rotation.z = THREE.MathUtils.lerp(rightLegRef.current.rotation.z, 0.16 + rightKneeKick, delta * 12);
    }
  });

  return (
    <group {...groupProps}>
      {/* ============================================================ */}
      {/* LOWER BODY: Hips, Saddle Seat, Legs & Microfiber Racing Boots*/}
      {/* ============================================================ */}
      <group position={[0, 0, 0]}>
        {/* Anatomical Hip & Seat Cushion firmly resting on motorcycle saddle */}
        <mesh position={[0, 0.05, -0.02]} castShadow receiveShadow>
          <boxGeometry args={[0.32, 0.14, 0.28]} />
          <meshStandardMaterial color="#141518" roughness={0.85} />
        </mesh>
        {/* Kevlar Accordion Lower Back Flex Band */}
        <mesh position={[0, 0.12, -0.12]} rotation={[-0.42, 0, 0]} castShadow>
          <boxGeometry args={[0.24, 0.08, 0.07]} />
          <meshStandardMaterial map={textures.accordion} roughness={0.9} />
        </mesh>

        {/* ---------------- LEFT LEG & BOOT ---------------- */}
        <group ref={leftLegRef} position={[-0.14, 0.02, 0.02]} rotation={[0.52, 0.08, -0.16]}>
          {/* Thigh (gripping the fuel tank tightly) */}
          <mesh position={[0, -0.18, 0.13]} rotation={[-0.74, 0, 0]} castShadow>
            <cylinderGeometry args={[0.076, 0.065, 0.36, 12]} />
            <meshStandardMaterial color="#16171a" roughness={0.7} />
          </mesh>
          {/* Accent Racing Leather Stripe on Thigh */}
          <mesh position={[-0.042, -0.18, 0.14]} rotation={[-0.74, 0, 0]}>
            <boxGeometry args={[0.016, 0.32, 0.06]} />
            <meshStandardMaterial color={accentColor} roughness={0.4} />
          </mesh>

          {/* Hard Dual-Compound Knee Slider (Tarmac Scuff Puck) */}
          <mesh position={[-0.072, -0.30, 0.28]} rotation={[0, -0.20, 0]} castShadow>
            <boxGeometry args={[0.044, 0.09, 0.10]} />
            <meshStandardMaterial color="#ffffff" roughness={0.3} />
          </mesh>
          <mesh position={[-0.058, -0.30, 0.26]}>
            <cylinderGeometry args={[0.058, 0.058, 0.07, 10]} />
            <meshStandardMaterial map={textures.carbon} roughness={0.5} />
          </mesh>

          {/* Calf / Shin Guard with Kevlar Flex Accordion */}
          <mesh position={[0, -0.36, 0.10]} rotation={[0.70, 0, 0]} castShadow>
            <cylinderGeometry args={[0.062, 0.052, 0.32, 10]} />
            <meshStandardMaterial color="#131417" roughness={0.75} />
          </mesh>

          {/* High-Top Microfiber Racing Boot positioned on footpeg */}
          <mesh position={[0, -0.48, -0.04]} rotation={[0.08, 0, 0]} castShadow>
            <boxGeometry args={[0.08, 0.092, 0.20]} />
            <meshStandardMaterial color="#0e0f11" roughness={0.4} />
          </mesh>
          {/* Replaceable Magnesium Toe Slider on outer boot */}
          <mesh position={[-0.044, -0.51, 0.03]} rotation={[0, 0.2, 0]}>
            <boxGeometry args={[0.02, 0.035, 0.08]} />
            <meshStandardMaterial color="#c0c5d0" metalness={0.88} roughness={0.2} />
          </mesh>
        </group>

        {/* ---------------- RIGHT LEG & BOOT ---------------- */}
        <group ref={rightLegRef} position={[0.14, 0.02, 0.02]} rotation={[0.52, -0.08, 0.16]}>
          {/* Thigh (gripping the fuel tank tightly) */}
          <mesh position={[0, -0.18, 0.13]} rotation={[-0.74, 0, 0]} castShadow>
            <cylinderGeometry args={[0.076, 0.065, 0.36, 12]} />
            <meshStandardMaterial color="#16171a" roughness={0.7} />
          </mesh>
          {/* Accent Racing Leather Stripe on Thigh */}
          <mesh position={[0.042, -0.18, 0.14]} rotation={[-0.74, 0, 0]}>
            <boxGeometry args={[0.016, 0.32, 0.06]} />
            <meshStandardMaterial color={accentColor} roughness={0.4} />
          </mesh>

          {/* Hard Dual-Compound Knee Slider (Tarmac Scuff Puck) */}
          <mesh position={[0.072, -0.30, 0.28]} rotation={[0, 0.20, 0]} castShadow>
            <boxGeometry args={[0.044, 0.09, 0.10]} />
            <meshStandardMaterial color="#ffffff" roughness={0.3} />
          </mesh>
          <mesh position={[0.058, -0.30, 0.26]}>
            <cylinderGeometry args={[0.058, 0.058, 0.07, 10]} />
            <meshStandardMaterial map={textures.carbon} roughness={0.5} />
          </mesh>

          {/* Calf / Shin Guard with Kevlar Flex Accordion */}
          <mesh position={[0, -0.36, 0.10]} rotation={[0.70, 0, 0]} castShadow>
            <cylinderGeometry args={[0.062, 0.052, 0.32, 10]} />
            <meshStandardMaterial color="#131417" roughness={0.75} />
          </mesh>

          {/* High-Top Microfiber Racing Boot positioned on footpeg */}
          <mesh position={[0, -0.48, -0.04]} rotation={[0.08, 0, 0]} castShadow>
            <boxGeometry args={[0.08, 0.092, 0.20]} />
            <meshStandardMaterial color="#0e0f11" roughness={0.4} />
          </mesh>
          {/* Replaceable Magnesium Toe Slider on outer boot */}
          <mesh position={[0.044, -0.51, 0.03]} rotation={[0, -0.2, 0]}>
            <boxGeometry args={[0.02, 0.035, 0.08]} />
            <meshStandardMaterial color="#c0c5d0" metalness={0.88} roughness={0.2} />
          </mesh>
        </group>
      </group>

      {/* ============================================================ */}
      {/* UPPER BODY: Contoured Torso, Aerodynamic Hump, Arms & Helmet */}
      {/* ============================================================ */}
      <group ref={spineGroup} position={[0, 0.10, 0]}>
        {/* Lumbar Waist with Ergonomic Leather Taper */}
        <mesh position={[0, 0.11, 0.01]} castShadow>
          <cylinderGeometry args={[0.165, 0.145, 0.19, 12]} />
          <meshStandardMaterial color="#151619" roughness={0.7} />
        </mesh>

        {/* Muscular Chest & Upper Torso */}
        <mesh position={[0, 0.26, 0.03]} castShadow>
          <boxGeometry args={[0.36, 0.22, 0.24]} />
          <meshStandardMaterial color="#131417" roughness={0.65} />
        </mesh>

        {/* Official BAJAJ Racing Chest Livery Emblem */}
        <mesh position={[0, 0.27, 0.155]}>
          <planeGeometry args={[0.24, 0.12]} />
          <meshStandardMaterial map={textures.bajajDecal} roughness={0.4} />
        </mesh>

        {/* Ergonomic Molded Spine Guard Backbone Plates */}
        <mesh position={[0, 0.26, -0.09]} castShadow>
          <boxGeometry args={[0.15, 0.25, 0.022]} />
          <meshStandardMaterial map={textures.carbon} roughness={0.4} />
        </mesh>

        {/* Sleek Aerodynamic MotoGP Speed Hump on Upper Back (Tapered Profile) */}
        <group ref={speedHumpRef} position={[0, 0.32, -0.11]}>
          <mesh rotation={[-0.72, 0, 0]} castShadow>
            <cylinderGeometry args={[0.062, 0.092, 0.26, 10]} />
            <meshStandardMaterial color="#101114" roughness={0.4} />
          </mesh>
          {/* Top Aerodynamic Air Foil on Hump */}
          <mesh position={[0, 0.035, -0.02]} rotation={[-0.75, 0, 0]} castShadow>
            <boxGeometry args={[0.095, 0.16, 0.05]} />
            <meshStandardMaterial color={accentColor} roughness={0.3} />
          </mesh>
          {/* Bajaj Racing Badge on Upper Speed Hump */}
          <mesh position={[0, 0.04, -0.06]} rotation={[-0.75, Math.PI, 0]}>
            <planeGeometry args={[0.10, 0.05]} />
            <meshStandardMaterial map={textures.bajajDecal} roughness={0.35} />
          </mesh>
        </group>

        {/* Contoured Carbon-Fiber Shoulder Armor Sliders (Natural shoulder caps, no disco balls!) */}
        <mesh position={[-0.20, 0.32, 0.03]} rotation={[0, 0, 0.24]} castShadow>
          <capsuleGeometry args={[0.044, 0.060, 8, 12]} />
          <meshStandardMaterial map={textures.carbon} roughness={0.35} metalness={0.6} />
        </mesh>
        <mesh position={[0.20, 0.32, 0.03]} rotation={[0, 0, -0.24]} castShadow>
          <capsuleGeometry args={[0.044, 0.060, 8, 12]} />
          <meshStandardMaterial map={textures.carbon} roughness={0.35} metalness={0.6} />
        </mesh>

        {/* Nepal National Flag Emblem on Right Shoulder */}
        <mesh position={[0.19, 0.26, 0.03]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[0.08, 0.08]} />
          <meshStandardMaterial map={textures.nepalBadge} transparent roughness={0.3} />
        </mesh>

        {/* ---------------- LEFT ARM & CLUTCH GLOVE ---------------- */}
        <group ref={leftArmRef} position={[-0.18, 0.30, 0.06]}>
          {/* Bicep / Upper Arm */}
          <mesh position={[-0.05, -0.08, 0.14]} rotation={[0.65, 0.15, -0.22]} castShadow>
            <cylinderGeometry args={[0.052, 0.046, 0.28, 10]} />
            <meshStandardMaterial color={accentColor} roughness={0.5} />
          </mesh>
          {/* Carbon Fiber Elbow Slider */}
          <mesh position={[-0.08, -0.18, 0.24]}>
            <sphereGeometry args={[0.046, 8, 8]} />
            <meshStandardMaterial map={textures.carbon} metalness={0.7} roughness={0.25} />
          </mesh>
          {/* Forearm Angled Forward Toward Handlebar */}
          <mesh position={[-0.08, -0.22, 0.36]} rotation={[0.35, 0.18, -0.10]} castShadow>
            <cylinderGeometry args={[0.046, 0.040, 0.28, 10]} />
            <meshStandardMaterial color="#151619" roughness={0.7} />
          </mesh>
          {/* Full-Gauntlet Racing Glove with Carbon Knuckle Plate */}
          <mesh position={[-0.09, -0.30, 0.50]} rotation={[0.2, 0.15, 0]} castShadow>
            <boxGeometry args={[0.068, 0.062, 0.10]} />
            <meshStandardMaterial color="#0e0f11" roughness={0.4} />
          </mesh>
          <mesh position={[-0.09, -0.272, 0.51]}>
            <boxGeometry args={[0.058, 0.018, 0.055]} />
            <meshStandardMaterial map={textures.carbon} metalness={0.8} roughness={0.2} />
          </mesh>
        </group>

        {/* ---------------- RIGHT ARM & THROTTLE GLOVE ---------------- */}
        <group ref={rightArmRef} position={[0.18, 0.30, 0.06]}>
          {/* Bicep / Upper Arm */}
          <mesh position={[0.05, -0.08, 0.14]} rotation={[0.65, -0.15, 0.22]} castShadow>
            <cylinderGeometry args={[0.052, 0.046, 0.28, 10]} />
            <meshStandardMaterial color={accentColor} roughness={0.5} />
          </mesh>
          {/* Carbon Fiber Elbow Slider */}
          <mesh position={[0.08, -0.18, 0.24]}>
            <sphereGeometry args={[0.046, 8, 8]} />
            <meshStandardMaterial map={textures.carbon} metalness={0.7} roughness={0.25} />
          </mesh>
          {/* Forearm Angled Forward Toward Throttle Grip */}
          <mesh position={[0.08, -0.22, 0.36]} rotation={[0.35, -0.18, 0.10]} castShadow>
            <cylinderGeometry args={[0.046, 0.040, 0.28, 10]} />
            <meshStandardMaterial color="#151619" roughness={0.7} />
          </mesh>
          {/* Dynamic Throttle Wrist (Rolls when accelerating) */}
          <group ref={rightHandRef} position={[0.09, -0.30, 0.50]}>
            <mesh rotation={[0.2, -0.15, 0]} castShadow>
              <boxGeometry args={[0.068, 0.062, 0.10]} />
              <meshStandardMaterial color="#0e0f11" roughness={0.4} />
            </mesh>
            <mesh position={[0, 0.028, 0.01]}>
              <boxGeometry args={[0.058, 0.018, 0.055]} />
              <meshStandardMaterial map={textures.carbon} metalness={0.8} roughness={0.2} />
            </mesh>
          </group>
        </group>

        {/* ---------------- AERODYNAMIC RACING HELMET & VISOR ---------------- */}
        <group ref={headGroup} position={[0, 0.42, 0.06]}>
          {/* Neck / Balaclava */}
          <mesh position={[0, -0.05, 0]} castShadow>
            <cylinderGeometry args={[0.058, 0.070, 0.09, 12]} />
            <meshStandardMaterial color="#111215" roughness={0.9} />
          </mesh>

          {/* Main Helmet Shell — slightly oval (taller than wide) for human head shape */}
          {/* Using a scaled group to squash the sphere into an oval */}
          <group position={[0, 0.095, 0.0]} scale={[1.0, 1.18, 1.05]}>
            <mesh castShadow>
              <sphereGeometry args={[0.136, 24, 20]} />
              <meshStandardMaterial
                map={textures.helmetGraphic}
                color={accentColor}
                roughness={0.20}
                metalness={0.28}
              />
            </mesh>
          </group>

          {/* Chin Bar — full-face guard protects lower half of face */}
          <mesh position={[0, 0.022, 0.118]} rotation={[0.28, 0, 0]} castShadow>
            <boxGeometry args={[0.136, 0.085, 0.108]} />
            <meshStandardMaterial color="#0d0e10" roughness={0.3} />
          </mesh>
          {/* Chin intake mesh strip */}
          <mesh position={[0, 0.016, 0.168]}>
            <boxGeometry args={[0.055, 0.020, 0.010]} />
            <meshStandardMaterial color="#2b2f38" metalness={0.6} roughness={0.4} />
          </mesh>

          {/* Deep Smoke Mirrored Visor — angled for aero look */}
          <mesh position={[0, 0.096, 0.118]} rotation={[0.14, 0, 0]}>
            <cylinderGeometry args={[0.122, 0.122, 0.070, 22, 1, false, -Math.PI * 0.38, Math.PI * 0.76]} />
            <meshStandardMaterial
              color="#070b12"
              emissive="#0d1a28"
              emissiveIntensity={0.4}
              metalness={0.96}
              roughness={0.04}
            />
          </mesh>

          {/* Top Ram-Air Scoops */}
          {[-0.038, 0.038].map((x) => (
            <mesh key={`vent-${x}`} position={[x, 0.178, 0.078]} rotation={[-0.28, 0, 0]}>
              <boxGeometry args={[0.020, 0.012, 0.048]} />
              <meshStandardMaterial color="#0a0b0d" metalness={0.7} roughness={0.2} />
            </mesh>
          ))}

          {/* Rear Kamm-Tail Spoiler */}
          <mesh position={[0, 0.138, -0.088]} rotation={[-0.40, 0, 0]} castShadow>
            <boxGeometry args={[0.102, 0.038, 0.118]} />
            <meshStandardMaterial color="#08090a" roughness={0.2} metalness={0.4} />
          </mesh>

          {/* Visor Side Pivot Ratchets */}
          {[-0.138, 0.138].map((x) => (
            <group key={`pivot-${x}`} position={[x, 0.090, 0.028]} rotation={[0, Math.PI / 2, 0]}>
              <mesh>
                <cylinderGeometry args={[0.020, 0.020, 0.009, 10]} />
                <meshStandardMaterial map={textures.carbon} metalness={0.8} roughness={0.2} />
              </mesh>
            </group>
          ))}
        </group>
      </group>
    </group>
  );
}
