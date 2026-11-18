import * as THREE from 'three';

// 3D Kathmandu Ring Road Circuit
// ALL elevations are >= 0 so the bike is ALWAYS on or above the road surface.
// The ground plane sits at y = -1.2, so the road (y >= 0) is always 100% visible and never clips into grass.
export const RING_ROAD_POINTS = [
  new THREE.Vector3( 420,  0.0,   80),   //  0. Koteshwor Start/Finish – Flat wide mega-straight
  new THREE.Vector3( 340,  0.0,  240),   //  1. Gwarko Approach
  new THREE.Vector3( 200,  8.0,  400),   //  2. Gwarko Flyover Climb (+8m elevation)
  new THREE.Vector3(  60, 12.0,  460),   //  3. Lalitpur Skybridge Peak (+12m high flyover)
  new THREE.Vector3( -80,  5.0,  440),   //  4. Satdobato Descent (+5m)
  new THREE.Vector3(-200,  0.0,  360),   //  5. Ekantakuna S-Curve Right
  new THREE.Vector3(-300,  0.0,  400),   //  6. Ekantakuna S-Curve Left
  new THREE.Vector3(-420,  4.0,  280),   //  7. Balkhu Bagmati Bridge (+4m river bridge)
  new THREE.Vector3(-500,  0.0,  120),   //  8. Kalanki Approach
  new THREE.Vector3(-540,  0.0,  -40),   //  9. Kalanki Underpass / Chowk – Ground level highway (no underground dip!)
  new THREE.Vector3(-500,  2.0, -180),   // 10. Kalanki Exit
  new THREE.Vector3(-520, 14.0, -320),   // 11. Swayambhu Mountain Vista Crest (+14m mountain climb)
  new THREE.Vector3(-420, 10.0, -460),   // 12. Swayambhu Stupa Curve (+10m vista view)
  new THREE.Vector3(-280,  2.0, -540),   // 13. Balaju Downhill Roller-coaster
  new THREE.Vector3(-140,  0.0, -600),   // 14. Gongabu New Bus Park Urban Straight
  new THREE.Vector3(  20,  0.0, -620),   // 15. Gongabu Central Boulevard Mega-Straight
  new THREE.Vector3( 180,  5.0, -600),   // 16. Maharajgunj Flyover (+5m overpass)
  new THREE.Vector3( 300,  2.0, -500),   // 17. Chabahil Stupa Corridor
  new THREE.Vector3( 420,  0.0, -340),   // 18. Boudha Approach S-Curve
  new THREE.Vector3( 480,  0.0, -160),   // 19. Airport Runway 400m Nitro Straight
];

// Closed Catmull-Rom spline with high arc-length division resolution
export const trackCurve = new THREE.CatmullRomCurve3(RING_ROAD_POINTS, true, 'centripetal', 0.5);
trackCurve.arcLengthDivisions = 2000;
trackCurve.updateArcLengths();

export const TRACK_LENGTH = trackCurve.getLength();

// Detailed Kathmandu Ring Road Checkpoints with exact XYZ points for minimap
const BASE_CHECKPOINTS = [
  { id: 'koteshwor',   name: 'Koteshwor',          nepali: 'कोटेश्वर',         desc: 'Grand Start / Finish Mega-Straight',    t: 0.00 },
  { id: 'gwarko',      name: 'Gwarko Flyover',      nepali: 'ग्वार्को फ्लाईओभर',   desc: 'Lalitpur Skybridge (+12m)',             t: 0.15 },
  { id: 'satdobato',   name: 'Satdobato',           nepali: 'सातदोबाटो',         desc: 'Patan Gateway Descent',                 t: 0.20 },
  { id: 'ekantakuna',  name: 'Ekantakuna',          nepali: 'एकान्तकुना',         desc: 'Technical S-Curve Chicane',             t: 0.27 },
  { id: 'balkhu',      name: 'Balkhu Bridge',       nepali: 'बल्खु पुल',         desc: 'Bagmati River Bridge (+4m)',            t: 0.33 },
  { id: 'kalanki',     name: 'Kalanki Underpass',   nepali: 'कलंकी अन्डरपास',     desc: 'Kathmandu Gateway Flyover',             t: 0.42 },
  { id: 'swayambhu',   name: 'Swayambhu Vista',     nepali: 'स्वयम्भू',          desc: 'Sacred Hill Crest (+14m)',             t: 0.52 },
  { id: 'balaju',      name: 'Balaju Roller-coaster',nepali: 'बालाजु',           desc: 'High-Speed Downhill Curves',           t: 0.61 },
  { id: 'gongabu',     name: 'Gongabu Boulevard',   nepali: 'गोंगबु',            desc: 'Roblox City Center Straight',          t: 0.71 },
  { id: 'maharajgunj', name: 'Maharajgunj',         nepali: 'महाराजगन्ज',         desc: 'Narayan Gopal Flyover (+5m)',          t: 0.76 },
  { id: 'chabahil',    name: 'Chabahil',            nepali: 'चावहिल',            desc: 'Stupa Corridor S-Bends',               t: 0.81 },
  { id: 'airport',     name: 'Airport Runway',      nepali: 'विमानस्थल',         desc: '400m Nitro High-Speed Straight',       t: 0.92 },
];

export const RING_ROAD_CHECKPOINTS = BASE_CHECKPOINTS.map((cp) => {
  const pt = trackCurve.getPointAt(cp.t);
  return {
    ...cp,
    x: pt.x,
    y: pt.y,
    z: pt.z,
  };
});

export const CHECKPOINTS = RING_ROAD_CHECKPOINTS;

export function getNearestCheckpoint(progressRatio) {
  const norm = ((progressRatio % 1) + 1) % 1;
  let active = RING_ROAD_CHECKPOINTS[0];
  for (let i = 0; i < RING_ROAD_CHECKPOINTS.length; i++) {
    const cp = RING_ROAD_CHECKPOINTS[i];
    if (norm >= cp.t - 0.035 && norm <= cp.t + 0.055) {
      active = cp;
      break;
    }
  }
  return active;
}
