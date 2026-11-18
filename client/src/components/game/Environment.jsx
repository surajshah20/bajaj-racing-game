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
/*  Procedural Textures                                                */
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

// 8-Lane Kathmandu Ring Road Asphalt with yellow edge lines and dashed multi-lane markers
const asphaltTexture = () =>
  canvasTexture('asphalt', 512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#2d2e32';
    ctx.fillRect(0, 0, w, h);

    // Weathering patches & tire rubber marks
    for (let i = 0; i < 300; i++) {
      const dark = Math.random() < 0.6;
      ctx.fillStyle = dark ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.03)';
      ctx.beginPath();
      ctx.ellipse(
        Math.random() * w,
        Math.random() * h,
        15 + Math.random() * 60,
        10 + Math.random() * 40,
        Math.random() * Math.PI,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    // Outer Yellow Shoulders (Solid Lines)
    ctx.fillStyle = '#f5c518';
    ctx.fillRect(w * 0.04, 0, w * 0.018, h);
    ctx.fillRect(w * 0.942, 0, w * 0.018, h);

    // 4 Dashed White Driving Lane Dividers across the highway
    ctx.fillStyle = 'rgba(240, 240, 235, 0.95)';
    const laneLines = [0.22, 0.40, 0.60, 0.78];
    laneLines.forEach((xPos) => {
      ctx.fillRect(w * xPos, 0, w * 0.014, h * 0.45);
    });

    // Fine aggregate stones
    for (let i = 0; i < 3000; i++) {
      ctx.fillStyle = `rgba(180,180,180,${0.1 + Math.random() * 0.25})`;
      ctx.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5);
    }
    grain(ctx, w, h, 0.35);
  });

