import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const COUNT = 45;

/**
 * High-Performance Exhaust Smoke & Nitro Flame Particle System
 * Spawns from the Bajaj motorcycle muffler tip with speed-reactive trails.
 */
export default function ExhaustParticles({ bikeRef, bikeStateRef }) {
  const meshRef = useRef();

  // Mutable particle simulation state held in ref
  const particlesRef = useRef(
    Array.from({ length: COUNT }).map(() => ({
      pos: new THREE.Vector3(0, -100, 0),
      vel: new THREE.Vector3(),
      life: 0,
      maxLife: 0.5,
      scale: 0.1,
      isNitro: false,
    }))
  );

  const dummyRef = useRef(new THREE.Object3D());
  const nitroColor = useRef(new THREE.Color('#00ffff'));
  const smokeColor = useRef(new THREE.Color('#999999'));

  const spawnTimer = useRef(0);
  const nextParticleIdx = useRef(0);

  useFrame((_, delta) => {
    if (!meshRef.current || !bikeRef?.current || !bikeStateRef?.current) return;

    const { isNitro = false, isAccelerating = false, speedRatio = 0 } = bikeStateRef.current;
    const particles = particlesRef.current;
    const dummy = dummyRef.current;

    // 1. Spawning Logic
    const spawnRate = isNitro ? 0.015 : isAccelerating ? 0.035 : 0.08;
    spawnTimer.current += delta;

    if (spawnTimer.current >= spawnRate && speedRatio > 0.05) {
      spawnTimer.current = 0;

      // Exhaust pipe tip in motorcycle local space (right rear side)
      const localExhaust = new THREE.Vector3(0.38, 0.48, 1.65);
      const worldExhaust = localExhaust.applyMatrix4(bikeRef.current.matrixWorld);

      // Get bike's backward direction for particle exhaust thrust (+Z in bike space)
      const bikeBackward = new THREE.Vector3(0, 0, 1).applyQuaternion(bikeRef.current.quaternion);

      const p = particles[nextParticleIdx.current];
      nextParticleIdx.current = (nextParticleIdx.current + 1) % COUNT;

      p.pos.copy(worldExhaust);
      p.isNitro = isNitro;
      p.maxLife = isNitro ? 0.35 : 0.6;
      p.life = p.maxLife;

      // Thrust velocity backward relative to bike
      const thrustSpeed = isNitro ? 12 : 5;
      p.vel.copy(bikeBackward)
        .multiplyScalar(thrustSpeed)
        .add(new THREE.Vector3(
          (Math.random() - 0.5) * 1.5,
          Math.random() * 1.2 + 0.5,
          (Math.random() - 0.5) * 1.5
        ));
    }

    // 2. Particle Simulation & Transform Update
    for (let i = 0; i < COUNT; i++) {
      const p = particles[i];
      if (p.life > 0) {
        p.life -= delta;
        p.pos.addScaledVector(p.vel, delta);

        // Slow down and drift upwards
        p.vel.multiplyScalar(0.92);
        p.vel.y += delta * 1.2;

        const progress = 1 - p.life / p.maxLife;
        const scale = p.isNitro
          ? THREE.MathUtils.lerp(0.18, 0.05, progress)
          : THREE.MathUtils.lerp(0.08, 0.35, progress);

        dummy.position.copy(p.pos);
        dummy.scale.setScalar(scale);
        dummy.updateMatrix();

        meshRef.current.setMatrixAt(i, dummy.matrix);
        meshRef.current.setColorAt(i, p.isNitro ? nitroColor.current : smokeColor.current);
      } else {
        dummy.position.set(0, -100, 0);
        dummy.scale.setScalar(0.001);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      }
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]} frustumCulled={false}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial transparent opacity={0.65} />
    </instancedMesh>
  );
}
