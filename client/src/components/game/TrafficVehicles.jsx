import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { trackCurve, TRACK_LENGTH } from '../../utils/trackPath';
import { inputState } from '../../utils/store';
import { INITIAL_TRAFFIC } from '../../utils/stuntConfig';

/**
 * 3D Procedural Kathmandu Highway Traffic Vehicles
 * Sajha Yatayat City Buses, HiAce Microbuses & Taxis moving along lanes.
 */
export default function TrafficVehicles({ trafficRef }) {
  const localTraffic = useRef(
    INITIAL_TRAFFIC.map((veh) => ({
      ...veh,
      x: 0,
      y: 0,
      z: 0,
      rotY: 0,
      hazardFlash: false,
    }))
  );

  const vehicleGroups = useRef([]);

  useFrame((state, delta) => {
    const isHonking = inputState.horn;

    localTraffic.current.forEach((veh, i) => {
      // Advance vehicle along the track spline
      veh.t = (veh.t + (veh.speed * delta) / TRACK_LENGTH) % 1.0;

      const p = trackCurve.getPointAt(veh.t);
      const tg = trackCurve.getTangentAt(veh.t);
      const norm = new THREE.Vector3(-tg.z, 0, tg.x).normalize();

      veh.x = p.x + norm.x * veh.lane;
      veh.y = p.y + 0.02;
      veh.z = p.z + norm.z * veh.lane;
      veh.rotY = Math.atan2(tg.x, tg.z);

      if (isHonking) {
        veh.hazardFlash = Math.sin(state.clock.elapsedTime * 14) > 0;
      } else {
        veh.hazardFlash = false;
      }

      const grp = vehicleGroups.current[i];
      if (grp) {
        grp.position.set(veh.x, veh.y, veh.z);
        grp.rotation.set(0, veh.rotY, 0);
      }
    });

    if (trafficRef) {
      trafficRef.current = localTraffic.current;
    }
  });

  return (
    <group>
      {INITIAL_TRAFFIC.map((veh, i) => (
        <group
          key={veh.id}
          ref={(el) => {
            vehicleGroups.current[i] = el;
          }}
          position={[0, -100, 0]}
        >
          {/* 1. KATHMANDU CITY BUS (Sajha Yatayat Green / Blue) */}
          {veh.type === 'bus' && (
            <group position={[0, 1.8, 0]}>
              {/* Main Bus Chassis */}
              <mesh castShadow receiveShadow>
                <boxGeometry args={[2.7, 3.2, 9.5]} />
                <meshStandardMaterial color={veh.color} roughness={0.35} metalness={0.2} />
              </mesh>

              {/* White Bus Roof */}
              <mesh position={[0, 1.62, 0]}>
                <boxGeometry args={[2.65, 0.16, 9.4]} />
                <meshStandardMaterial color="#f5f7fa" roughness={0.4} />
              </mesh>

              {/* Front Windshield Glass */}
              <mesh position={[0, 0.45, 4.76]}>
                <boxGeometry args={[2.4, 1.4, 0.1]} />
                <meshStandardMaterial color="#1a2634" metalness={0.9} roughness={0.1} />
              </mesh>

              {/* Rear Window Glass */}
              <mesh position={[0, 0.45, -4.76]}>
                <boxGeometry args={[2.4, 1.2, 0.1]} />
                <meshStandardMaterial color="#1a2634" metalness={0.9} roughness={0.1} />
              </mesh>

              {/* Dual Headlights (Yellow beams) */}
              {[-1.0, 1.0].map((x) => (
                <mesh key={x} position={[x, -0.6, 4.77]}>
                  <cylinderGeometry args={[0.2, 0.2, 0.1, 12]} rotation={[Math.PI / 2, 0, 0]} />
                  <meshStandardMaterial color="#fff4cc" emissive="#ffdd66" emissiveIntensity={3} />
                </mesh>
              ))}

              {/* Red Tail Lights */}
              {[-1.0, 1.0].map((x) => (
                <mesh key={x} position={[x, -0.6, -4.77]}>
                  <boxGeometry args={[0.3, 0.5, 0.08]} />
                  <meshStandardMaterial color="#ff2200" emissive="#ff1100" emissiveIntensity={2.5} />
                </mesh>
              ))}

              {/* Heavy Luggage Roof Rack */}
              <mesh position={[0, 1.85, -0.5]}>
                <boxGeometry args={[2.2, 0.35, 6.0]} />
                <meshStandardMaterial color="#2d3748" metalness={0.8} />
              </mesh>
            </group>
          )}

          {/* 2. HIACE PASSENGER MICROBUS (Kathmandu Local Van) */}
          {veh.type === 'micro' && (
            <group position={[0, 1.35, 0]}>
              {/* White Van Body */}
              <mesh castShadow receiveShadow>
                <boxGeometry args={[2.2, 2.3, 5.8]} />
                <meshStandardMaterial color="#f8fafc" roughness={0.25} />
              </mesh>

              {/* Blue / Red Side Accent Stripe */}
              <mesh position={[0, -0.2, 0]}>
                <boxGeometry args={[2.22, 0.25, 5.6]} />
                <meshStandardMaterial color="#005a9c" roughness={0.4} />
              </mesh>

              {/* Slanted Front Windshield */}
              <mesh position={[0, 0.35, 2.91]}>
                <boxGeometry args={[1.9, 1.1, 0.1]} />
                <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.1} />
              </mesh>

              {/* Headlights */}
              {[-0.8, 0.8].map((x) => (
                <mesh key={x} position={[x, -0.45, 2.92]}>
                  <boxGeometry args={[0.35, 0.25, 0.08]} />
                  <meshStandardMaterial color="#ffffff" emissive="#ffea88" emissiveIntensity={2.5} />
                </mesh>
              ))}

              {/* Tail Lights */}
              {[-0.8, 0.8].map((x) => (
                <mesh key={x} position={[x, -0.3, -2.92]}>
                  <boxGeometry args={[0.25, 0.6, 0.08]} />
                  <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={3} />
                </mesh>
              ))}
            </group>
          )}

          {/* 3. CITY TAXI (Red Maruti / City Hatchback) */}
          {veh.type === 'taxi' && (
            <group position={[0, 0.95, 0]}>
              {/* Taxi Body */}
              <mesh castShadow receiveShadow>
                <boxGeometry args={[1.85, 1.45, 4.0]} />
                <meshStandardMaterial color={veh.color} roughness={0.3} metalness={0.3} />
              </mesh>

              {/* Yellow Roof Taxi Sign */}
              <mesh position={[0, 0.95, 0]}>
                <boxGeometry args={[0.7, 0.28, 0.4]} />
                <meshStandardMaterial color="#f7b500" emissive="#ffcc00" emissiveIntensity={1.8} />
              </mesh>

              {/* Headlights & Tail Lights */}
              {[-0.7, 0.7].map((x) => (
                <mesh key={x} position={[x, -0.2, 2.01]}>
                  <sphereGeometry args={[0.16, 8, 8]} />
                  <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={3} />
                </mesh>
              ))}
              {[-0.7, 0.7].map((x) => (
                <mesh key={x} position={[x, -0.15, -2.01]}>
                  <boxGeometry args={[0.25, 0.35, 0.08]} />
                  <meshStandardMaterial color="#ff1100" emissive="#ff1100" emissiveIntensity={2.5} />
                </mesh>
              ))}
            </group>
          )}
        </group>
      ))}
    </group>
  );
}
