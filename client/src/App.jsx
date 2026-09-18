import { Canvas, useFrame } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import { useRef, useMemo, useState } from 'react';

const inputState = { left: false, right: false };
const FINISH_LINE_Z = -900;

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
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.4, FINISH_LINE_Z]}>
      <planeGeometry args={[10, 5]} />
      <meshStandardMaterial color="#ffffff" />
    </mesh>
  );
}

function Obstacles({ obstacles }) {
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

function PlayerBike({ setFinished, obstacles, setScore }) {
  const bikeRef = useRef();
  // Keep track of which obstacles we have already hit to avoid penalizing every frame
  const hitObstacles = useRef(new Set()); 

  useFrame((state, delta) => {
    if (bikeRef.current.position.z <= FINISH_LINE_Z) {
      setFinished(true);
      return;
    }

    const forwardSpeed = 30;
    const turnSpeed = 15;
    const trackBoundary = 4;

    bikeRef.current.position.z -= forwardSpeed * delta;

    if (inputState.left && bikeRef.current.position.x > -trackBoundary) {
      bikeRef.current.position.x -= turnSpeed * delta;
    }
    if (inputState.right && bikeRef.current.position.x < trackBoundary) {
      bikeRef.current.position.x += turnSpeed * delta;
    }

    // Collision Detection
    obstacles.forEach((obs, index) => {
      if (!hitObstacles.current.has(index)) {
        // Simple distance check (AABB bounding box approximation)
        const dx = Math.abs(bikeRef.current.position.x - obs.x);
        const dz = Math.abs(bikeRef.current.position.z - obs.z);
        
        if (dx < 1 && dz < 1.5) {
          hitObstacles.current.add(index);
          // Apply collision penalty (-500)
setScore((prev) => Math.max(0, prev - 500));
        }
      }
    });

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
  // Base score of 5000 as per the project plan
  const [score, setScore] = useState(5000); 

  // Generate obstacles at the App level so both components can use them
  const obstacles = useMemo(() => {
    return Array.from({ length: 50 }).map(() => ({
      x: (Math.random() - 0.5) * 8,
      z: -(Math.random() * 850) - 20,
    }));
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden', position: 'relative' }}>
      
      {/* Live Score Display */}
      <div style={{ position: 'absolute', top: '20px', left: '20px', color: 'white', zIndex: 10, fontSize: '24px', fontWeight: 'bold' }}>
        Score: {score}
      </div>

      <Canvas>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Sky sunPosition={[100, 20, 100]} />
        <Track />
        <FinishLine />
        <Obstacles obstacles={obstacles} />
        <PlayerBike setFinished={setFinished} obstacles={obstacles} setScore={setScore} />
      </Canvas>

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

      {finished && (
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.8)', color: 'white',
          display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', zIndex: 20
        }}>
          <h1 style={{ fontSize: '48px', margin: '0 0 10px 0' }}>RACE FINISHED!</h1>
          <h2 style={{ fontSize: '32px', color: '#ffcc00', margin: '0 0 30px 0' }}>Final Score: {score}</h2>
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