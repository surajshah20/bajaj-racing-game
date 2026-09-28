import { useRef, useMemo, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Sky, Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';
import {
  mergeGeometries,
  mergeVertices,
} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { trackCurve } from '../../utils/trackPath';

const GROUND_Y = -0.6;

/* ------------------------------------------------------------------ */
/*  Helpers: seeded random + noise                                     */
/* ------------------------------------------------------------------ */

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const hash = (x, y) => {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
};

function vnoise(x, y) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi);
  const b = hash(xi + 1, yi);
  const c = hash(xi, yi + 1);
  const d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

function fbm(x, y, oct = 5) {
  let amp = 0.5;
  let freq = 1;
  let sum = 0;
  for (let i = 0; i < oct; i++) {
    sum += amp * vnoise(x * freq, y * freq);
    freq *= 2;
    amp *= 0.5;
  }
  return sum;
}

const ridged = (x, y) => 1 - Math.abs(2 * fbm(x, y, 4) - 1);

/* ------------------------------------------------------------------ */
/*  Procedural textures (cached, generated once)                       */
/* ------------------------------------------------------------------ */

const texCache = {};

function canvasTexture(key, w, h, draw, repeat = [1, 1]) {
  if (texCache[key]) return texCache[key];
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 16;
  tex.repeat.set(repeat[0], repeat[1]);
  texCache[key] = tex;
  return tex;
}

function grain(ctx, w, h, amount) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const k = 1 + (Math.random() - 0.5) * amount;
    d[i] *= k;
    d[i + 1] *= k;
    d[i + 2] *= k;
  }
  ctx.putImageData(img, 0, 0);
}

const asphaltTexture = () =>
  canvasTexture('asphalt', 512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#2e2e31';
    ctx.fillRect(0, 0, w, h);
    // patchy repairs / stains
    for (let i = 0; i < 260; i++) {
      const dark = Math.random() < 0.6;
      ctx.fillStyle = dark ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.03)';
      ctx.beginPath();
      ctx.ellipse(
        Math.random() * w,
        Math.random() * h,
        10 + Math.random() * 50,
        10 + Math.random() * 40,
        Math.random() * Math.PI,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
    // worn wheel paths
    ctx.fillStyle = 'rgba(0,0,0,0.16)';
    ctx.fillRect(w * 0.2, 0, w * 0.14, h);
    ctx.fillRect(w * 0.66, 0, w * 0.14, h);
    // edge lines + dashed centre line
    ctx.fillStyle = 'rgba(236,236,226,0.92)';
    ctx.fillRect(w * 0.035, 0, w * 0.018, h);
    ctx.fillRect(w * 0.947, 0, w * 0.018, h);
    ctx.fillRect(w * 0.5 - w * 0.008, 0, w * 0.016, h * 0.5);
    // loose stones
    for (let i = 0; i < 3500; i++) {
      ctx.fillStyle = `rgba(190,190,190,${0.1 + Math.random() * 0.2})`;
      ctx.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5);
    }
    grain(ctx, w, h, 0.4);
  });

const grassTexture = () =>
  canvasTexture(
    'grass',
    512,
    512,
    (ctx, w, h) => {
      const img = ctx.createImageData(w, h);
      const dark = new THREE.Color('#284f25');
      const light = new THREE.Color('#5a8c48');
      const tmp = new THREE.Color();
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const n = vnoise(x / 7, y / 7) * 0.5 + Math.random() * 0.5;
          tmp.copy(dark).lerp(light, n);
          const i = (y * w + x) * 4;
          img.data[i] = tmp.r * 255;
          img.data[i + 1] = tmp.g * 255;
          img.data[i + 2] = tmp.b * 255;
          img.data[i + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
    },
    [170, 170]
  );

const gravelTexture = () =>
  canvasTexture('gravel', 256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#7a705f';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 2500; i++) {
      const g = 90 + Math.random() * 110;
      ctx.fillStyle = `rgba(${g},${g * 0.94},${g * 0.84},0.6)`;
      ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
    grain(ctx, w, h, 0.3);
  });

