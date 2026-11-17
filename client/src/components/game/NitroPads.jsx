import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

/**
 * High-Speed Nitro Boost Pads aligned with Kathmandu Ring Road curvature
 */
export default function NitroPads({ pads }) {
  const chevronRef = useRef([]);

  useFrame(({ clock }) => {
    const pulse = 0.5 + Math.sin(clock.elapsedTime * 6) * 0.3;
    chevronRef.current.forEach((mesh) => {
      if (mesh) mesh.material.opacity = pulse;
    });
  });

  return (
    <group>
      {pads.map((pad, i) => (
        <group
          key={i}
          position={[pad.x, (pad.y || 0) + 0.03, pad.z]}
          rotation={[0, pad.rotation || 0, 0]}
        >
          {/* Base Pad Strip */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[2.8, 5.5]} />
            <meshBasicMaterial color="#00e5ff" transparent opacity={0.4} />
          </mesh>

          {/* Border Outline */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
            <ringGeometry args={[1.3, 1.45, 4]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
          </mesh>

          {/* Forward Chevrons (>>>) */}
          {[-1.5, 0, 1.5].map((zOffset, idx) => (
            <mesh
              key={idx}
              ref={(el) => (chevronRef.current[i * 3 + idx] = el)}
              position={[0, 0.01, zOffset]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <planeGeometry args={[1.8, 0.7]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}
