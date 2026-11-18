import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { STATIC_MEGA_RAMPS } from '../../utils/stuntConfig';

/**
 * 3D Roblox Stunt Mega-Ramp with glowing animated chevron arrows
 * and mid-air floating Neon Dashain Gold Rings
 */
export default function MegaRamps({ ramps = STATIC_MEGA_RAMPS }) {
  const ringsGroup = useRef();
  const arrowsGroup = useRef();

  useFrame(({ clock }) => {
    const elapsed = clock.elapsedTime;

    // Rotate mid-air floating neon rings
    if (ringsGroup.current) {
      ringsGroup.current.children.forEach((child, i) => {
        child.rotation.y = elapsed * 2.2 + i;
        child.rotation.z = Math.sin(elapsed * 2.5 + i) * 0.15;
      });
    }

    // Pulse chevron neon glow
    if (arrowsGroup.current) {
      const pulse = 2.0 + Math.sin(elapsed * 8) * 1.2;
      arrowsGroup.current.children.forEach((arrow) => {
        if (arrow.material) arrow.material.emissiveIntensity = pulse;
      });
    }
  });

  return (
    <group>
      {/* 1. STUNT MEGA-RAMPS */}
      {ramps.map((ramp) => (
        <group key={ramp.id} position={[ramp.x, ramp.y, ramp.z]} rotation={[0, ramp.rotY, 0]}>
          {/* Main Angled Ramp Surface (Wedge) */}
          <group position={[0, 0.75, 0]} rotation={[-0.32, 0, 0]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[3.8, 0.28, 6.2]} />
              <meshStandardMaterial color="#1a1c23" metalness={0.7} roughness={0.3} />
            </mesh>

            {/* High-visibility yellow & black safety hazard stripes on ramp lip */}
            <mesh position={[0, 0.16, 2.9]}>
              <boxGeometry args={[3.8, 0.08, 0.4]} />
              <meshStandardMaterial color="#f7b500" emissive="#ffaa00" emissiveIntensity={1.2} />
            </mesh>

            {/* Glowing Roblox Neon Chevron Arrow Marks (>>>) */}
            {[-1.6, 0, 1.6].map((z, i) => (
              <mesh key={i} position={[0, 0.16, z]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[2.2, 0.7]} />
                <meshStandardMaterial
                  color="#00e5ff"
                  emissive="#00e5ff"
                  emissiveIntensity={3.5}
                  transparent
                  opacity={0.92}
                />
              </mesh>
            ))}
          </group>

          {/* Steel Ramp Frame Side Supports */}
          {[-1.95, 1.95].map((x) => (
            <group key={x}>
              <mesh position={[x, 0.8, -1.2]} castShadow>
                <boxGeometry args={[0.15, 1.6, 3.6]} />
                <meshStandardMaterial color="#3b4252" metalness={0.8} />
              </mesh>
              {/* Neon edge strip */}
              <mesh position={[x, 1.65, -0.6]} rotation={[-0.32, 0, 0]}>
                <boxGeometry args={[0.08, 0.12, 6.2]} />
                <meshStandardMaterial color="#00e5ff" emissive="#00e5ff" emissiveIntensity={4} />
              </mesh>
            </group>
          ))}
        </group>
      ))}

      {/* 2. FLOATING MID-AIR NEON GOLDEN DASHAIN RINGS */}
      <group ref={ringsGroup}>
        {ramps.map((ramp) => {
          if (ramp.ring.collected) return null;
          return (
            <group
              key={ramp.ring.id}
              position={[ramp.ring.x, ramp.ring.y, ramp.ring.z]}
              rotation={[0, ramp.ring.rotY, 0]}
            >
              {/* Main Golden Neon Torus */}
              <mesh>
                <torusGeometry args={[2.4, 0.22, 16, 32]} />
                <meshStandardMaterial
                  color="#f7b500"
                  emissive="#ffaa00"
                  emissiveIntensity={3.8}
                  metalness={0.9}
                  roughness={0.15}
                />
              </mesh>

              {/* Inner Glowing Star Core */}
              <mesh rotation={[0, 0, Math.PI / 4]}>
                <octahedronGeometry args={[0.75, 0]} />
                <meshStandardMaterial
                  color="#00e5ff"
                  emissive="#00e5ff"
                  emissiveIntensity={4.5}
                />
              </mesh>
            </group>
          );
        })}
      </group>
    </group>
  );
}
