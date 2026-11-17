import * as THREE from 'three';

// 3D Kathmandu Ring Road Circuit with Elevation, S-Curves, Bridges & Straights
export const RING_ROAD_POINTS = [
  new THREE.Vector3(450, 0, 100),     // 0. Koteshwor (Start/Finish Line - Flat mega-straight)
  new THREE.Vector3(380, 0, 260),     // 1. Gwarko Approach
  new THREE.Vector3(260, 10, 420),    // 2. Gwarko Flyover Climb (+10m)
  new THREE.Vector3(120, 14, 480),    // 3. Lalitpur Skybridge Peak (+14m)
  new THREE.Vector3(-40, 6, 460),     // 4. Satdobato Descent (+6m)
  new THREE.Vector3(-180, 0, 380),    // 5. Ekantakuna S-Curve Right
  new THREE.Vector3(-280, 0, 420),    // 6. Ekantakuna S-Curve Left
  new THREE.Vector3(-420, 5, 300),    // 7. Balkhu Bagmati Bridge (+5m over river)
  new THREE.Vector3(-520, 0, 150),    // 8. Kalanki Approach Downhill
  new THREE.Vector3(-580, -6, 0),     // 9. Kalanki Underpass Tunnel Dip (-6m Subterranean)
  new THREE.Vector3(-540, 2, -160),   // 10. Kalanki Tunnel Exit Climb
  new THREE.Vector3(-580, 16, -320),  // 11. Swayambhu Mountain Vista Climb (+16m Crest)
  new THREE.Vector3(-480, 12, -460),  // 12. Swayambhu Stupa Curve
  new THREE.Vector3(-340, 2, -560),   // 13. Balaju Downhill Roller-coaster
  new THREE.Vector3(-180, 0, -620),   // 14. Gongabu New Bus Park Urban Entry
  new THREE.Vector3(0, 0, -640),      // 15. Gongabu Central Boulevard Mega-Straight
  new THREE.Vector3(180, 6, -620),    // 16. Maharajgunj Flyover (+6m)
  new THREE.Vector3(300, 2, -520),    // 17. Chabahil Stupa Corridor
  new THREE.Vector3(420, 0, -360),    // 18. Boudha Approach S-Curve
  new THREE.Vector3(490, 0, -180),    // 19. Airport Runway Mega-Straight (Flat 400m speed run)
];

// Closed Catmull-Rom spline curve with high division resolution for glass-smooth interpolation
export const trackCurve = new THREE.CatmullRomCurve3(RING_ROAD_POINTS, true, 'centripetal', 0.5);
trackCurve.arcLengthDivisions = 2000;
trackCurve.updateArcLengths();

// Total length of the circuit
export const TRACK_LENGTH = trackCurve.getLength();

// Detailed Kathmandu Ring Road Checkpoints
export const RING_ROAD_CHECKPOINTS = [
  { id: 'koteshwor', name: 'Koteshwor', nepali: 'कोटेश्वर', desc: 'Grand Start / Finish Mega-Straight', t: 0.0, x: 450, y: 0, z: 100 },
  { id: 'gwarko', name: 'Gwarko Flyover', nepali: 'ग्वार्को फ्लाईओभर', desc: 'Lalitpur Skybridge (+14m)', t: 0.149, x: 121.6, y: 14, z: 479.8 },
  { id: 'satdobato', name: 'Satdobato', nepali: 'सातदोबाटो', desc: 'Patan Gateway Descent', t: 0.195, x: -39, y: 6, z: 460.3 },
  { id: 'ekantakuna', name: 'Ekantakuna', nepali: 'एकान्तकुना', desc: 'Technical S-Curve Chicane', t: 0.272, x: -279.4, y: 0, z: 420.1 },
  { id: 'balkhu', name: 'Balkhu Bridge', nepali: 'बल्खु पुल', desc: 'Bagmati River High Bridge', t: 0.325, x: -420.2, y: 5, z: 299.7 },
  { id: 'kalanki', name: 'Kalanki Underpass', nepali: 'कलंकी अन्डरपास', desc: 'Subterranean Tunnel (-6m)', t: 0.422, x: -580.1, y: -6, z: -1 },
  { id: 'swayambhu', name: 'Swayambhu Vista', nepali: 'स्वयम्भू', desc: 'Sacred Hill Crest (+16m)', t: 0.516, x: -579.8, y: 16, z: -321.1 },
  { id: 'balaju', name: 'Balaju Roller-coaster', nepali: 'बालाजु', desc: 'High-Speed Downhill Curves', t: 0.614, x: -338.6, y: 1.9, z: -560.7 },
  { id: 'gongabu', name: 'Gongabu Boulevard', nepali: 'गोंगबु', desc: 'Roblox City Center Straight', t: 0.713, x: 0.2, y: 0, z: -640 },
  { id: 'maharajgunj', name: 'Maharajgunj', nepali: 'महाराजगन्ज', desc: 'Narayan Gopal Flyover (+6m)', t: 0.764, x: 179, y: 6, z: -620.4 },
  { id: 'chabahil', name: 'Chabahil', nepali: 'चावहिल', desc: 'Stupa Corridor S-Bends', t: 0.809, x: 300.8, y: 2, z: -519.1 },
  { id: 'airport', name: 'Airport Runway', nepali: 'विमानस्थल', desc: '400m Nitro High-Speed Straight', t: 0.92, x: 490, y: 0, z: -179.7 },
];

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
