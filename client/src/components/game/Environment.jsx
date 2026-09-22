import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { trackCurve } from '../../utils/trackPath';

const FINISH_LINE_Z = -1200;

export function Himalayas() {
  const peaks = useMemo(() => {
    return Array.from({ length: 18 }).map((_, i) => ({
      x: (i - 9) * 35, z: -1350, height: 70 + Math.sin(i * 1.7) * 30, radius: 30 + (i % 3) * 8
    }));
  }, []);
  return (
    <group>
      {peaks.map((p, i) => (
        <mesh key={i} position={[p.x, p.height / 2 - 10, p.z]}>
          <coneGeometry args={[p.radius, p.height, 5]} />
          <meshStandardMaterial color="#f0f4f8" roughness={0.9} flatShading />
        </mesh>
      ))}
    </group>
  );
}

export function LingePing({ position, rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation} scale={1.2}>
      <mesh position={[-1.2, 3.5, -1.2]} rotation={[0.2, 0, -0.2]}><cylinderGeometry args={[0.08, 0.1, 8, 8]} /><meshStandardMaterial color="#b5944d" /></mesh>
      <mesh position={[1.2, 3.5, -1.2]} rotation={[0.2, 0, 0.2]}><cylinderGeometry args={[0.08, 0.1, 8, 8]} /><meshStandardMaterial color="#b5944d" /></mesh>
      <mesh position={[-1.2, 3.5, 1.2]} rotation={[-0.2, 0, -0.2]}><cylinderGeometry args={[0.08, 0.1, 8, 8]} /><meshStandardMaterial color="#b5944d" /></mesh>
      <mesh position={[1.2, 3.5, 1.2]} rotation={[-0.2, 0, 0.2]}><cylinderGeometry args={[0.08, 0.1, 8, 8]} /><meshStandardMaterial color="#b5944d" /></mesh>
      <mesh position={[0, 7, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.12, 0.12, 2.8]} /><meshStandardMaterial color="#8c6a2b" /></mesh>
      <mesh position={[0, 2.5, 0]}><boxGeometry args={[0.8, 0.08, 0.4]} /><meshStandardMaterial color="#593b13" /></mesh>
    </group>
  );
}

export function Track() {
  const trackGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const points = [];
    const steps = 300;
    const width = 8;
   
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const pt = trackCurve.getPointAt(t);
      const tangent = trackCurve.getTangentAt(t);
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
     
      points.push(pt.x + normal.x * width, 0, pt.z + normal.z * width);
      points.push(pt.x - normal.x * width, 0, pt.z - normal.z * width);
    }
   
    const indices = [];
    for (let i = 0; i < steps; i++) {
      const idx = i * 2;
      indices.push(idx, idx + 1, idx + 2);
      indices.push(idx + 2, idx + 1, idx + 3);
    }
   
    geo.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <group>
      {/* Massive Ground Plane to replace the white void */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]}>
        <planeGeometry args={[3000, 3000]} />
        <meshStandardMaterial color="#2E5C31" />
      </mesh>
      
      {/* Asphalt Track */}
      <mesh position={[0, -0.01, 0]} geometry={trackGeo}>
        <meshStandardMaterial color="#333333" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export function DashainArch({ zPosition }) {
  const colors = ['#0033cc', '#ffffff', '#e31c25', '#009900', '#ffcc00'];
  return (
    <group position={[0, 0, zPosition]}>
      <mesh position={[-8.5, 4.5, 0]}><cylinderGeometry args={[0.35, 0.45, 9]} /><meshStandardMaterial color="#666666" /></mesh>
      <mesh position={[8.5, 4.5, 0]}><cylinderGeometry args={[0.35, 0.45, 9]} /><meshStandardMaterial color="#666666" /></mesh>
      <mesh position={[-8.5, 9.2, 0]}><sphereGeometry args={[0.55]} /><meshStandardMaterial color="#ff9900" emissive="#ffaa00" emissiveIntensity={3} /></mesh>
      <mesh position={[8.5, 9.2, 0]}><sphereGeometry args={[0.55]} /><meshStandardMaterial color="#ff9900" emissive="#ffaa00" emissiveIntensity={3} /></mesh>
      <mesh position={[0, 9, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.03, 0.03, 17.5]} /><meshBasicMaterial color="#dddddd" /></mesh>
      {Array.from({ length: 15 }).map((_, i) => (
        <mesh key={i} position={[-7 + i, 8.4, 0]}><planeGeometry args={[0.75, 1.1]} /><meshStandardMaterial color={colors[i % 5]} side={THREE.DoubleSide} /></mesh>
      ))}
    </group>
  );
}