const kerbTexture = () =>
  canvasTexture('kerb', 64, 128, (ctx, w, h) => {
    ctx.fillStyle = '#c8211f';
    ctx.fillRect(0, 0, w, h / 2);
    ctx.fillStyle = '#efefef';
    ctx.fillRect(0, h / 2, w, h / 2);
    grain(ctx, w, h, 0.25);
  });

const checkerTexture = () =>
  canvasTexture('checker', 512, 128, (ctx, w, h) => {
    const s = 32;
    for (let y = 0; y < h / s; y++) {
      for (let x = 0; x < w / s; x++) {
        ctx.fillStyle = (x + y) % 2 ? '#111111' : '#f4f4f4';
        ctx.fillRect(x * s, y * s, s, s);
      }
    }
    grain(ctx, w, h, 0.15);
  });

/* ------------------------------------------------------------------ */
/*  Himalayas: displaced, vertex-coloured snow peaks in a ring         */
/* ------------------------------------------------------------------ */

function makePeak(radius, height, seed) {
  let g = new THREE.ConeGeometry(radius, height, 32, 20, true);
  g.deleteAttribute('normal');
  g.deleteAttribute('uv');
  g = mergeVertices(g, 1e-3);

  const pos = g.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  const snowCol = new THREE.Color();
  const rock1 = new THREE.Color('#6d6357');
  const rock2 = new THREE.Color('#453f38');
  const snow = new THREE.Color('#f5f8fc');
  const snowShade = new THREE.Color('#c9d6e6');
  const forest = new THREE.Color('#33472f');

  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);
    const t = (y + height / 2) / height;
    const n = fbm(x * 0.03 + seed, z * 0.03 + y * 0.04, 5);
    const r = ridged(x * 0.02 + seed * 0.5, z * 0.02 + y * 0.03);

    if (t < 0.985) {
      const k = 1 + (n - 0.5) * 0.55 + (r - 0.5) * 0.35 * (0.3 + t);
      x *= k;
      z *= k;
      y += (r - 0.5) * height * 0.06;
    }
    pos.setXYZ(i, x, y, z);

    c.copy(rock1).lerp(rock2, THREE.MathUtils.clamp((n - 0.3) * 2, 0, 1));
    if (t < 0.18) c.lerp(forest, 1 - t / 0.18);
    const snowLine = 0.5 + (n - 0.5) * 0.35;
    let s = THREE.MathUtils.smoothstep(t, snowLine - 0.05, snowLine + 0.08);
    s *= 1 - THREE.MathUtils.smoothstep(r, 0.65, 0.88) * 0.5; // rock streaks
    snowCol.copy(snowShade).lerp(snow, n);
    c.lerp(snowCol, s);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  g.computeVertexNormals();
  return g;
}

