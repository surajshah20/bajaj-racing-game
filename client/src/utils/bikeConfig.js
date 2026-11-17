/**
 * Bajaj Motorcycle Catalog & Performance Tuning Configurations
 */
export const BAJAJ_BIKES = [
  {
    id: 'pulsar-220f',
    name: 'Bajaj Pulsar 220F',
    nepali: 'पल्सर २२० एफ',
    tagline: 'The Legendary Highway Master',
    color: '#e31c25', // Racing Crimson Red
    accentColor: '#ffffff',
    topSpeed: 48,       // ~120 km/h base
    nitroTopSpeed: 68,  // ~162 km/h boosted
    accel: 38,
    handling: 88,
    stats: { speed: 92, accel: 86, handling: 88 },
    description: 'Legendary half-faired aerodynamics, brutal mid-range power, and effortless highway cruising across Kathmandu Ring Road.',
    badge: 'HIGHWAY LEGEND',
  },
  {
    id: 'pulsar-ns200',
    name: 'Bajaj Pulsar NS200',
    nepali: 'पल्सर एनएस २००',
    tagline: 'Naked Street Fighter',
    color: '#0066ff', // Electric Neon Blue
    accentColor: '#f7b500',
    topSpeed: 46,       // ~115 km/h base
    nitroTopSpeed: 65,  // ~156 km/h boosted
    accel: 42,          // Snappier initial acceleration
    handling: 98,       // Razor-sharp cornering
    stats: { speed: 88, accel: 94, handling: 98 },
    description: 'Perimeter frame engineering with razor-sharp steering agility, ideal for dodging traffic barricades and grabbing tight coins.',
    badge: 'AGILITY SPECIALIST',
  },
  {
    id: 'dominar-400',
    name: 'Bajaj Dominar 400',
    nepali: 'डोमिनार ४००',
    tagline: 'Hyper Tourer Beast',
    color: '#1c1d22', // Stealth Phantom Black
    accentColor: '#00e5ff',
    topSpeed: 51,       // ~126 km/h base
    nitroTopSpeed: 71,  // ~170 km/h boosted
    accel: 40,
    handling: 82,       // Solid heavy cruising
    stats: { speed: 98, accel: 90, handling: 82 },
    description: 'Unmatched 400cc highway torque and high-speed stability, slicing through the long straights of Gongabu and Airport Runway.',
    badge: 'HYPER POWER',
  },
];
