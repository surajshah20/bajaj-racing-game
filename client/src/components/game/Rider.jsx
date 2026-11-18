import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Realistic 3D Motorcycle Racer (Rider) with Professional Racing Leathers & Aerodynamic Helmet
 * Features realistic human anatomical proportions, aerodynamic speed hump, knee sliders,
 * dynamic body hang-off, and forward racing tuck posture.
 */
export default function Rider({ bikeStateRef, accentColor = '#e31c25', ...groupProps }) {
  const spineGroup = useRef();
  const headGroup = useRef();
  const leftLegRef = useRef();
  const rightLegRef = useRef();
  const leftArmRef = useRef();
  const rightArmRef = useRef();

  useFrame((_, delta) => {
    if (!spineGroup.current || !bikeStateRef?.current) return;

    const {
      lean = 0,
      isAccelerating = false,
      isBraking = false,
      speedRatio = 0,
      isWheelie = false,
    } = bikeStateRef.current;

    // 1. Aerodynamic Tuck & Braking Sit-up (Forward pitch down over fuel tank)
    let targetTuck = 0.32 + speedRatio * 0.16;
    if (isAccelerating) targetTuck += 0.14; // Tight aero tuck under full throttle
    if (isBraking) targetTuck = 0.12;      // Sit up tall to catch wind and brace arms
    if (isWheelie) targetTuck = -0.16;     // Lean backward and pull handlebars up during wheelie!

    // 2. Lateral Body Shift (Hanging off the bike into the apex of the turn)
    // Note: Rider is rotated Math.PI around Y, so signs invert for world space alignment
    const targetBodyRoll = -lean * 0.72;
    const targetBodyShiftX = -lean * 0.22;

    spineGroup.current.rotation.x = THREE.MathUtils.lerp(spineGroup.current.rotation.x, targetTuck, delta * 12);
    spineGroup.current.rotation.z = THREE.MathUtils.lerp(spineGroup.current.rotation.z, targetBodyRoll, delta * 14);
    spineGroup.current.position.x = THREE.MathUtils.lerp(spineGroup.current.position.x, targetBodyShiftX, delta * 12);

    // 3. Head Tracking (Rider looks up through the visor and spots the corner exit)
    if (headGroup.current) {
      const targetHeadYaw = -lean * 0.55;
      const targetHeadPitch = -targetTuck * 0.78;
      headGroup.current.rotation.y = THREE.MathUtils.lerp(headGroup.current.rotation.y, targetHeadYaw, delta * 14);
      headGroup.current.rotation.x = THREE.MathUtils.lerp(headGroup.current.rotation.x, targetHeadPitch, delta * 12);
    }

    // 4. Knee Out (Knee Slider tarmac skim)
    if (leftLegRef.current && rightLegRef.current) {
      const leftKneeOut = lean > 0.05 ? lean * 0.6 : 0;
      const rightKneeOut = lean < -0.05 ? -lean * 0.6 : 0;
      leftLegRef.current.rotation.z = THREE.MathUtils.lerp(leftLegRef.current.rotation.z, -0.18 - leftKneeOut, delta * 12);
      rightLegRef.current.rotation.z = THREE.MathUtils.lerp(rightLegRef.current.rotation.z, 0.18 + rightKneeOut, delta * 12);
    }
  });

  return (
    <group {...groupProps}>
      {/* LOWER BODY: Hips & Pelvis seated on the motorcycle saddle */}
      <group position={[0, 0, 0]}>
        {/* Contoured Riding Pants Seat */}
        <mesh position={[0, 0.05, -0.02]} castShadow receiveShadow>
          <boxGeometry args={[0.32, 0.16, 0.30]} />
          <meshStandardMaterial color="#141518" roughness={0.75} />
        </mesh>
        {/* Rear Saddle Pad & Tail Protection */}
        <mesh position={[0, 0.12, -0.14]} rotation={[-0.4, 0, 0]} castShadow>
          <boxGeometry args={[0.26, 0.10, 0.12]} />
          <meshStandardMaterial color="#1a1b1f" roughness={0.65} />
        </mesh>

        {/* LEFT LEG: Thigh, Knee Slider, Shin Guard & Racing Boot */}
        <group ref={leftLegRef} position={[-0.15, 0.02, 0.02]} rotation={[0.48, 0.08, -0.18]}>
          {/* Upper Thigh hugging the fuel tank */}
          <mesh position={[0, -0.19, 0.14]} rotation={[-0.72, 0, 0]} castShadow>
            <cylinderGeometry args={[0.078, 0.068, 0.38, 12]} />
            <meshStandardMaterial color="#18191c" roughness={0.65} />
          </mesh>
          {/* Accent Racing Stripe on Thigh */}
          <mesh position={[-0.04, -0.19, 0.15]} rotation={[-0.72, 0, 0]}>
            <boxGeometry args={[0.015, 0.32, 0.06]} />
            <meshStandardMaterial color={accentColor} roughness={0.4} />
          </mesh>

          {/* Hard Dual-Compound Knee Slider (Puck) */}
          <mesh position={[-0.075, -0.32, 0.30]} rotation={[0, -0.2, 0]} castShadow>
            <boxGeometry args={[0.045, 0.09, 0.10]} />
            <meshStandardMaterial color="#ffffff" roughness={0.3} />
          </mesh>
          <mesh position={[-0.06, -0.32, 0.28]}>
            <cylinderGeometry args={[0.06, 0.06, 0.07, 10]} />
            <meshStandardMaterial color="#222327" roughness={0.8} />
          </mesh>

          {/* Calf / Shin Guard with Accordion Flex Zone */}
          <mesh position={[0, -0.38, 0.11]} rotation={[0.68, 0, 0]} castShadow>
            <cylinderGeometry args={[0.064, 0.055, 0.34, 10]} />
            <meshStandardMaterial color="#16171a" roughness={0.7} />
          </mesh>

          {/* High-Top Microfiber Racing Boot on Footpeg */}
          <mesh position={[0, -0.49, -0.04]} rotation={[0.08, 0, 0]} castShadow>
            <boxGeometry args={[0.082, 0.095, 0.20]} />
            <meshStandardMaterial color="#111215" roughness={0.4} />
          </mesh>
          {/* Magnesium Toe Slider on outer boot */}
          <mesh position={[-0.045, -0.52, 0.03]} rotation={[0, 0.2, 0]}>
            <boxGeometry args={[0.02, 0.035, 0.08]} />
            <meshStandardMaterial color="#d0d5dd" metalness={0.85} roughness={0.2} />
          </mesh>
        </group>

        {/* RIGHT LEG: Thigh, Knee Slider, Shin Guard & Racing Boot */}
        <group ref={rightLegRef} position={[0.15, 0.02, 0.02]} rotation={[0.48, -0.08, 0.18]}>
          {/* Upper Thigh hugging the fuel tank */}
          <mesh position={[0, -0.19, 0.14]} rotation={[-0.72, 0, 0]} castShadow>
            <cylinderGeometry args={[0.078, 0.068, 0.38, 12]} />
            <meshStandardMaterial color="#18191c" roughness={0.65} />
          </mesh>
          {/* Accent Racing Stripe on Thigh */}
          <mesh position={[0.04, -0.19, 0.15]} rotation={[-0.72, 0, 0]}>
            <boxGeometry args={[0.015, 0.32, 0.06]} />
            <meshStandardMaterial color={accentColor} roughness={0.4} />
          </mesh>

          {/* Hard Dual-Compound Knee Slider (Puck) */}
          <mesh position={[0.075, -0.32, 0.30]} rotation={[0, 0.2, 0]} castShadow>
            <boxGeometry args={[0.045, 0.09, 0.10]} />
            <meshStandardMaterial color="#ffffff" roughness={0.3} />
          </mesh>
          <mesh position={[0.06, -0.32, 0.28]}>
            <cylinderGeometry args={[0.06, 0.06, 0.07, 10]} />
            <meshStandardMaterial color="#222327" roughness={0.8} />
          </mesh>

          {/* Calf / Shin Guard with Accordion Flex Zone */}
          <mesh position={[0, -0.38, 0.11]} rotation={[0.68, 0, 0]} castShadow>
            <cylinderGeometry args={[0.064, 0.055, 0.34, 10]} />
            <meshStandardMaterial color="#16171a" roughness={0.7} />
          </mesh>

          {/* High-Top Microfiber Racing Boot on Footpeg */}
          <mesh position={[0, -0.49, -0.04]} rotation={[0.08, 0, 0]} castShadow>
            <boxGeometry args={[0.082, 0.095, 0.20]} />
            <meshStandardMaterial color="#111215" roughness={0.4} />
          </mesh>
          {/* Magnesium Toe Slider on outer boot */}
          <mesh position={[0.045, -0.52, 0.03]} rotation={[0, -0.2, 0]}>
            <boxGeometry args={[0.02, 0.035, 0.08]} />
            <meshStandardMaterial color="#d0d5dd" metalness={0.85} roughness={0.2} />
          </mesh>
        </group>
      </group>

      {/* UPPER BODY: Contoured Leather Torso, Aerodynamic Speed Hump, Arms & Helmet */}
      <group ref={spineGroup} position={[0, 0.10, 0]}>
        {/* Lower Torso / Lumbar */}
        <mesh position={[0, 0.12, 0.02]} castShadow>
          <cylinderGeometry args={[0.17, 0.15, 0.20, 14]} />
          <meshStandardMaterial color="#18191d" roughness={0.65} />
        </mesh>

        {/* Muscular Chest & Upper Torso */}
        <mesh position={[0, 0.28, 0.04]} castShadow>
          <boxGeometry args={[0.38, 0.24, 0.26]} />
          <meshStandardMaterial color="#16171b" roughness={0.6} />
        </mesh>

        {/* Racing Livery Accent Vest / Chest Inset */}
        <mesh position={[0, 0.28, 0.175]}>
          <boxGeometry args={[0.26, 0.22, 0.02]} />
          <meshStandardMaterial color={accentColor} roughness={0.35} />
        </mesh>
        {/* Back Spine Protector Plate */}
        <mesh position={[0, 0.28, -0.095]} castShadow>
          <boxGeometry args={[0.18, 0.26, 0.02]} />
          <meshStandardMaterial color="#0c0d0f" roughness={0.4} />
        </mesh>

        {/* Aerodynamic Speed Hump on Upper Back (MotoGP style) */}
        <mesh position={[0, 0.36, -0.15]} rotation={[-0.42, 0, 0]} castShadow>
          <boxGeometry args={[0.16, 0.22, 0.10]} />
          <meshStandardMaterial color="#111214" roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.44, -0.18]} rotation={[-0.55, 0, 0]} castShadow>
          <boxGeometry args={[0.12, 0.12, 0.08]} />
          <meshStandardMaterial color={accentColor} roughness={0.3} />
        </mesh>

        {/* Ergonomic Molded Titanium Shoulder Armor Sliders */}
        <mesh position={[-0.22, 0.36, 0.04]} rotation={[0, 0, 0.3]} castShadow>
          <sphereGeometry args={[0.078, 12, 10]} />
          <meshStandardMaterial color="#e0e4ec" metalness={0.88} roughness={0.18} />
        </mesh>
        <mesh position={[0.22, 0.36, 0.04]} rotation={[0, 0, -0.3]} castShadow>
          <sphereGeometry args={[0.078, 12, 10]} />
          <meshStandardMaterial color="#e0e4ec" metalness={0.88} roughness={0.18} />
        </mesh>

        {/* LEFT ARM: Bicep, Elbow Slider, Forearm & Gauntlet Glove on Handlebar */}
        <group ref={leftArmRef} position={[-0.20, 0.34, 0.08]}>
          {/* Upper Arm / Bicep */}
          <mesh position={[-0.07, -0.11, 0.14]} rotation={[0.78, 0.18, -0.28]} castShadow>
            <cylinderGeometry args={[0.058, 0.052, 0.30, 10]} />
            <meshStandardMaterial color={accentColor} roughness={0.5} />
          </mesh>
          {/* Molded TPU Elbow Slider */}
          <mesh position={[-0.11, -0.22, 0.26]}>
            <sphereGeometry args={[0.052, 8, 8]} />
            <meshStandardMaterial color="#d0d5dd" metalness={0.8} roughness={0.25} />
          </mesh>
          {/* Forearm angled down toward clip-on */}
          <mesh position={[-0.10, -0.24, 0.38]} rotation={[0.42, 0.22, -0.12]} castShadow>
            <cylinderGeometry args={[0.052, 0.046, 0.28, 10]} />
            <meshStandardMaterial color="#1a1b1f" roughness={0.65} />
          </mesh>
          {/* Full-Gauntlet Racing Glove gripping the handlebar */}
          <mesh position={[-0.12, -0.32, 0.52]} rotation={[0.2, 0.15, 0]} castShadow>
            <boxGeometry args={[0.075, 0.07, 0.11]} />
            <meshStandardMaterial color="#111215" roughness={0.4} />
          </mesh>
          {/* Carbon Fiber Knuckle Protector */}
          <mesh position={[-0.12, -0.29, 0.53]}>
            <boxGeometry args={[0.065, 0.02, 0.06]} />
            <meshStandardMaterial color="#2b2d33" metalness={0.6} roughness={0.3} />
          </mesh>
        </group>

        {/* RIGHT ARM: Bicep, Elbow Slider, Forearm & Gauntlet Glove on Handlebar */}
        <group ref={rightArmRef} position={[0.20, 0.34, 0.08]}>
          {/* Upper Arm / Bicep */}
          <mesh position={[0.07, -0.11, 0.14]} rotation={[0.78, -0.18, 0.28]} castShadow>
            <cylinderGeometry args={[0.058, 0.052, 0.30, 10]} />
            <meshStandardMaterial color={accentColor} roughness={0.5} />
          </mesh>
          {/* Molded TPU Elbow Slider */}
          <mesh position={[0.11, -0.22, 0.26]}>
            <sphereGeometry args={[0.052, 8, 8]} />
            <meshStandardMaterial color="#d0d5dd" metalness={0.8} roughness={0.25} />
          </mesh>
          {/* Forearm angled down toward clip-on */}
          <mesh position={[0.10, -0.24, 0.38]} rotation={[0.42, -0.22, 0.12]} castShadow>
            <cylinderGeometry args={[0.052, 0.046, 0.28, 10]} />
            <meshStandardMaterial color="#1a1b1f" roughness={0.65} />
          </mesh>
          {/* Full-Gauntlet Racing Glove gripping the throttle */}
          <mesh position={[0.12, -0.32, 0.52]} rotation={[0.2, -0.15, 0]} castShadow>
            <boxGeometry args={[0.075, 0.07, 0.11]} />
            <meshStandardMaterial color="#111215" roughness={0.4} />
          </mesh>
          {/* Carbon Fiber Knuckle Protector */}
          <mesh position={[0.12, -0.29, 0.53]}>
            <boxGeometry args={[0.065, 0.02, 0.06]} />
            <meshStandardMaterial color="#2b2d33" metalness={0.6} roughness={0.3} />
          </mesh>
        </group>

        {/* NECK & AERODYNAMIC FULL-FACE RACING HELMET */}
        <group ref={headGroup} position={[0, 0.46, 0.08]}>
          {/* Padded Neck Roll & Collar Gasket */}
          <mesh position={[0, -0.04, 0]} castShadow>
            <cylinderGeometry args={[0.068, 0.082, 0.09, 12]} />
            <meshStandardMaterial color="#141517" roughness={0.85} />
          </mesh>

          {/* Main Aerodynamic Helmet Shell (Tapered Egg Form) */}
          <mesh position={[0, 0.11, 0.01]} castShadow>
            <sphereGeometry args={[0.172, 24, 20]} />
            <meshStandardMaterial color={accentColor} roughness={0.22} metalness={0.3} />
          </mesh>

          {/* Chin Bar Guard & Mouth Intake Vent */}
          <mesh position={[0, 0.04, 0.14]} rotation={[0.22, 0, 0]} castShadow>
            <boxGeometry args={[0.15, 0.10, 0.12]} />
            <meshStandardMaterial color="#111215" roughness={0.35} />
          </mesh>
          <mesh position={[0, 0.03, 0.205]}>
            <boxGeometry args={[0.06, 0.025, 0.01]} />
            <meshStandardMaterial color="#333742" roughness={0.5} />
          </mesh>

          {/* Rear Aerodynamic Kamm-Tail Diffuser / Spoiler */}
          <mesh position={[0, 0.16, -0.10]} rotation={[-0.45, 0, 0]} castShadow>
            <boxGeometry args={[0.12, 0.05, 0.15]} />
            <meshStandardMaterial color="#0b0c0e" roughness={0.2} metalness={0.4} />
          </mesh>

          {/* Reflective Dark Smoke / Iridium Curved Visor Shield */}
          <mesh position={[0, 0.12, 0.142]} rotation={[0.12, 0, 0]}>
            <cylinderGeometry args={[0.152, 0.152, 0.085, 20, 1, false, -Math.PI * 0.38, Math.PI * 0.76]} />
            <meshStandardMaterial
              color="#090d14"
              emissive="#102542"
              emissiveIntensity={0.35}
              metalness={0.96}
              roughness={0.06}
            />
          </mesh>

          {/* Visor Pivot Mechanism Plates on Temples */}
          <mesh position={[-0.165, 0.11, 0.04]} rotation={[0, Math.PI / 2, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 0.01, 10]} />
            <meshStandardMaterial color="#1f232b" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[0.165, 0.11, 0.04]} rotation={[0, Math.PI / 2, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 0.01, 10]} />
            <meshStandardMaterial color="#1f232b" metalness={0.7} roughness={0.3} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
