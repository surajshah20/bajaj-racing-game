# 🏍️ Bajaj Dashain Racing – Kathmandu Ring Road (काठमाडौँ चक्रपथ)

A high-performance 3D browser arcade racing game built with **React 19, Three.js, React Three Fiber (R3F), and Web Audio API**, celebrating the Nepali festival of Dashain along the iconic **Kathmandu Ring Road**.

---

## 🌟 Highlights & Features

### 🛣️ Kathmandu Ring Road Circuit (काठमाडौँ चक्रपथ)
- **Authentic Circuit Geometry:** Modeled after the 27km Kathmandu Ring Road loop using closed Catmull-Rom centripetal splines (~3,300 world units).
- **8-Lane Highway Asphalt:** Realistic multi-lane asphalt texturing with solid yellow safety lines, dashed lane dividers, and red/white safety kerbs.
- **Iconic Kathmandu Landmarks:**
  - **कलंकी अन्डरपास (Kalanki Underpass):** Concrete retaining walls, overhead highway overpass, illuminated tunnel ceiling lighting, and bilingual highway signage.
  - **स्वयम्भू महाचैत्य (Swayambhu Stupa):** Hilltop white dome (garbha), golden harmika with Buddha wisdom eyes, 13-tiered conical spire, and radiating prayer flags overlooking the highway.
  - **पैदल यात्री आकाशे पुल (Pedestrian Bridges):** Classic green steel overhead truss pedestrian bridges spanning across the 20m expressway at Koteshwor, Balkhu, Gongabu, and Maharajgunj.
  - **Nepali Overhead Highway Gantries:** Highway direction signboards in Nepali and English (Koteshwor, Satdobato, Kalanki, Swayambhu, Balaju, Maharajgunj, Chabahil, Airport).
  - **Northern Himalayan Snow Peaks:** Towering snow ranges (Ganesh & Langtang Himal) along the northern horizon, complemented by lush green Kathmandu Valley foothills (Chandragiri, Shivapuri, Nagarjun).
  - **Dashain Festival Atmosphere:** High-flying colorful paper kites (*चङ्गा / Changa*) soaring in the autumn sky, traditional bamboo swings (*लिङ्गे पिङ / Linge Ping*), and festive greetings.

### 🏍️ 3D Rider & Arcade Vehicle Physics
- **3D Animated Rider:** Custom rigged 3D racer model in Bajaj Racing leathers and aerodynamic helmet.
  - **Body English:** Rider shifts torso and drops knee inside corners during turns.
  - **Tuck & Dive:** Aerodynamic tuck on full throttle; sits up on hard braking with physical fork compression (anti-dive).
  - **LED Taillight:** Working red emissive brake light that lights up under deceleration.
- **Inertial Handling & Drift Physics:** Lateral momentum with tire grip simulation, drift slip angles at high speeds, and physical crash recoil/wobble.
- **Exhaust & Nitro Particle VFX:** Dynamic particle smoke emerging from the motorcycle muffler during acceleration, and high-velocity electric cyan flame trails during Nitro Boost.
- **Dynamic 3-Angle Camera System:**
  - **Action Chase (Default):** Grounded, low rear chase view with speed vibration and roll banking into sharp corners.
  - **Close Action Chase:** Tighter, lower arcade angle directly behind the rider’s helmet with intense speed feel.
  - **Wide Valley Broadcast:** Cinematic elevated camera view overlooking Kathmandu valley and the upcoming curves.
  - *Switchable on-the-fly with the `C` key or on-screen HUD button.*

### 🗺️ Live Circuit Minimap & Sector HUD
- **Kathmandu Ring Road Minimap:** Real-time 2D SVG circuit map plotted from 3D spline tangents, with labeled chowk checkpoints and a pulsating player location indicator.
- **Live Stopwatch & Lap Timer:** High-precision lap stopwatch (`MM:SS.ms`) tracking race duration in real-time.
- **Near-Miss Slalom Bonus (⚡ +150):** Narrowly dodging traffic barricades awards bonus points with dynamic floating badges and sound cues.
- **Live Sector Alerts:** Announces active Kathmandu sectors (e.g., *कोटेश्वर Koteshwor*, *कलंकी अन्डरपास Kalanki Underpass*, *स्वयम्भू Swayambhu*).
- **Digital Tachometer:** Live KM/H speed gauge, simulated 6-speed gear shifts, and responsive RPM power bar.

### 🪙 Festive Dashain Collectibles & Scoring
- **Dashain Golden Tokens (🪙):** Spinning 3D tokens and kites placed along racing lines.
- **Nitro Boost Pads (>>>):** Directionally aligned cyan boost strips triggering high-speed acceleration surges (150+ km/h).
- **Balanced Voucher Unlocks:** Collect coins and avoid traffic barricades to unlock **Bajaj Keyrings (4,000+ pts)**, **20% Service Vouchers (7,000+ pts)**, and **Premium Merchandise (10,000+ pts)**.

### 🔊 Procedural Web Audio Engine
- Zero external audio files (100% offline & instant playback).
- Dual-oscillator engine buzz (sawtooth + triangle) with gear-ratio pitch sweeps and lowpass muffler filters.
- Procedural white-noise crash crunch, harmonic coin chime, and turbine nitro whoosh.

---

## 🎮 Controls

| Action | Keyboard | Touch / Mobile |
| :--- | :--- | :--- |
| **Accelerate** | `W` or `↑` (Up Arrow) | Hold **GAS** button |
| **Brake / Reverse** | `S`, `↓`, or `Space` | Hold **BRK** button |
| **Steer Left** | `A` or `←` (Left Arrow) | Tap **◀** button |
| **Steer Right** | `D` or `→` (Right Arrow) | Tap **▶** button |
| **Switch Camera Angle** | `C` key | Tap **🎥 [Camera]** in HUD |
| **Pause / Resume** | `Esc` or Pause button | Tap **⏸️** in HUD |

---

## 🛠️ Tech Stack

- **Client:** React 19, Three.js (`three`), React Three Fiber (`@react-three/fiber`), React Three Drei (`@react-three/drei`), Vite.
- **Backend:** Node.js, Express.js, PostgreSQL (`pg`) on Neon.
- **Graphics & Rendering:**
  - Procedural Canvas Textures (8-lane asphalt, weathered road lines, red/white kerbs, grass).
  - Instanced meshes for highway streetlights, trees, and barricades (60 FPS performance).
  - Procedural displaced cone geometry for Himalayan mountain peaks.
- **Audio:** Web Audio API (`AudioContext`, `BiquadFilterNode`, `OscillatorNode`).

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- npm or pnpm

### 2. Client Setup
```bash
cd client
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

### 3. Server Setup (Optional for local voucher database)
```bash
cd server
npm install
# Configure your DATABASE_URL in server/.env
npm start
```

---

## 📄 License
MIT License. Built for Bajaj Dashain Challenge.
