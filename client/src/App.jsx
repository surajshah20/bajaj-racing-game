import { Canvas, useFrame } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import { useRef } from 'react';

// The track is extended to give room to drive
// Replace the existing Track function with this updated version
function Track() {
  return (
    // Center the track at z = -500 to keep it ahead of the starting line
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, -500]}>
      {/* Increase the track length from 200 to 1000 */}
      <planeGeometry args={[10, 1000]} />
      <meshStandardMaterial color="#333333" />
    </mesh>
  );
}

// The Player component contains the animation logic
function PlayerBike() {
  const bikeRef = useRef();

  useFrame((state, delta) => {
    // 1. Move the bike forward automatically
    const speed = 10;
    bikeRef.current.position.z -= speed * delta;

    // 2. Make the camera follow behind the bike
    state.camera.position.x = bikeRef.current.position.x;
    state.camera.position.y = bikeRef.current.position.y + 5;
    state.camera.position.z = bikeRef.current.position.z + 10;
    
    // 3. Keep the camera looking at the bike
    state.camera.lookAt(bikeRef.current.position);
  });

  return (
    <mesh ref={bikeRef} position={[0, 0, 0]}>
      <boxGeometry args={[1, 1, 2]} />
      <meshStandardMaterial color="#ff0000" />
    </mesh>
  );
}

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden' }}>
      <Canvas>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Sky sunPosition={[100, 20, 100]} />
        
        <Track />
        <PlayerBike />
      </Canvas>
    </div>
  );
}