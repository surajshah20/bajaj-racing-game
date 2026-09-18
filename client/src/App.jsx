import { Canvas } from '@react-three/fiber';
import { Sky, OrbitControls } from '@react-three/drei';

// A simple flat plane representing the road
function Track() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
      <planeGeometry args={[10, 100]} />
      <meshStandardMaterial color="#333333" />
    </mesh>
  );
}

// A placeholder box representing the Bajaj motorcycle
function PlayerBike() {
  return (
    <mesh position={[0, 0, 5]}>
      <boxGeometry args={[1, 1, 2]} />
      <meshStandardMaterial color="#ff0000" />
    </mesh>
  );
}

export default function App() {
  return (
    // The canvas must take up the full screen for mobile optimization
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden' }}>
      <Canvas camera={{ position: [0, 5, 15], fov: 50 }}>
        {/* Basic lighting for the 3D environment */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        
        {/* Dashain/Nepal sky environment placeholder */}
        <Sky sunPosition={[100, 20, 100]} />
        
        <Track />
        <PlayerBike />
        
        {/* Allows you to drag the mouse to look around temporarily */}
        <OrbitControls />
      </Canvas>
    </div>
  );
}