export function EnvironmentDecorations() {
  return (
    <>
      <Himalayas />
     
      {/* Reduced Arches mapped along the curve (from 18 down to 8) */}
      {Array.from({ length: 8 }).map((_, i) => {
        const t = (i + 1) / 9; // Spread evenly along the track
        const point = trackCurve.getPointAt(t);
        const tangent = trackCurve.getTangentAt(t);
        const rotation = Math.atan2(tangent.x, tangent.z);

        return (
          <group key={`arch-${i}`} position={[point.x, 0, point.z]} rotation={[0, rotation, 0]}>
            <DashainArch zPosition={0} />
          </group>
        );
      })}

      {Array.from({ length: 7 }).map((_, i) => {
        const t = (i + 1.5) / 10;
        const point = trackCurve.getPointAt(t);
        const tangent = trackCurve.getTangentAt(t);
        const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
        const offset = i % 2 === 0 ? -14 : 14;
       
        return (
          <LingePing
            key={`ping-${i}`}
            position={[point.x + normal.x * offset, -0.5, point.z + normal.z * offset]}
            rotation={[0, Math.atan2(tangent.x, tangent.z) + (i % 2 === 0 ? 0.3 : -0.3), 0]}
          />
        );
      })}
    </>
  );
}

export function Obstacles({ obstacles }) {
  return (
    <>
      {obstacles.map((obs, i) => (
        <group key={i} position={[obs.x, 0, obs.z]}>
          <mesh position={[-1.2, 0.75, 0]} rotation={[0, 0, 0.2]}>
            <boxGeometry args={[0.15, 1.6, 0.15]} />
            <meshStandardMaterial color="#222222" />
          </mesh>
          <mesh position={[1.2, 0.75, 0]} rotation={[0, 0, -0.2]}>
            <boxGeometry args={[0.15, 1.6, 0.15]} />
            <meshStandardMaterial color="#222222" />
          </mesh>

          <mesh position={[0, 1.1, 0.05]}>
            <boxGeometry args={[2.6, 0.4, 0.1]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
          <Text position={[0, 1.1, 0.11]} fontSize={0.25} color="#0033cc" fontWeight="bold">
            BAJAJ
          </Text>

          <mesh position={[0, 0.5, 0.05]}>
            <boxGeometry args={[2.8, 0.45, 0.1]} />
            <meshStandardMaterial color="#ff5500" />
          </mesh>
          <Text position={[0, 0.5, 0.11]} fontSize={0.28} color="#ffffff" fontWeight="bold">
            SLOW DOWN
          </Text>

          <mesh position={[-1.1, 1.65, 0]}>
            <sphereGeometry args={[0.22]} />
            <meshStandardMaterial color="#ffaa00" emissive="#ffcc00" emissiveIntensity={2.5} />
          </mesh>
          <mesh position={[1.1, 1.65, 0]}>
            <sphereGeometry args={[0.22]} />
            <meshStandardMaterial color="#ffaa00" emissive="#ffcc00" emissiveIntensity={2.5} />
          </mesh>
        </group>
      ))}
    </>
  );
}

export function FinishLine() {
  const point = trackCurve.getPointAt(0);
  const tangent = trackCurve.getTangentAt(0);
  const rotation = Math.atan2(tangent.x, tangent.z);

  return (
    <group position={[point.x, -0.48, point.z]} rotation={[0, rotation, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[14, 5]} />
        <meshStandardMaterial color="#e31c25" />
      </mesh>
    </group>
  );
}