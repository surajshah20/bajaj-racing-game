import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const MAX_SPARKS = 45;
const MAX_SKID_PUFFS = 30;

// Soft feathered radial gradient neon underglow texture (no harsh rectangle edges)
function getUnderglowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
  grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.65)');
  grad.addColorStop(0.65, 'rgba(255, 255, 255, 0.20)');
  grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

export default function BikeVFX({ bikeRef, bikeStateRef, accentColor = '#00e5ff' }) {
  const underglowRef = useRef();
  const sparksRef = useRef();
  const skidPuffsRef = useRef();
  const rimFrontRef = useRef();
  const rimRearRef = useRef();

  const glowTex = useMemo(() => getUnderglowTexture(), []);

  // Procedural sparks pool
  const sparks = useMemo(() => {
    return Array.from({ length: MAX_SPARKS }).map(() => ({
      active: false,
      pos: new THREE.Vector3(),
      vel: new THREE.Vector3(),
      life: 0,
      maxLife: 0.28,
      size: 0.12,
    }));
  }, []);

  // Procedural skid smoke puffs pool
  const skidPuffs = useMemo(() => {
    return Array.from({ length: MAX_SKID_PUFFS }).map(() => ({
      active: false,
      pos: new THREE.Vector3(),
      vel: new THREE.Vector3(),
      life: 0,
      maxLife: 0.45,
      size: 0.35,
    }));
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state, delta) => {
    if (!bikeRef.current) return;
    const bikeState = bikeStateRef.current || {};
    const bikePos = bikeRef.current.position;
    const bikeQuat = bikeRef.current.quaternion;

    const isBraking = bikeState.isBraking;
    const isDrifting = Math.abs(bikeState.lean || 0) > 0.38;
    const isScraping = bikeState.isScraping || (isDrifting && (bikeState.speedRatio || 0) > 0.4);
    const isNitro = bikeState.isNitro;

    // 1. NEON UNDERGLOW PULSE
    if (underglowRef.current) {
      const pulse = 2.5 + Math.sin(state.clock.elapsedTime * 10) * 0.8 + (isNitro ? 2.5 : 0);
      underglowRef.current.material.emissiveIntensity = pulse;
    }

    // 2. WHEEL RIM ROTATION
    const wheelRotSpeed = (bikeState.speedRatio || 0) * 45;
    if (rimFrontRef.current) rimFrontRef.current.rotation.x += wheelRotSpeed * delta;
    if (rimRearRef.current) rimRearRef.current.rotation.x += wheelRotSpeed * delta;

    // 3. ASPHALT SCRAPING SPARKS
    if (isScraping) {
      for (let i = 0; i < 3; i++) {
        const dead = sparks.find((s) => !s.active);
        if (dead) {
          dead.active = true;
          dead.life = 0;
          dead.maxLife = 0.2 + Math.random() * 0.15;
          // Spawn near rear tire / footpeg
          const side = (Math.random() - 0.5) * 0.4;
          dead.pos.copy(bikePos).add(new THREE.Vector3(side, 0.05, -0.6).applyQuaternion(bikeQuat));
          // Shoot backwards and up with bounce
          dead.vel.set(
            (Math.random() - 0.5) * 3,
            1.5 + Math.random() * 3.5,
            -8 - Math.random() * 12
          ).applyQuaternion(bikeQuat);
        }
      }
    }

    // Update sparks
    if (sparksRef.current) {
      let activeCount = 0;
      sparks.forEach((s) => {
        if (!s.active) return;
        s.life += delta;
        if (s.life >= s.maxLife) {
          s.active = false;
          return;
        }
        s.vel.y -= 20 * delta; // gravity
        s.pos.addScaledVector(s.vel, delta);
        if (s.pos.y < bikePos.y - 0.1) {
          s.pos.y = bikePos.y - 0.1;
          s.vel.y = -s.vel.y * 0.5; // bounce
        }

        const scale = (1 - s.life / s.maxLife) * s.size;
        dummy.position.copy(s.pos);
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();
        sparksRef.current.setMatrixAt(activeCount, dummy.matrix);
        activeCount++;
      });

      for (let i = activeCount; i < MAX_SPARKS; i++) {
        dummy.position.set(0, -999, 0);
        dummy.scale.set(0, 0, 0);
        dummy.updateMatrix();
        sparksRef.current.setMatrixAt(i, dummy.matrix);
      }
      sparksRef.current.instanceMatrix.needsUpdate = true;
    }

    // 4. TIRE SKID SMOKE
    if (isBraking && (bikeState.speedRatio || 0) > 0.2) {
      const dead = skidPuffs.find((p) => !p.active);
      if (dead) {
        dead.active = true;
        dead.life = 0;
        dead.maxLife = 0.35 + Math.random() * 0.2;
        dead.pos.copy(bikePos).add(new THREE.Vector3(0, 0.1, -0.7).applyQuaternion(bikeQuat));
        dead.vel.set((Math.random() - 0.5) * 1.5, 0.8 + Math.random() * 1.5, -3).applyQuaternion(bikeQuat);
      }
    }

    // Update skid puffs
    if (skidPuffsRef.current) {
      let puffCount = 0;
      skidPuffs.forEach((p) => {
        if (!p.active) return;
        p.life += delta;
        if (p.life >= p.maxLife) {
          p.active = false;
          return;
        }
        p.pos.addScaledVector(p.vel, delta);
        const progress = p.life / p.maxLife;
        const scale = (0.2 + progress * 0.8) * p.size;
        dummy.position.copy(p.pos);
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();
        skidPuffsRef.current.setMatrixAt(puffCount, dummy.matrix);
        puffCount++;
      });

      for (let i = puffCount; i < MAX_SKID_PUFFS; i++) {
        dummy.position.set(0, -999, 0);
        dummy.scale.set(0, 0, 0);
        dummy.updateMatrix();
        skidPuffsRef.current.setMatrixAt(i, dummy.matrix);
      }
      skidPuffsRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* 1. SOFT FEATHERED NEON UNDERGLOW POOL */}
      <mesh ref={underglowRef} position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.0, 3.6]} />
        <meshBasicMaterial
          map={glowTex}
          color={accentColor}
          transparent
          opacity={0.42}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* 2. INSTANCED ASPHALT SPARKS */}
      <instancedMesh ref={sparksRef} args={[undefined, undefined, MAX_SPARKS]} frustumCulled={false}>
        <boxGeometry args={[0.08, 0.08, 0.2]} />
        <meshBasicMaterial color="#ffaa00" />
      </instancedMesh>

      {/* 3. INSTANCED TIRE SKID SMOKE */}
      <instancedMesh ref={skidPuffsRef} args={[undefined, undefined, MAX_SKID_PUFFS]} frustumCulled={false}>
        <sphereGeometry args={[0.5, 6, 6]} />
        <meshBasicMaterial color="#e2e8f0" transparent opacity={0.35} />
      </instancedMesh>
    </group>
  );
}
