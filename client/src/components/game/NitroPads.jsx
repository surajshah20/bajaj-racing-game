import React from 'react';

export default function NitroPads({ pads }) {
  return (
    <>
      {pads.map((pad, i) => (
        <group key={i} position={[pad.x, 0.02, pad.z]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[2, 4]} />
            <meshBasicMaterial color="#00ffff" transparent opacity={0.6} />
          </mesh>
          <mesh position={[0, 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
          </mesh>
        </group>
      ))}
    </>
  );
}