const grassTexture = () =>
  canvasTexture(
    'grass',
    512,
    512,
    (ctx, w, h) => {
      const img = ctx.createImageData(w, h);
      const dark = new THREE.Color('#254d24');
      const light = new THREE.Color('#558b43');
      const tmp = new THREE.Color();
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const n = vnoise(x / 8, y / 8) * 0.5 + Math.random() * 0.5;
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
    [240, 240]
  );

const kerbTexture = () =>
  canvasTexture('kerb', 64, 128, (ctx, w, h) => {
    ctx.fillStyle = '#d32f2f';
    ctx.fillRect(0, 0, w, h / 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, h / 2, w, h / 2);
    grain(ctx, w, h, 0.25);
  });

const gravelTexture = () =>
  canvasTexture('gravel', 256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#6b665c';
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 2800; i++) {
      const g = 100 + Math.random() * 110;
      ctx.fillStyle = `rgba(${g},${g * 0.95},${g * 0.85},0.65)`;
      ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
    grain(ctx, w, h, 0.3);
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
/*  Kathmandu Valley Foothills & Northern Himalayan Snow Peaks        */
/* ------------------------------------------------------------------ */

function makePeak(radius, height, seed, isNorth) {
  let g = new THREE.ConeGeometry(radius, height, 32, 20, true);
  g.deleteAttribute('normal');
  g.deleteAttribute('uv');
  g = mergeVertices(g, 1e-3);

  const pos = g.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  const snowCol = new THREE.Color();
  const rock1 = new THREE.Color('#635a4f');
  const rock2 = new THREE.Color('#3f3a34');
  const snow = new THREE.Color('#f8faff');
  const snowShade = new THREE.Color('#c6d5e5');
  const forest = new THREE.Color('#2d422a');

  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);
    const t = (y + height / 2) / height;
    const n = fbm(x * 0.02 + seed, z * 0.02 + y * 0.03, 5);
    const r = ridged(x * 0.015 + seed * 0.5, z * 0.015 + y * 0.02);

    if (t < 0.985) {
      const k = 1 + (n - 0.5) * 0.55 + (r - 0.5) * 0.35 * (0.3 + t);
      x *= k;
      z *= k;
      y += (r - 0.5) * height * 0.06;
    }
    pos.setXYZ(i, x, y, z);

    c.copy(rock1).lerp(rock2, THREE.MathUtils.clamp((n - 0.3) * 2, 0, 1));
    if (t < 0.28) c.lerp(forest, 1 - t / 0.28);

    if (isNorth) {
      // Tall Northern peaks (Ganesh/Langtang Himal) get snow lines
      const snowLine = 0.42 + (n - 0.5) * 0.3;
      let s = THREE.MathUtils.smoothstep(t, snowLine - 0.05, snowLine + 0.08);
      s *= 1 - THREE.MathUtils.smoothstep(r, 0.65, 0.88) * 0.5;
      snowCol.copy(snowShade).lerp(snow, n);
      c.lerp(snowCol, s);
    }

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
    // Ring centered on Kathmandu Ring Road
    const pts = trackCurve.getSpacedPoints(64);
    const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
    const cz = pts.reduce((s, p) => s + p.z, 0) / pts.length;

    const rnd = mulberry32(42);
    const N = 48;
    const list = [];
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2 + (rnd() - 0.5) * 0.05;
      const isNorth = Math.cos(a) < -0.2; // -Z is North in Three.js
      const R = 1300 + rnd() * 200;
      // Tall snow mountains to the North, rolling green hills to South/East/West
      const height = isNorth
        ? 220 + rnd() * 150
        : 90 + rnd() * 60;
      const radius = height * (1.1 + rnd() * 0.5);
      list.push({
        x: cx + Math.sin(a) * R,
        z: cz + Math.cos(a) * R,
        y: GROUND_Y - 10 + height / 2,
        rot: rnd() * Math.PI * 2,
        geo: makePeak(radius, height, i * 17.3, isNorth),
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
/*  Kalanki Underpass (कलंकी अन्डरपास) Landmark                       */
/* ------------------------------------------------------------------ */

export function KalankiUnderpass() {
  // Kalanki subterranean underpass dip on curve
  const point = useMemo(() => trackCurve.getPointAt(0.422), []);
  const tangent = useMemo(() => trackCurve.getTangentAt(0.422), []);
  const rotY = Math.atan2(tangent.x, tangent.z);

  return (
    <group position={[point.x, point.y, point.z]} rotation={[0, rotY, 0]}>
      {/* Concrete Retaining Walls flanking the road */}
      {[-12.2, 12.2].map((x) => (
        <group key={x} position={[x, 2.5, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[1.4, 5.0, 70]} />
            <meshStandardMaterial color="#888782" roughness={0.8} />
          </mesh>
          {/* Wall capping */}
          <mesh position={[0, 2.6, 0]}>
            <boxGeometry args={[1.8, 0.3, 70.4]} />
            <meshStandardMaterial color="#a3a29d" roughness={0.7} />
          </mesh>
        </group>
      ))}

      {/* Overhead Highway Flyover Structure spanning across the underpass */}
      <group position={[0, 6.2, 0]}>
        {/* Main bridge deck */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[26, 1.8, 14]} />
          <meshStandardMaterial color="#505256" roughness={0.7} />
        </mesh>
        {/* Concrete bridge pillars */}
        {[-11.5, 11.5].map((x) => (
          <mesh key={x} position={[x, -3.2, 0]} castShadow>
            <boxGeometry args={[2.0, 4.6, 12]} />
            <meshStandardMaterial color="#7a7974" roughness={0.8} />
          </mesh>
        ))}

        {/* Illuminated Yellow Tunnel Lights under the overpass ceiling */}
        {[-6, 0, 6].map((x) => (
          <group key={x} position={[x, -0.95, 0]}>
            <mesh>
              <boxGeometry args={[1.0, 0.15, 8.0]} />
              <meshStandardMaterial color="#fff0b3" emissive="#ffdd66" emissiveIntensity={3.5} />
            </mesh>
            <pointLight color="#ffea88" intensity={3.5} distance={20} />
          </group>
        ))}

        {/* Massive Kalanki Underpass Banner Signboard */}
        <group position={[0, 1.4, 7.1]}>
          <mesh>
            <boxGeometry args={[16, 1.6, 0.3]} />
            <meshStandardMaterial color="#005a9c" roughness={0.4} />
          </mesh>
          <Text position={[0, 0.25, 0.18]} fontSize={0.75} color="#ffffff" font={undefined} anchorX="center" anchorY="middle">
            कलंकी अन्डरपास
          </Text>
          <Text position={[0, -0.35, 0.18]} fontSize={0.48} color="#f7b500" font={undefined} anchorX="center" anchorY="middle">
            KALANKI UNDERPASS
          </Text>
        </group>
        <group position={[0, 1.4, -7.1]} rotation={[0, Math.PI, 0]}>
          <mesh>
            <boxGeometry args={[16, 1.6, 0.3]} />
            <meshStandardMaterial color="#005a9c" roughness={0.4} />
          </mesh>
          <Text position={[0, 0.25, 0.18]} fontSize={0.75} color="#ffffff" font={undefined} anchorX="center" anchorY="middle">
            कलंकी अन्डरपास
          </Text>
          <Text position={[0, -0.35, 0.18]} fontSize={0.48} color="#f7b500" font={undefined} anchorX="center" anchorY="middle">
            KALANKI UNDERPASS
          </Text>
        </group>
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Swayambhu Mahachaitya (स्वयम्भू) Hilltop Stupa                     */
/* ------------------------------------------------------------------ */

export function SwayambhuStupa() {
  // Swayambhu is situated on a hill to the west of the Ring Road (near t ~ 0.464)
  const pos = [-640, 28, -280];

  return (
    <group position={pos}>
      {/* Lush Green Swayambhu Hill Mount */}
      <mesh position={[0, -18, 0]} receiveShadow>
        <cylinderGeometry args={[45, 90, 40, 32]} />
        <meshStandardMaterial color="#365c2e" roughness={0.9} />
      </mesh>

      {/* White Stupa Hemispherical Dome (Garbha) */}
      <mesh position={[0, 8, 0]} castShadow>
        <sphereGeometry args={[16, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
        <meshStandardMaterial color="#f0f2f5" roughness={0.5} />
      </mesh>

      {/* Golden Square Harmika (with Buddha Wisdom Eyes) */}
      <mesh position={[0, 18, 0]} castShadow>
        <boxGeometry args={[7.5, 5.0, 7.5]} />
        <meshStandardMaterial color="#d49419" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* 13-Tiered Golden Conical Spire (Churamani) */}
      <mesh position={[0, 24.5, 0]} castShadow>
        <coneGeometry args={[3.8, 9.5, 24]} />
        <meshStandardMaterial color="#e6a817" metalness={0.85} roughness={0.25} />
      </mesh>

      {/* Top Gilded Pinnacle Umbrella (Gajur) */}
      <mesh position={[0, 30, 0]}>
        <sphereGeometry args={[1.2, 16, 16]} />
        <meshStandardMaterial color="#ffcc00" emissive="#ffaa00" emissiveIntensity={1.5} metalness={0.9} />
      </mesh>

      {/* Radiating Prayer Flag Strings down the hill */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const x = Math.sin(angle) * 35;
        const z = Math.cos(angle) * 35;
        return (
          <group key={i}>
            <mesh position={[x * 0.5, 12, z * 0.5]} rotation={[0, angle, -0.6]}>
              <cylinderGeometry args={[0.04, 0.04, 40, 4]} />
              <meshStandardMaterial color="#ffeedd" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Kathmandu Green Overhead Pedestrian Bridges (आकाशे पुल)           */
/* ------------------------------------------------------------------ */

function PedestrianBridge({ t, bannerText = 'शुभ विजया दशमी - HAPPY DASHAIN' }) {
  const point = trackCurve.getPointAt(t);
  const tangent = trackCurve.getTangentAt(t);
  const rotY = Math.atan2(tangent.x, tangent.z);

  return (
    <group position={[point.x, point.y, point.z]} rotation={[0, rotY, 0]}>
      {/* Main Steel Box Truss Span (crossing the 20m wide road) */}
      <mesh position={[0, 5.6, 0]} castShadow>
        <boxGeometry args={[24, 2.6, 2.8]} />
        <meshStandardMaterial color="#1f5431" metalness={0.4} roughness={0.5} />
      </mesh>

      {/* Safety Railings */}
      {[-1.3, 1.3].map((z) => (
        <mesh key={z} position={[0, 7.2, z]}>
          <boxGeometry args={[24, 0.8, 0.1]} />
          <meshStandardMaterial color="#2d7345" metalness={0.5} roughness={0.4} />
        </mesh>
      ))}

      {/* Support Columns & Dual Staircases on sidewalks */}
      {[-12.2, 12.2].map((x) => (
        <group key={x}>
          {/* Main pillar */}
          <mesh position={[x, 2.8, 0]} castShadow>
            <cylinderGeometry args={[0.55, 0.65, 5.6, 12]} />
            <meshStandardMaterial color="#1f5431" metalness={0.4} />
          </mesh>
          {/* Angled Stairway */}
          <mesh position={[x + (x > 0 ? 3.0 : -3.0), 2.6, 0]} rotation={[0, 0, x > 0 ? -0.7 : 0.7]} castShadow>
            <boxGeometry args={[7.2, 0.4, 2.2]} />
            <meshStandardMaterial color="#245d37" roughness={0.6} />
          </mesh>
        </group>
      ))}

      {/* Festive Dashain Greeting Banner */}
      <group position={[0, 5.6, 1.45]}>
        <mesh>
          <planeGeometry args={[18, 1.8]} />
          <meshStandardMaterial color="#c61a1a" roughness={0.5} />
        </mesh>
        <Text position={[0, 0.2, 0.05]} fontSize={0.68} color="#f7b500" anchorX="center" anchorY="middle">
          {bannerText.split(' - ')[0]}
        </Text>
        <Text position={[0, -0.4, 0.05]} fontSize={0.45} color="#ffffff" anchorX="center" anchorY="middle">
          {bannerText.split(' - ')[1] || 'BAJAJ DASHAIN RACING'}
        </Text>
      </group>
      <group position={[0, 5.6, -1.45]} rotation={[0, Math.PI, 0]}>
        <mesh>
          <planeGeometry args={[18, 1.8]} />
          <meshStandardMaterial color="#c61a1a" roughness={0.5} />
        </mesh>
        <Text position={[0, 0.2, 0.05]} fontSize={0.68} color="#f7b500" anchorX="center" anchorY="middle">
          {bannerText.split(' - ')[0]}
        </Text>
        <Text position={[0, -0.4, 0.05]} fontSize={0.45} color="#ffffff" anchorX="center" anchorY="middle">
          {bannerText.split(' - ')[1] || 'BAJAJ DASHAIN RACING'}
        </Text>
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Nepali Highway Cantilever Direction Signs                         */
/* ------------------------------------------------------------------ */

function HighwayGantry({ t, nepali, english, sub }) {
  const point = trackCurve.getPointAt(t);
  const tangent = trackCurve.getTangentAt(t);
  const rotY = Math.atan2(tangent.x, tangent.z);

  return (
    <group position={[point.x, point.y, point.z]} rotation={[0, rotY, 0]}>
      {/* Overhead Gantry Beam */}
      <mesh position={[0, 6.2, 0]} castShadow>
        <boxGeometry args={[23, 0.6, 0.6]} />
        <meshStandardMaterial color="#44464a" metalness={0.7} roughness={0.3} />
      </mesh>
      {[-11.5, 11.5].map((x) => (
        <mesh key={x} position={[x, 3.1, 0]} castShadow>
          <cylinderGeometry args={[0.3, 0.35, 6.2, 12]} />
          <meshStandardMaterial color="#44464a" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}

      {/* Green Highway Sign */}
      <group position={[0, 6.2, 0.35]}>
        <mesh>
          <boxGeometry args={[12, 2.2, 0.15]} />
          <meshStandardMaterial color="#006b38" roughness={0.4} />
        </mesh>
        <Text position={[0, 0.45, 0.1]} fontSize={0.65} color="#ffffff" anchorX="center" anchorY="middle">
          {nepali}
        </Text>
        <Text position={[0, -0.15, 0.1]} fontSize={0.55} color="#f7b500" anchorX="center" anchorY="middle">
          {english}
        </Text>
        {sub && (
          <Text position={[0, -0.65, 0.1]} fontSize={0.32} color="#eeeeee" anchorX="center" anchorY="middle">
            {sub}
          </Text>
        )}
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Dashain Kites (चङ्गा / Changa) Floating in Autumn Sky               */
/* ------------------------------------------------------------------ */

const KITE_COLORS = ['#e31c25', '#f7b500', '#0099ff', '#00cc44', '#9933cc'];

export function DashainKites() {
  const group = useRef();

  const kites = useMemo(() => {
    const rnd = mulberry32(88);
    return Array.from({ length: 18 }).map(() => ({
      x: (rnd() - 0.5) * 1100,
      y: 22 + rnd() * 45,
      z: (rnd() - 0.5) * 1100,
      color: KITE_COLORS[Math.floor(rnd() * KITE_COLORS.length)],
      speed: 1.2 + rnd() * 1.5,
      scale: 1.8 + rnd() * 1.4,
      rotX: -0.4 + rnd() * 0.4,
    }));
  }, []);

  useFrame(({ clock }) => {
    if (!group.current) return;
    const t = clock.elapsedTime;
    group.current.children.forEach((kite, i) => {
      kite.position.y += Math.sin(t * 1.8 + i) * 0.04;
      kite.rotation.z = Math.sin(t * 2.2 + i * 2) * 0.18;
      kite.rotation.y = Math.cos(t * 1.4 + i) * 0.15;
    });
  });

  return (
    <group ref={group}>
      {kites.map((k, i) => (
        <group key={i} position={[k.x, k.y, k.z]} scale={k.scale} rotation={[k.rotX, 0, 0]}>
          {/* Diamond Kite Body */}
          <mesh rotation={[0, 0, Math.PI / 4]}>
            <planeGeometry args={[1.4, 1.4]} />
            <meshBasicMaterial color={k.color} side={THREE.DoubleSide} />
          </mesh>
          {/* Central Bamboo Spar */}
          <mesh position={[0, 0, 0.02]}>
            <cylinderGeometry args={[0.02, 0.02, 1.9, 4]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          {/* Trailing Tail Ribbon */}
          <mesh position={[0, -1.4, 0]}>
            <planeGeometry args={[0.15, 1.8]} />
            <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Linge Ping (Traditional Bamboo Swing)                              */
/* ------------------------------------------------------------------ */

function Bamboo({ position, rotation, length = 8.5, radius = 0.1 }) {
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
  const phase = Math.abs((position?.[0] || 1) * 0.35 + (position?.[2] || 1) * 0.2) % 6;

  useFrame(({ clock }) => {
    if (swing.current) {
      swing.current.rotation.x = Math.sin(clock.elapsedTime * 1.25 + phase) * 0.25;
    }
  });

  return (
    <group position={position} rotation={rotation} scale={1.3}>
      <Bamboo position={[-1.3, 3.8, -1.3]} rotation={[0.2, 0, -0.2]} />
      <Bamboo position={[1.3, 3.8, -1.3]} rotation={[0.2, 0, 0.2]} />
      <Bamboo position={[-1.3, 3.8, 1.3]} rotation={[-0.2, 0, -0.2]} />
      <Bamboo position={[1.3, 3.8, 1.3]} rotation={[-0.2, 0, 0.2]} />

      <mesh position={[0, 7.6, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.14, 0.14, 3.2, 8]} />
        <meshStandardMaterial color="#8c6a2b" roughness={0.8} />
      </mesh>

      <group ref={swing} position={[0, 7.6, 0]}>
        {[-0.38, 0.38].map((x) => (
          <mesh key={x} position={[x, -2.4, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 4.8, 6]} />
            <meshStandardMaterial color="#d8c9a3" roughness={1} />
          </mesh>
        ))}
        <mesh position={[0, -4.8, 0]} castShadow>
          <boxGeometry args={[1.0, 0.09, 0.45]} />
          <meshStandardMaterial color="#593b13" roughness={0.85} />
        </mesh>
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Track: Kathmandu Ring Road 8-Lane Strip Mesh                      */
/* ------------------------------------------------------------------ */

function buildStrip(a, b, y, tileLen, steps = 900) {
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
    pos.push(p.x + ux * a, p.y + y, p.z + uz * a, p.x + ux * b, p.y + y, p.z + uz * b);
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

// Elevated Flyover Support Columns & Guardrails
function buildFlyoverPillars() {
  const steps = 180;
  const pillars = [];
  for (let i = 0; i < steps; i++) {
    const t = i / steps;
    const p = trackCurve.getPointAt(t);
    if (p.y >= 3.0) {
      const tg = trackCurve.getTangentAt(t);
      const nx = -tg.z;
      const nz = tg.x;
      const len = Math.hypot(nx, nz) || 1;
      const ux = nx / len;
      const uz = nz / len;
      const h = p.y - GROUND_Y;
      [-10.8, 10.8].forEach((offset) => {
        pillars.push({
          x: p.x + ux * offset,
          y: GROUND_Y + h / 2,
          z: p.z + uz * offset,
          h,
        });
      });
    }
  }
  return pillars;
}

export function Track() {
  const geos = useMemo(
    () => ({
      road: buildStrip(-10.0, 10.0, -0.01, 28, 900),
      kerbL: buildStrip(-11.2, -10.0, -0.02, 4, 900),
      kerbR: buildStrip(10.0, 11.2, -0.02, 4, 900),
      shoulderL: buildStrip(-15.0, -11.2, -0.04, 5, 900),
      shoulderR: buildStrip(11.2, 15.0, -0.04, 5, 900),
    }),
    []
  );

  const flyoverPillars = useMemo(() => buildFlyoverPillars(), []);

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
      {/* Kathmandu Valley Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, GROUND_Y, 0]} receiveShadow>
        <planeGeometry args={[5000, 5000]} />
        <meshStandardMaterial map={maps.grass} roughness={1} />
      </mesh>

      {/* Flyover Bridge Support Columns reaching from elevated highway down to ground */}
      {flyoverPillars.map((pil, idx) => (
        <mesh key={`pil-${idx}`} position={[pil.x, pil.y, pil.z]} castShadow receiveShadow>
          <cylinderGeometry args={[0.7, 0.85, pil.h, 12]} />
          <meshStandardMaterial color="#686b73" roughness={0.7} />
        </mesh>
      ))}

      {/* Sidewalks / Gravel shoulders */}
      {[geos.shoulderL, geos.shoulderR].map((g, i) => (
        <mesh key={`sh${i}`} geometry={g} receiveShadow>
          <meshStandardMaterial map={maps.gravel} roughness={1} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* Red & White Safety Kerbs */}
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

      {/* Main 8-Lane Asphalt Highway */}
      <mesh geometry={geos.road} receiveShadow>
        <meshStandardMaterial
          map={maps.asphalt}
          roughness={0.88}
          metalness={0.04}
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
/*  Traditional Nepali Houses (ढलान छाना शैली — Kathmandu Tole)       */
/* ------------------------------------------------------------------ */

// Prayer flag colours: saffron, white, red, green, blue
const PRAYER_FLAG_COLORS = ['#ff8c00', '#ffffff', '#cc1111', '#228b22', '#1a4fa0'];

function PrayerFlags({ position }) {
  return (
    <group position={position}>
      {PRAYER_FLAG_COLORS.map((col, i) => (
        <mesh key={i} position={[i * 0.55 - 1.1, 0, 0]} rotation={[0, 0, 0.12]}>
          <planeGeometry args={[0.45, 0.32]} />
          <meshStandardMaterial color={col} roughness={0.9} side={THREE.DoubleSide} transparent opacity={0.88} />
        </mesh>
      ))}
      {/* Rope */}
      <mesh position={[0, 0.18, 0]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 3.0, 4]} />
        <meshStandardMaterial color="#c8b88a" roughness={1} />
      </mesh>
    </group>
  );
}

function NepaliHouse({ position, rotation, floors = 2, width = 5.5, variant = 0 }) {
  const height = floors * 2.9;
  const roofH = 1.9 + variant * 0.3;
  // Colour palette: aged terracotta brick with slight variety
  const brickColors = ['#c47c5a', '#b8694a', '#c98060', '#bf7555'];
  const brickCol = brickColors[variant % brickColors.length];
  const roofCol = '#6e1c00';
  const woodCol = '#3a1f07';
  const trimCol = '#e8d5b0'; // cream plaster trim

  return (
    <group position={position} rotation={rotation}>
      {/* Main Brick Body */}
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, height, 4.8]} />
        <meshStandardMaterial color={brickCol} roughness={0.92} />
      </mesh>

      {/* White plaster band between floors */}
      {floors > 1 && (
        <mesh position={[0, height / 2 - 0.08, 0]}>
          <boxGeometry args={[width + 0.06, 0.22, 4.86]} />
          <meshStandardMaterial color={trimCol} roughness={0.85} />
        </mesh>
      )}

      {/* Terracotta Gable Roof (4-sided hipped) */}
      <mesh position={[0, height + roofH * 0.5, 0]} castShadow>
        <coneGeometry args={[width * 0.68, roofH * 1.1, 4]} />
        <meshStandardMaterial color={roofCol} roughness={0.88} />
      </mesh>
      {/* Roof overhang lip */}
      <mesh position={[0, height + 0.06, 0]}>
        <boxGeometry args={[width + 1.0, 0.18, 5.8]} />
        <meshStandardMaterial color={roofCol} roughness={0.9} />
      </mesh>

      {/* Wooden Windows (upper floor) */}
      {[-1.5, 0, 1.5].map((wx) => (
        <group key={`wu-${wx}`} position={[wx, height * 0.72, 2.45]}>
          <mesh>
            <boxGeometry args={[0.75, 1.0, 0.1]} />
            <meshStandardMaterial color={woodCol} roughness={0.75} />
          </mesh>
          {/* Window frame divider */}
          <mesh position={[0, 0, 0.06]}>
            <boxGeometry args={[0.08, 0.95, 0.06]} />
            <meshStandardMaterial color="#6b3c14" roughness={0.7} />
          </mesh>
        </group>
      ))}

      {/* Ground Floor Shopfront Recess / Door */}
      <mesh position={[0, 0.9, 2.46]}>
        <boxGeometry args={[1.0, 1.8, 0.08]} />
        <meshStandardMaterial color={woodCol} roughness={0.7} />
      </mesh>
      {/* Side shop windows ground floor */}
      {[-1.5, 1.5].map((wx) => (
        <mesh key={`wl-${wx}`} position={[wx, 0.75, 2.46]}>
          <boxGeometry args={[0.8, 0.9, 0.08]} />
          <meshStandardMaterial color={woodCol} roughness={0.7} />
        </mesh>
      ))}

      {/* Carved wooden roof bracket decoration */}
      {[-width / 2 + 0.4, 0, width / 2 - 0.4].map((bx) => (
        <mesh key={`br-${bx}`} position={[bx, height - 0.12, 2.56]} castShadow>
          <boxGeometry args={[0.35, 0.28, 0.22]} />
          <meshStandardMaterial color="#2e1206" roughness={0.8} />
        </mesh>
      ))}

      {/* Prayer flags strung from roof */}
      <PrayerFlags position={[0, height + roofH + 0.05, 0]} />
    </group>
  );
}

// Scatter 32 houses along the track in clusters, keeping clear of mega-ramp zones
const RAMP_T_ZONES = [0.08, 0.22, 0.38, 0.58, 0.68, 0.75, 0.84, 0.94];
function isTooCloseToRamp(t) {
  return RAMP_T_ZONES.some((rt) => Math.abs(t - rt) < 0.04);
}

function NepaliHouses() {
  const houses = useMemo(() => {
    const rnd = mulberry32(777);
    const list = [];
    // Place houses from t=0.0 to t=0.65 (before city skyscrapers take over)
    // and also t=0.80 to 0.87 (Chabahil suburban zone)
    const zones = [
      { start: 0.03, end: 0.60, count: 22 },
      { start: 0.80, end: 0.87, count: 8 },
    ];

    zones.forEach((zone) => {
      for (let i = 0; i < zone.count; i++) {
        const rawT = zone.start + (i / zone.count) * (zone.end - zone.start);
        if (isTooCloseToRamp(rawT)) continue;
        const t = rawT;
        const p = trackCurve.getPointAt(t);
        const tg = trackCurve.getTangentAt(t);
        const norm = new THREE.Vector3(-tg.z, 0, tg.x).normalize();
        const side = i % 2 === 0 ? 1 : -1;
        // Keep 18-32m from road centre so they're visible but not obstructing
        const dist = 18 + rnd() * 14;
        const floors = rnd() > 0.4 ? (rnd() > 0.5 ? 3 : 2) : 2;
        const width = 4.5 + rnd() * 2.5;
        const variant = Math.floor(rnd() * 4);
        const rotY = Math.atan2(tg.x, tg.z) + (side > 0 ? 0 : Math.PI) + (rnd() - 0.5) * 0.25;
        list.push({
          x: p.x + norm.x * dist * side,
          y: p.y,
          z: p.z + norm.z * dist * side,
          rotY,
          floors,
          width,
          variant,
        });
      }
    });
    return list;
  }, []);

  return (
    <group>
      {houses.map((h, idx) => (
        <NepaliHouse
          key={`nh-${idx}`}
          position={[h.x, h.y, h.z]}
          rotation={[0, h.rotY, 0]}
          floors={h.floors}
          width={h.width}
          variant={h.variant}
        />
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Solar Highway Streetlights along Outer Road Shoulders             */
/* ------------------------------------------------------------------ */

function RoadsideStreetlights({ count = 70 }) {
  const polesRef = useRef();

  useLayoutEffect(() => {
    const dummy = new THREE.Object3D();
    let k = 0;
    for (let i = 0; i < count; i++) {
      const t = i / count;
      const p = trackCurve.getPointAt(t);
      const tg = trackCurve.getTangentAt(t);
      const norm = new THREE.Vector3(-tg.z, 0, tg.x).normalize();
      const rotY = Math.atan2(tg.x, tg.z);

      // Place lamps on BOTH outer roadside shoulders (12.2m to left and right)
      [-1, 1].forEach((side) => {
        dummy.position.set(p.x + norm.x * 12.2 * side, p.y, p.z + norm.z * 12.2 * side);
        dummy.rotation.set(0, rotY + (side > 0 ? 0 : Math.PI), 0);
        dummy.updateMatrix();
        polesRef.current.setMatrixAt(k, dummy.matrix);
        k++;
      });
    }
    polesRef.current.instanceMatrix.needsUpdate = true;
  }, [count]);

  const poleGeo = useMemo(() => {
    // Single-arm cantilever highway lamp post angled over the roadway
    const parts = [];
    const mainPole = new THREE.CylinderGeometry(0.12, 0.16, 7.5, 8);
    mainPole.translate(0, 3.75, 0);
    parts.push(mainPole);

    const crossArm = new THREE.BoxGeometry(2.5, 0.14, 0.14);
    crossArm.translate(-1.0, 7.3, 0);
    parts.push(crossArm);

    const solarPanel = new THREE.BoxGeometry(1.6, 0.08, 1.0);
    solarPanel.rotateX(-0.35);
    solarPanel.translate(-1.0, 7.7, 0);
    parts.push(solarPanel);

    return mergeGeometries(parts);
  }, []);

  return (
    <instancedMesh ref={polesRef} args={[poleGeo, undefined, count * 2]} castShadow frustumCulled={false}>
      <meshStandardMaterial color="#60646c" metalness={0.65} roughness={0.35} />
    </instancedMesh>
  );
}

/* ------------------------------------------------------------------ */
/*  Roblox-Style City Skyscrapers & Neon Billboards                   */
/* ------------------------------------------------------------------ */

const NEON_COLORS = ['#00e5ff', '#ff007f', '#f7b500', '#00ff88', '#9d00ff'];

function RobloxCityBuildings() {
  const buildings = useMemo(() => {
    const list = [];
    const rnd = mulberry32(101);
    // Gongabu Boulevard to Maharajgunj urban sectors (t: 0.65 to 0.79)
    // and Airport runway sector (t: 0.88 to 0.96)
    const sectors = [
      { start: 0.65, end: 0.79, count: 18 },
      { start: 0.88, end: 0.96, count: 10 },
    ];

    sectors.forEach((sec) => {
      for (let i = 0; i < sec.count; i++) {
        const t = sec.start + (i / sec.count) * (sec.end - sec.start);
        const p = trackCurve.getPointAt(t);
        const tg = trackCurve.getTangentAt(t);
        const norm = new THREE.Vector3(-tg.z, 0, tg.x).normalize();
        const side = i % 2 === 0 ? 1 : -1;
        const dist = 24 + rnd() * 18;
        const width = 16 + rnd() * 12;
        const depth = 14 + rnd() * 10;
        const height = 28 + rnd() * 45;
        const neonColor = NEON_COLORS[Math.floor(rnd() * NEON_COLORS.length)];
        const rotY = Math.atan2(tg.x, tg.z) + (rnd() - 0.5) * 0.2;

        list.push({
          x: p.x + norm.x * dist * side,
          y: p.y + height / 2 - 0.6,
          z: p.z + norm.z * dist * side,
          width,
          depth,
          height,
          neonColor,
          rotY,
          hasBillboard: rnd() > 0.45,
          billboardText: rnd() > 0.5 ? 'BAJAJ PULSAR' : 'HAPPY DASHAIN',
        });
      }
    });

    return list;
  }, []);

  return (
    <group>
      {buildings.map((b, idx) => (
        <group key={`bldg-${idx}`} position={[b.x, b.y, b.z]} rotation={[0, b.rotY, 0]}>
          {/* Main Skyscraper Body */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[b.width, b.height, b.depth]} />
            <meshStandardMaterial color="#1a202c" roughness={0.4} metalness={0.7} />
          </mesh>

          {/* Glowing Roblox Neon Roof Trim */}
          <mesh position={[0, b.height / 2 + 0.3, 0]}>
            <boxGeometry args={[b.width + 0.6, 0.6, b.depth + 0.6]} />
            <meshStandardMaterial
              color={b.neonColor}
              emissive={b.neonColor}
              emissiveIntensity={2.5}
              roughness={0.2}
            />
          </mesh>

          {/* Rooftop Antenna / Spire with Red Warning Beacon */}
          <mesh position={[0, b.height / 2 + 3.5, 0]}>
            <cylinderGeometry args={[0.08, 0.25, 7.0, 6]} />
            <meshStandardMaterial color="#718096" metalness={0.9} />
          </mesh>
          <mesh position={[0, b.height / 2 + 7.2, 0]}>
            <sphereGeometry args={[0.35, 8, 8]} />
            <meshStandardMaterial color="#ff0044" emissive="#ff0044" emissiveIntensity={5} />
          </mesh>

          {/* Luminous High-Tech Billboard */}
          {b.hasBillboard && (
            <group position={[0, b.height * 0.2, b.depth / 2 + 0.25]}>
              <mesh>
                <boxGeometry args={[b.width * 0.75, 5.5, 0.3]} />
                <meshStandardMaterial color="#0b0f19" roughness={0.3} />
              </mesh>
              <Text
                position={[0, 0.3, 0.2]}
                fontSize={1.2}
                color={b.neonColor}
                anchorX="center"
                anchorY="middle"
              >
                {b.billboardText}
              </Text>
              <Text
                position={[0, -1.2, 0.2]}
                fontSize={0.65}
                color="#ffffff"
                anchorX="center"
                anchorY="middle"
              >
                DEFINITELY MALE • 2083
              </Text>
            </group>
          )}
        </group>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Scene Decorations: Kathmandu Ring Road Master Environment         */
/* ------------------------------------------------------------------ */

export function EnvironmentDecorations() {
  return (
    <>
      <Himalayas />
      <KalankiUnderpass />
      <SwayambhuStupa />
      <DashainKites />
      <NepaliHouses />
      <RoadsideStreetlights count={70} />
      <RobloxCityBuildings />

      {/* Overhead Pedestrian Bridges (आकाशे पुल) at key sectors */}
      <PedestrianBridge t={0.06} bannerText="शुभ विजया दशमी - KOTESHWOR" />
      <PedestrianBridge t={0.28} bannerText="बल्खु चोक - BALKHU SECTOR" />
      <PedestrianBridge t={0.62} bannerText="नयाँ बसपार्क - GONGABU BUS PARK" />
      <PedestrianBridge t={0.73} bannerText="महाराजगन्ज - NARAYAN GOPAL CHOWK" />

      {/* Overhead Highway Direction Signs */}
      <HighwayGantry t={0.02} nepali="कोटेश्वर चोक" english="KOTESHWOR INTERCHANGE" sub="<- भक्तपुर Bhaktapur | विमानस्थल TIA ->" />
      <HighwayGantry t={0.14} nepali="सातदोबाटो" english="SATDOBATO CHOWK" sub="पाटन Patan | गोदावरी Godawari" />
      <HighwayGantry t={0.35} nepali="कलंकी अन्डरपास" english="KALANKI UNDERPASS" sub="थानकोट Thankot | नागढुंगा Highway" />
      <HighwayGantry t={0.45} nepali="स्वयम्भू महाचैत्य" english="SWAYAMBHU STUPA" sub="Monkey Temple Corridor" />
      <HighwayGantry t={0.54} nepali="बालाजु बाइपास" english="BALAJU BYPASS" sub="नुवाकोट Nuwakot | माछापोखरी" />
      <HighwayGantry t={0.79} nepali="चावहिल / बौद्ध" english="CHABAHIL / BOUDHA" sub="पशुपतिनाथ Pashupatinath" />
      <HighwayGantry t={0.88} nepali="त्रिभुवन विमानस्थल" english="TRIBHUVAN AIRPORT" sub="Runway Approach Straight" />

      {/* Linge Ping (Dashain Bamboo Swings) in roadside green spaces */}
      {[0.12, 0.22, 0.52, 0.82].map((t, idx) => {
        const pt = trackCurve.getPointAt(t);
        const tg = trackCurve.getTangentAt(t);
        const normal = new THREE.Vector3(-tg.z, 0, tg.x).normalize();
        const side = idx % 2 === 0 ? 1 : -1;
        return (
          <LingePing
            key={idx}
            position={[pt.x + normal.x * 24 * side, pt.y || 0, pt.z + normal.z * 24 * side]}
            rotation={[0, Math.atan2(tg.x, tg.z) + (side > 0 ? 0.3 : -0.3), 0]}
          />
        );
      })}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Obstacles: Bajaj Barricades & Traffic Hazards                      */
/* ------------------------------------------------------------------ */

function Barricade({ obs, index }) {
  const lampA = useRef();
  const lampB = useRef();

  useFrame(({ clock }) => {
    const on = Math.sin(clock.elapsedTime * 6 + index) > 0;
    if (lampA.current) lampA.current.emissiveIntensity = on ? 4 : 0.2;
    if (lampB.current) lampB.current.emissiveIntensity = on ? 0.2 : 4;
  });

  return (
    <group position={[obs.x, obs.y || 0, obs.z]} rotation={[0, obs.rotation || 0, 0]}>
      {[-1.3, 1.3].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.08, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.5, 0.16, 0.5]} />
            <meshStandardMaterial color="#888782" roughness={0.9} />
          </mesh>
          <mesh position={[x, 0.9, 0]} rotation={[0, 0, x < 0 ? 0.2 : -0.2]} castShadow>
            <boxGeometry args={[0.15, 1.7, 0.15]} />
            <meshStandardMaterial color="#2a2a2c" roughness={0.5} metalness={0.6} />
          </mesh>
        </group>
      ))}

      <mesh position={[0, 1.15, 0.05]} castShadow>
        <boxGeometry args={[2.8, 0.42, 0.1]} />
        <meshStandardMaterial color="#ffffff" roughness={0.4} />
      </mesh>
      <Text position={[0, 1.15, 0.11]} fontSize={0.26} color="#0033cc" anchorX="center" anchorY="middle">
        BAJAJ
      </Text>

      <mesh position={[0, 0.52, 0.05]} castShadow>
        <boxGeometry args={[3.0, 0.46, 0.1]} />
        <meshStandardMaterial color="#ff5500" roughness={0.45} />
      </mesh>
      <Text position={[0, 0.52, 0.11]} fontSize={0.28} color="#ffffff" anchorX="center" anchorY="middle">
        SLOW DOWN
      </Text>

      <mesh position={[-1.2, 1.7, 0]}>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial ref={lampA} color="#ffaa00" emissive="#ffcc00" emissiveIntensity={4} />
      </mesh>
      <mesh position={[1.2, 1.7, 0]}>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial ref={lampB} color="#ffaa00" emissive="#ffcc00" emissiveIntensity={0.2} />
      </mesh>
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
/*  Finish Line at Koteshwor (कोटेश्वर)                                */
/* ------------------------------------------------------------------ */

export function FinishLine() {
  const point = trackCurve.getPointAt(0);
  const tangent = trackCurve.getTangentAt(0);
  const rotation = Math.atan2(tangent.x, tangent.z);
  const checker = useMemo(() => checkerTexture(), []);

  return (
    <group position={[point.x, point.y || 0, point.z]} rotation={[0, rotation, 0]}>
      {/* Checkered Finish Carpet across all lanes */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <planeGeometry args={[20, 5]} />
        <meshStandardMaterial
          map={checker}
          roughness={0.8}
          polygonOffset
          polygonOffsetFactor={-4}
          polygonOffsetUnits={-4}
        />
      </mesh>

      {/* Massive Overhead Finish Gantry */}
      {[-11.5, 11.5].map((x) => (
        <mesh key={x} position={[x, 4.0, 0]} castShadow>
          <cylinderGeometry args={[0.35, 0.42, 8.0, 14]} />
          <meshStandardMaterial color="#c8211f" roughness={0.45} metalness={0.4} />
        </mesh>
      ))}

      <mesh position={[0, 7.8, 0]} castShadow>
        <boxGeometry args={[23.6, 1.8, 0.4]} />
        <meshStandardMaterial color="#111215" roughness={0.5} />
      </mesh>

      <Text position={[0, 7.9, 0.22]} fontSize={1.1} color="#f7b500" anchorX="center" anchorY="middle">
        KOTESHWOR FINISH
      </Text>
      <Text position={[0, 7.15, 0.22]} fontSize={0.55} color="#ffffff" anchorX="center" anchorY="middle">
        कोटेश्वर - BAJAJ DASHAIN RACING
      </Text>
      <Text position={[0, 7.9, -0.22]} rotation={[0, Math.PI, 0]} fontSize={1.1} color="#f7b500" anchorX="center" anchorY="middle">
        KOTESHWOR FINISH
      </Text>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Atmosphere & Dynamic Lighting (Sun follows player bike)           */
/* ------------------------------------------------------------------ */

const SUN = [240, 200, -220]; // Autumn sun lighting the valley and mountains

export function Atmosphere({ sun = SUN, followRef, shadowSize = 2048 }) {
  const light = useRef();
  const target = useMemo(() => new THREE.Object3D(), []);
  const offset = useMemo(() => new THREE.Vector3(...sun).normalize().multiplyScalar(130), [sun]);
  const sunDir = useMemo(() => new THREE.Vector3(...sun).normalize().multiplyScalar(30), [sun]);

  useLayoutEffect(() => {
    if (light.current) light.current.target = target;
  }, [target]);

  useFrame(() => {
    const p = followRef?.current?.position;
    if (!p || !light.current) return;
    light.current.position.set(p.x + offset.x, p.y + offset.y, p.z + offset.z);
    target.position.set(p.x, p.y, p.z);
    target.updateMatrixWorld();
  });

  return (
    <>
      <fog attach="fog" args={['#d6e5f5', 280, 2800]} />
      <Sky distance={450000} sunPosition={sun} turbidity={3.5} rayleigh={1.1} mieCoefficient={0.004} mieDirectionalG={0.82} />

      <Environment resolution={256} frames={1}>
        <color attach="background" args={['#96b5d8']} />
        <Lightformer form="rect" intensity={1.5} color="#cfe5ff" position={[0, 25, 0]} scale={[70, 70, 1]} onUpdate={(s) => s.lookAt(0, 0, 0)} />
        <Lightformer form="rect" intensity={6.5} color="#fff1d0" position={[sunDir.x, sunDir.y, sunDir.z]} scale={[12, 12, 1]} onUpdate={(s) => s.lookAt(0, 0, 0)} />
        <Lightformer form="rect" intensity={0.6} color="#3d6138" position={[0, -10, 0]} scale={[70, 70, 1]} onUpdate={(s) => s.lookAt(0, 0, 0)} />
      </Environment>

      <hemisphereLight args={['#dcebfa', '#3e5c38', 0.45]} />
      <directionalLight
        ref={light}
        position={sun}
        intensity={2.4}
        color="#fff4e0"
        castShadow
        shadow-mapSize={[shadowSize, shadowSize]}
        shadow-bias={-0.0004}
        shadow-camera-left={-85}
        shadow-camera-right={85}
        shadow-camera-top={85}
        shadow-camera-bottom={-85}
        shadow-camera-near={1}
        shadow-camera-far={450}
      />
      <primitive object={target} />
    </>
  );
}
