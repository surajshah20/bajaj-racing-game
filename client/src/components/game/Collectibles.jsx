import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

/**
 * 3D Rotating Dashain Golden Coins & Festive Tokens along Kathmandu Ring Road
 */
export default function Collectibles({ items = [] }) {
  const coinsRef = useRef([]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime * 3.5;
    coinsRef.current.forEach((coin, i) => {
      if (coin) {
        coin.rotation.y = t + i * 0.4;
        coin.position.y = (items[i]?.y || 0) + 0.6 + Math.sin(t * 1.5 + i) * 0.12;
      }
    });
  });

  return (
    <group>
      {items.map((item, i) => {
        if (item.collected) return null;
        return (
          <group
            key={i}
            ref={(el) => (coinsRef.current[i] = el)}
            position={[item.x, (item.y || 0) + 0.6, item.z]}
            rotation={[0, item.rotation || 0, 0]}
          >
            {/* Outer Golden Coin */}
            <mesh castShadow receiveShadow>
              <cylinderGeometry args={[0.55, 0.55, 0.08, 16]} />
              <meshStandardMaterial
                color="#f7b500"
                metalness={0.88}
                roughness={0.2}
                emissive="#d48b00"
                emissiveIntensity={0.35}
              />
            </mesh>

            {/* Inner Red Dashain / Bajaj Emblem Core */}
            <mesh position={[0, 0, 0]}>
              <cylinderGeometry args={[0.38, 0.38, 0.09, 12]} />
              <meshStandardMaterial
                color="#e31c25"
                metalness={0.4}
                roughness={0.4}
                emissive="#990000"
                emissiveIntensity={0.5}
              />
            </mesh>

            {/* Pulsing Aura Ring */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.65, 0.72, 16]} />
              <meshBasicMaterial color="#ffe066" transparent opacity={0.6} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
