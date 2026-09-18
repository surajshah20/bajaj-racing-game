import { Canvas, useFrame } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import { useRef, useMemo, useState } from 'react';

const inputState = { left: false, right: false };
const FINISH_LINE_Z = -900; // Define where the race ends

function Track() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, -500]}>
      <planeGeometry args={[10, 1000]} />
      <meshStandardMaterial color="#333333" />
    </mesh>
  );
}

function FinishLine() {
  return (
    // A white strip placed flat on the road near the end
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.4, FINISH_LINE_Z]}>
      <planeGeometry args={[10, 5]} />
      <meshStandardMaterial color="#ffffff" />
    </mesh>
  );
}

function Obstacles() {
  const obstacles = useMemo(() => {
    return Array.from({ length: 50 }).map(() => ({
      x: (Math.random() - 0.5) * 8,
      z: -(Math.random() * 850) - 20, // Keep obstacles before the finish line
    }));
  }, []);

  return (
    <>
      {obstacles.map((obs, i) => (
        <mesh key={i} position={[obs.x, 0, obs.z]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#ffcc00" />
        </mesh>
      ))}
    </>
  );
}

function PlayerBike({ setFinished }) {
  const bikeRef = useRef();

  useFrame((state, delta) => {
    // 1. Check if we crossed the finish line
    if (bikeRef.current.position.z <= FINISH_LINE_Z) {
      setFinished(true); // Trigger the UI overlay
      return; // Stop the animation loop from moving the bike further
    }

    const forwardSpeed = 30; // Increased speed slightly to reach the end faster for testing
    const turnSpeed = 15;
    const trackBoundary = 4; 

    bikeRef.current.position.z -= forwardSpeed * delta;

    if (inputState.left && bikeRef.current.position.x > -trackBoundary) {
      bikeRef.current.position.x -= turnSpeed * delta;
    }
    if (inputState.right && bikeRef.current.position.x < trackBoundary) {
      bikeRef.current.position.x += turnSpeed * delta;
    }

    state.camera.position.x = bikeRef.current.position.x;
    state.camera.position.y = bikeRef.current.position.y + 5;
    state.camera.position.z = bikeRef.current.position.z + 10;
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
  const [finished, setFinished] = useState(false);

  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden', position: 'relative' }}>
      <Canvas>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Sky sunPosition={[100, 20, 100]} />
        <Track />
        <FinishLine />
        <Obstacles />
        <PlayerBike setFinished={setFinished} />
      </Canvas>

      {/* Touch Controls - Hide them if the game is finished */}
      {!finished && (
        <div style={{ 
          position: 'absolute', bottom: '30px', left: '0', width: '100%', 
          display: 'flex', justifyContent: 'space-between', padding: '0 30px', boxSizing: 'border-box' 
        }}>
          <button 
            onPointerDown={() => inputState.left = true} 
            onPointerUp={() => inputState.left = false}
            onPointerLeave={() => inputState.left = false}
            style={{ padding: '20px 40px', fontSize: '18px', fontWeight: 'bold', borderRadius: '10px', opacity: 0.8 }}
          >
            LEFT
          </button>
          <button 
            onPointerDown={() => inputState.right = true} 
            onPointerUp={() => inputState.right = false}
            onPointerLeave={() => inputState.right = false}
            style={{ padding: '20px 40px', fontSize: '18px', fontWeight: 'bold', borderRadius: '10px', opacity: 0.8 }}
          >
            RIGHT
          </button>
        </div>
      )}

      {/* Finish Screen Overlay */}
      {finished && (
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.7)', color: 'white',
          display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'
        }}>
          <h1 style={{ fontSize: '48px', margin: '0 0 20px 0' }}>RACE FINISHED!</h1>
          <button 
            onClick={() => window.location.reload()} 
            style={{ padding: '15px 30px', fontSize: '20px', cursor: 'pointer', borderRadius: '8px' }}
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}