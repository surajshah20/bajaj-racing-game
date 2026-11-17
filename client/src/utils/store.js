export const inputState = { left: false, right: false, gas: false, brake: false };

/**
 * Procedural Web Audio Engine for Bajaj Dashain Racing
 * Simulates engine revs, gear shifts, crash impacts, nitro whoosh, and coin chimes.
 */
class EngineAudio {
  constructor() {
    this.ctx = null;
    this.osc = null;
    this.subOsc = null;
    this.filter = null;
    this.gain = null;
    this.initialized = false;
    this.currentGear = 1;
    this.rpm = 0.2;
  }

  init() {
    if (this.initialized) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    this.ctx = new AudioContext();

    // Primary Engine Oscillator (Sawtooth for raw two-wheeler rev buzz)
    this.osc = this.ctx.createOscillator();
    this.osc.type = 'sawtooth';

    // Sub Oscillator (Square wave for engine rumble/bass punch)
    this.subOsc = this.ctx.createOscillator();
    this.subOsc.type = 'triangle';

    // Lowpass filter to muffle harsh harmonics like an exhaust chamber
    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 520;
    this.filter.Q.value = 2.5;

    // Master engine gain
    this.gain = this.ctx.createGain();
    this.gain.gain.value = 0.08;

    this.osc.connect(this.filter);
    this.subOsc.connect(this.filter);
    this.filter.connect(this.gain);
    this.gain.connect(this.ctx.destination);

    this.osc.start();
    this.subOsc.start();
    this.initialized = true;
  }

  updatePitch(speedRatio, isAccelerating, isBraking) {
    if (!this.initialized || !this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    // Simulated 6-Speed Gear Ratio Calculation
    // As speed rises, bike cycles through gears 1 to 6 with rev drops
    const totalGears = 6;
    const gearSpan = 1 / totalGears;
    let gear = Math.min(totalGears, Math.floor(speedRatio / gearSpan) + 1);
    let gearProgress = (speedRatio % gearSpan) / gearSpan;

    if (speedRatio >= 0.98) {
      gear = 6;
      gearProgress = 1.0;
    }

    this.currentGear = gear;

    // RPM calculations: idle at ~55Hz, tops out at ~260Hz per gear
    let baseFreq = 65 + gearProgress * 150 + (gear - 1) * 8;
    if (isAccelerating) baseFreq += 18;
    if (isBraking) baseFreq = Math.max(50, baseFreq * 0.85);

    const now = this.ctx.currentTime;
    this.osc.frequency.setTargetAtTime(baseFreq, now, 0.06);
    this.subOsc.frequency.setTargetAtTime(baseFreq * 0.5, now, 0.06);

    // Filter opens up as engine revs
    const cutoff = 400 + gearProgress * 700 + (isAccelerating ? 250 : 0);
    this.filter.frequency.setTargetAtTime(cutoff, now, 0.08);

    // Volume modulation
    const targetGain = speedRatio > 0.02 ? 0.09 : 0.04;
    this.gain.gain.setTargetAtTime(targetGain, now, 0.1);
  }

  playCrash() {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      // White noise buffer for crash crunch
      const bufferSize = this.ctx.sampleRate * 0.35;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const crashFilter = this.ctx.createBiquadFilter();
      crashFilter.type = 'lowpass';
      crashFilter.frequency.setValueAtTime(1200, now);
      crashFilter.frequency.exponentialRampToValueAtTime(120, now + 0.35);

      const crashGain = this.ctx.createGain();
      crashGain.gain.setValueAtTime(0.35, now);
      crashGain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      whiteNoise.connect(crashFilter);
      crashFilter.connect(crashGain);
      crashGain.connect(this.ctx.destination);

      whiteNoise.start(now);
    } catch {
      // Audio playback ignored if blocked
    }
  }

  playNitro() {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.4);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.5);
    } catch {
      // Audio playback ignored if blocked
    }
  }

  playCoin() {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(987.77, now); // B5
      osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch {
      // Audio playback ignored if blocked
    }
  }

  playNearMiss() {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(1560, now + 0.18);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch {
      // Audio playback ignored if blocked
    }
  }

  stop() {
    if (this.gain && this.ctx) {
      this.gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2);
    }
  }
}

export const engineAudio = new EngineAudio();