export function Himalayas() {
  const peaks = useMemo(() => {
    // centre the ring on the track loop instead of the world origin
    const pts = trackCurve.getSpacedPoints(64);
    const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
    const cz = pts.reduce((s, p) => s + p.z, 0) / pts.length;

    const rnd = mulberry32(21);
    const N = 44;
    const list = [];
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2 + (rnd() - 0.5) * 0.05;
      const north = Math.max(0, Math.cos(a)); // tallest range straight ahead (-z)
      const R = 1000 + rnd() * 120;
      const height = 70 + rnd() * 60 + north * (140 + rnd() * 110);
      const radius = height * (0.9 + rnd() * 0.5);
      list.push({
        x: cx + Math.sin(a) * R,
        z: cz - Math.cos(a) * R,
        y: GROUND_Y - 10 + height / 2,
        rot: rnd() * Math.PI * 2,
        geo: makePeak(radius, height, i * 13.7),
      });
    }
    return list;
  }, []);

  return (
    <group>
      {peaks.map((p, i) => (
        <mesh key={i} geometry={p.geo} position={[p.x, p.y, p.z]} rotation={[0, p.rot, 0]}>
          <meshStandardMaterial vertexColors roughness={1} metalness={0} />
        </mesh>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Linge Ping (bamboo swing) with knuckled bamboo + swaying seat      */
/* ------------------------------------------------------------------ */

function Bamboo({ position, rotation, length = 8, radius = 0.09 }) {
  const nodes = Math.floor(length / 1.3);
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow>
        <cylinderGeometry args={[radius * 0.85, radius, length, 8]} />
        <meshStandardMaterial color="#b8985a" roughness={0.75} />
      </mesh>
      {Array.from({ length: nodes }).map((_, i) => (
        <mesh key={i} position={[0, -length / 2 + (i + 0.6) * (length / nodes), 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[radius * 1.02, radius * 0.22, 6, 10]} />
          <meshStandardMaterial color="#8a6d34" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

export function LingePing({ position, rotation = [0, 0, 0] }) {
  const swing = useRef();
  const phase = useMemo(() => Math.random() * 6, []);

  useFrame(({ clock }) => {
    if (swing.current) {
      swing.current.rotation.x = Math.sin(clock.elapsedTime * 1.15 + phase) * 0.22;
    }
  });

  return (
    <group position={position} rotation={rotation} scale={1.2}>
      <Bamboo position={[-1.2, 3.5, -1.2]} rotation={[0.2, 0, -0.2]} />
      <Bamboo position={[1.2, 3.5, -1.2]} rotation={[0.2, 0, 0.2]} />
      <Bamboo position={[-1.2, 3.5, 1.2]} rotation={[-0.2, 0, -0.2]} />
      <Bamboo position={[1.2, 3.5, 1.2]} rotation={[-0.2, 0, 0.2]} />

      {/* cross beam + rope lashing */}
      <mesh position={[0, 7, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 2.8, 8]} />
        <meshStandardMaterial color="#8c6a2b" roughness={0.8} />
      </mesh>
      {[-0.4, 0.4].map((x) =>
        [-0.4, 0.4].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 7.05, z]}>
            <sphereGeometry args={[0.16, 8, 8]} />
            <meshStandardMaterial color="#c9b58a" roughness={1} />
          </mesh>
        ))
      )}

      {/* swinging seat */}
      <group ref={swing} position={[0, 7, 0]}>
        {[-0.35, 0.35].map((x) => (
          <mesh key={x} position={[x, -2.25, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 4.5, 6]} />
            <meshStandardMaterial color="#d8c9a3" roughness={1} />
          </mesh>
        ))}
        <mesh position={[0, -4.5, 0]} castShadow>
          <boxGeometry args={[0.9, 0.08, 0.42]} />
          <meshStandardMaterial color="#593b13" roughness={0.85} />
        </mesh>
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Track: layered strips (asphalt, kerbs, gravel shoulders)           */
/* ------------------------------------------------------------------ */

function buildStrip(a, b, y, tileLen, steps = 400) {
  const L = trackCurve.getLength();
  const pos = [];
  const uv = [];
  const idx = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const p = trackCurve.getPointAt(t);
    const tg = trackCurve.getTangentAt(t);
    const nx = -tg.z;
    const nz = tg.x;
    const len = Math.hypot(nx, nz) || 1;
    const ux = nx / len;
    const uz = nz / len;
    pos.push(p.x + ux * a, y, p.z + uz * a, p.x + ux * b, y, p.z + uz * b);
    const v = (t * L) / tileLen;
    uv.push(0, v, 1, v);
  }
  for (let i = 0; i < steps; i++) {
    const k = i * 2;
    idx.push(k, k + 1, k + 2, k + 2, k + 1, k + 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

export function Track() {
  const geos = useMemo(
    () => ({
      road: buildStrip(-8, 8, -0.01, 24),
      kerbL: buildStrip(-9.3, -8, -0.02, 4),
      kerbR: buildStrip(8, 9.3, -0.02, 4),
      shoulderL: buildStrip(-12.5, -9.3, -0.04, 3.2),
      shoulderR: buildStrip(9.3, 12.5, -0.04, 3.2),
    }),
    []
  );
  const maps = useMemo(
    () => ({
      asphalt: asphaltTexture(),
      grass: grassTexture(),
      gravel: gravelTexture(),
      kerb: kerbTexture(),
    }),
    []
  );

  return (
    <group>
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, GROUND_Y, 0]} receiveShadow>
        <planeGeometry args={[4000, 4000]} />
        <meshStandardMaterial map={maps.grass} roughness={1} />
      </mesh>

      {/* Gravel shoulders */}
      {[geos.shoulderL, geos.shoulderR].map((g, i) => (
        <mesh key={`sh${i}`} geometry={g} receiveShadow>
          <meshStandardMaterial map={maps.gravel} roughness={1} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* Red / white kerbs */}
      {[geos.kerbL, geos.kerbR].map((g, i) => (
        <mesh key={`k${i}`} geometry={g} receiveShadow>
          <meshStandardMaterial
            map={maps.kerb}
            roughness={0.7}
            side={THREE.DoubleSide}
            polygonOffset
            polygonOffsetFactor={-2}
            polygonOffsetUnits={-2}
          />
        </mesh>
      ))}

      {/* Asphalt */}
      <mesh geometry={geos.road} receiveShadow>
        <meshStandardMaterial
          map={maps.asphalt}
          roughness={0.88}
          metalness={0.02}
          side={THREE.DoubleSide}
          polygonOffset
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-1}
        />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Dashain arch: draped, fluttering prayer-flag bunting               */
/* ------------------------------------------------------------------ */

export function DashainArch({ zPosition }) {
  const colors = ['#0033cc', '#ffffff', '#e31c25', '#009900', '#ffcc00'];
  const flags = useRef();
  const phase = useMemo(() => Math.random() * 10, []);

  const curve = useMemo(
    () =>
      new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(-8.5, 9, 0),
        new THREE.Vector3(0, 7.8, 0),
        new THREE.Vector3(8.5, 9, 0)
      ),
    []
  );
  const stringGeo = useMemo(() => new THREE.TubeGeometry(curve, 32, 0.03, 5, false), [curve]);
  const flagPts = useMemo(
    () => Array.from({ length: 15 }).map((_, i) => curve.getPoint((i + 1) / 16)),
    [curve]
  );

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    flags.current?.children.forEach((g, i) => {
      g.rotation.y = Math.sin(t * 2.4 + i * 0.7 + phase) * 0.3;
      g.rotation.x = Math.sin(t * 3.1 + i * 1.3 + phase) * 0.06;
    });
  });

  return (
    <group position={[0, 0, zPosition]}>
      {[-8.5, 8.5].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.25, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.75, 0.85, 0.5, 16]} />
            <meshStandardMaterial color="#9a9a94" roughness={0.95} />
          </mesh>
          <mesh position={[x, 4.75, 0]} castShadow>
            <cylinderGeometry args={[0.3, 0.42, 8.5, 16]} />
            <meshStandardMaterial color="#6b6d70" roughness={0.45} metalness={0.55} />
          </mesh>
          <mesh position={[x, 9.2, 0]}>
            <sphereGeometry args={[0.55, 20, 20]} />
            <meshStandardMaterial color="#ff9900" emissive="#ffaa00" emissiveIntensity={2.5} />
          </mesh>
        </group>
      ))}

      <mesh geometry={stringGeo}>
        <meshStandardMaterial color="#d9d2c0" roughness={0.9} />
      </mesh>

      <group ref={flags}>
        {flagPts.map((p, i) => (
          <group key={i} position={[p.x, p.y, 0]}>
            <mesh position={[0, -0.55, 0]} castShadow>
              <planeGeometry args={[0.75, 1.1]} />
              <meshStandardMaterial color={colors[i % 5]} side={THREE.DoubleSide} roughness={0.95} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Instanced forest + roadside marker posts                           */
/* ------------------------------------------------------------------ */

function Forest({ count = 420 }) {
  const foliageRef = useRef();
  const trunkRef = useRef();

  const foliageGeo = useMemo(() => {
    const parts = [
      [2.6, 4.2, 3.2],
      [2.1, 3.8, 5.0],
      [1.5, 3.4, 6.6],
    ].map(([r, h, y]) => {
      const g = new THREE.ConeGeometry(r, h, 7);
      g.translate(0, y, 0);
      return g;
    });
    return mergeGeometries(parts);
  }, []);
  const trunkGeo = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.22, 0.32, 2.6, 6);
    g.translate(0, 1.3, 0);
    return g;
  }, []);

  useLayoutEffect(() => {
    const rnd = mulberry32(7);
    const dummy = new THREE.Object3D();
    const col = new THREE.Color();
    const samples = trackCurve.getSpacedPoints(300);
    let placed = 0;

    for (let i = 0; i < count; i++) {
      for (let attempt = 0; attempt < 6; attempt++) {
        const t = rnd();
        const p = trackCurve.getPointAt(t);
        const tg = trackCurve.getTangentAt(t);
        const n = new THREE.Vector3(-tg.z, 0, tg.x).normalize();
        const side = rnd() < 0.5 ? -1 : 1;
        const off = 20 + Math.pow(rnd(), 1.6) * 90;
        const x = p.x + n.x * off * side;
        const z = p.z + n.z * off * side;

        // stay clear of any other stretch of track
        if (samples.some((s) => Math.hypot(s.x - x, s.z - z) < 18)) continue;

        const s = 0.7 + rnd() * 1.1;
        dummy.position.set(x, GROUND_Y, z);
        dummy.rotation.set(0, rnd() * Math.PI * 2, 0);
        dummy.scale.set(s * (0.85 + rnd() * 0.3), s, s * (0.85 + rnd() * 0.3));
        dummy.updateMatrix();
        foliageRef.current.setMatrixAt(placed, dummy.matrix);
        trunkRef.current.setMatrixAt(placed, dummy.matrix);
        col.setHSL(0.3 + rnd() * 0.06, 0.45, 0.14 + rnd() * 0.1);
        foliageRef.current.setColorAt(placed, col);
        placed++;
        break;
      }
    }
    foliageRef.current.count = placed;
    trunkRef.current.count = placed;
    foliageRef.current.instanceMatrix.needsUpdate = true;
    trunkRef.current.instanceMatrix.needsUpdate = true;
    if (foliageRef.current.instanceColor) foliageRef.current.instanceColor.needsUpdate = true;
  }, [count]);

  return (
    <group>
      <instancedMesh ref={foliageRef} args={[foliageGeo, undefined, count]} castShadow frustumCulled={false}>
        <meshStandardMaterial roughness={1} flatShading />
      </instancedMesh>
      <instancedMesh ref={trunkRef} args={[trunkGeo, undefined, count]} castShadow frustumCulled={false}>
        <meshStandardMaterial color="#4a3320" roughness={1} />
      </instancedMesh>
    </group>
  );
}

function RoadsideMarkers() {
  const postRef = useRef();
  const capRef = useRef();
  const count = useMemo(() => Math.floor(trackCurve.getLength() / 25) * 2, []);

  useLayoutEffect(() => {
    const d = new THREE.Object3D();
    let k = 0;
    for (let i = 0; i < count / 2; i++) {
      const t = i / (count / 2);
      const p = trackCurve.getPointAt(t);
      const tg = trackCurve.getTangentAt(t);
      const n = new THREE.Vector3(-tg.z, 0, tg.x).normalize();
      [-1, 1].forEach((side) => {
        d.position.set(p.x + n.x * 10.8 * side, 0.45, p.z + n.z * 10.8 * side);
        d.rotation.set(0, 0, 0);
        d.updateMatrix();
        postRef.current.setMatrixAt(k, d.matrix);
        d.position.y = 0.78;
        d.updateMatrix();
        capRef.current.setMatrixAt(k, d.matrix);
        k++;
      });
    }
    postRef.current.instanceMatrix.needsUpdate = true;
    capRef.current.instanceMatrix.needsUpdate = true;
  }, [count]);

  return (
    <group>
      <instancedMesh ref={postRef} args={[undefined, undefined, count]} castShadow frustumCulled={false}>
        <boxGeometry args={[0.12, 1.1, 0.12]} />
        <meshStandardMaterial color="#e9e9e4" roughness={0.6} />
      </instancedMesh>
      <instancedMesh ref={capRef} args={[undefined, undefined, count]} frustumCulled={false}>
        <boxGeometry args={[0.125, 0.22, 0.125]} />
        <meshStandardMaterial color="#d3241f" emissive="#a01010" emissiveIntensity={0.6} roughness={0.4} />
      </instancedMesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Scene decorations                                                  */
/* ------------------------------------------------------------------ */

export function EnvironmentDecorations() {
  return (
    <>
      <Himalayas />
      <Forest />
      <RoadsideMarkers />

      {Array.from({ length: 8 }).map((_, i) => {
        const t = (i + 1) / 9;
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

/* ------------------------------------------------------------------ */
/*  Obstacles: bajaj barricade with alternating hazard lamps + cones   */
/* ------------------------------------------------------------------ */

function Barricade({ obs, index }) {
  const lampA = useRef();
  const lampB = useRef();

  useFrame(({ clock }) => {
    const on = Math.sin(clock.elapsedTime * 5 + index) > 0;
    if (lampA.current) lampA.current.emissiveIntensity = on ? 4 : 0.2;
    if (lampB.current) lampB.current.emissiveIntensity = on ? 0.2 : 4;
  });

  return (
    <group position={[obs.x, 0, obs.z]}>
      {[-1.2, 1.2].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.06, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.5, 0.12, 0.5]} />
            <meshStandardMaterial color="#8d8d88" roughness={0.95} />
          </mesh>
          <mesh position={[x, 0.85, 0]} rotation={[0, 0, x < 0 ? 0.2 : -0.2]} castShadow>
            <boxGeometry args={[0.15, 1.6, 0.15]} />
            <meshStandardMaterial color="#2a2a2c" roughness={0.5} metalness={0.6} />
          </mesh>
        </group>
      ))}

      <mesh position={[0, 1.1, 0.05]} castShadow>
        <boxGeometry args={[2.6, 0.4, 0.1]} />
        <meshStandardMaterial color="#f2f2ee" roughness={0.45} />
      </mesh>
      <Text position={[0, 1.1, 0.11]} fontSize={0.25} color="#0033cc" anchorX="center" anchorY="middle">
        BAJAJ
      </Text>

      <mesh position={[0, 0.5, 0.05]} castShadow>
        <boxGeometry args={[2.8, 0.45, 0.1]} />
        <meshStandardMaterial color="#ff5500" roughness={0.45} />
      </mesh>
      <Text position={[0, 0.5, 0.11]} fontSize={0.28} color="#ffffff" anchorX="center" anchorY="middle">
        SLOW DOWN
      </Text>

      <mesh position={[-1.1, 1.65, 0]}>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial ref={lampA} color="#ffaa00" emissive="#ffcc00" emissiveIntensity={4} />
      </mesh>
      <mesh position={[1.1, 1.65, 0]}>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial ref={lampB} color="#ffaa00" emissive="#ffcc00" emissiveIntensity={0.2} />
      </mesh>

      {[-2.1, 2.1].map((x) => (
        <group key={`cone${x}`} position={[x, 0, 0.7]}>
          <mesh position={[0, 0.3, 0]} castShadow>
            <coneGeometry args={[0.2, 0.6, 14]} />
            <meshStandardMaterial color="#ff6a00" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.32, 0]}>
            <cylinderGeometry args={[0.135, 0.15, 0.1, 14]} />
            <meshStandardMaterial color="#f4f4f4" roughness={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function Obstacles({ obstacles }) {
  return (
    <>
      {obstacles.map((obs, i) => (
        <Barricade key={i} obs={obs} index={i} />
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Finish line: checkered strip + gantry                              */
/* ------------------------------------------------------------------ */

export function FinishLine() {
  const point = trackCurve.getPointAt(0);
  const tangent = trackCurve.getTangentAt(0);
  const rotation = Math.atan2(tangent.x, tangent.z);
  const checker = useMemo(() => checkerTexture(), []);

  return (
    <group position={[point.x, 0, point.z]} rotation={[0, rotation, 0]}>
      {/* sits just above the asphalt (the old -0.48 hid it under the road) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <planeGeometry args={[16, 4]} />
        <meshStandardMaterial
          map={checker}
          roughness={0.8}
          polygonOffset
          polygonOffsetFactor={-4}
          polygonOffsetUnits={-4}
        />
      </mesh>

      {[-9.5, 9.5].map((x) => (
        <mesh key={x} position={[x, 3.6, 0]} castShadow>
          <cylinderGeometry args={[0.25, 0.3, 7.2, 12]} />
          <meshStandardMaterial color="#c8211f" roughness={0.5} metalness={0.3} />
        </mesh>
      ))}
      <mesh position={[0, 7.1, 0]} castShadow>
        <boxGeometry args={[19.6, 1.5, 0.3]} />
        <meshStandardMaterial color="#141416" roughness={0.6} />
      </mesh>
      <Text position={[0, 7.1, 0.17]} fontSize={0.95} color="#ffffff" anchorX="center" anchorY="middle">
        FINISH
      </Text>
      <Text
        position={[0, 7.1, -0.17]}
        rotation={[0, Math.PI, 0]}
        fontSize={0.95}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        FINISH
      </Text>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Atmosphere: sky, haze, sun, soft sky light + offline reflections    */
/*  Usage: <Atmosphere followRef={bikeRef} />  (inside <Canvas shadows>) */
/* ------------------------------------------------------------------ */

const SUN = [250, 180, 200]; // behind-right of the rider: bike + mountains are front-lit

export function Atmosphere({ sun = SUN, followRef, shadowSize = 2048 }) {
  const light = useRef();
  const target = useMemo(() => new THREE.Object3D(), []);
  const offset = useMemo(() => new THREE.Vector3(...sun).normalize().multiplyScalar(120), [sun]);
  const sunDir = useMemo(() => new THREE.Vector3(...sun).normalize().multiplyScalar(30), [sun]);

  useLayoutEffect(() => {
    if (light.current) light.current.target = target;
  }, [target]);

  // keep the shadow frustum centred on the bike
  useFrame(() => {
    const p = followRef?.current?.position;
    if (!p || !light.current) return;
    light.current.position.set(p.x + offset.x, p.y + offset.y, p.z + offset.z);
    target.position.set(p.x, p.y, p.z);
    target.updateMatrixWorld();
  });

  return (
    <>
      <fog attach="fog" args={['#c9d9ea', 250, 2400]} />
      <Sky distance={450000} sunPosition={sun} turbidity={4} rayleigh={1.2} mieCoefficient={0.005} mieDirectionalG={0.8} />

      {/* Generated in-scene (no HDR download): gives the bike paint/chrome something to reflect */}
      <Environment resolution={256} frames={1}>
        <color attach="background" args={['#8fa9c4']} />
        <Lightformer form="rect" intensity={1.4} color="#cfe4ff" position={[0, 20, 0]} scale={[60, 60, 1]} onUpdate={(s) => s.lookAt(0, 0, 0)} />
        <Lightformer form="rect" intensity={6} color="#ffe6bf" position={[sunDir.x, sunDir.y, sunDir.z]} scale={[10, 10, 1]} onUpdate={(s) => s.lookAt(0, 0, 0)} />
        <Lightformer form="rect" intensity={0.6} color="#4d6b45" position={[0, -10, 0]} scale={[60, 60, 1]} onUpdate={(s) => s.lookAt(0, 0, 0)} />
      </Environment>

      <hemisphereLight args={['#cfe4ff', '#3b5a36', 0.35]} />
      <directionalLight
        ref={light}
        position={sun}
        intensity={2.2}
        color="#fff2dc"
        castShadow
        shadow-mapSize={[shadowSize, shadowSize]}
        shadow-bias={-0.0004}
        shadow-camera-left={-70}
        shadow-camera-right={70}
        shadow-camera-top={70}
        shadow-camera-bottom={-70}
        shadow-camera-near={1}
        shadow-camera-far={400}
      />
      <primitive object={target} />
    </>
  );
}