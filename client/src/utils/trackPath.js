import * as THREE from 'three';

// Define a large oval circuit
export const trackCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 0, 0),         // Start/Finish
  new THREE.Vector3(0, 0, -400),      // Straight
  new THREE.Vector3(200, 0, -600),    // Curve 1
  new THREE.Vector3(400, 0, -400),    // Curve 2
  new THREE.Vector3(400, 0, 0),       // Back Straight
  new THREE.Vector3(200, 0, 200),     // Final Curve
], true); // true = closed loop

// Calculate total length so we know how fast to move along it
export const TRACK_LENGTH = trackCurve.getLength();