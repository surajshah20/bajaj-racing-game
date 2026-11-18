export const inputState = {
  left: false,
  right: false,
  gas: false,
  brake: false,
  wheelie: false,
  horn: false,
};

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

  // Nepali Highway Musical Horn Fanfare (Dual-tone musical chime)
  playHorn() {
    if (!this.ctx) return;
    try {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      const now = this.ctx.currentTime;
      const notes = [
        { f: 587.33, t: 0, d: 0.14 },    // D5
        { f: 739.99, t: 0.12, d: 0.14 }, // F#5
        { f: 880.00, t: 0.24, d: 0.26 }, // A5
      ];
      notes.forEach(({ f, t, d }) => {
        const osc = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc2.type = 'square';
        osc.frequency.setValueAtTime(f, now + t);
        osc2.frequency.setValueAtTime(f * 1.008, now + t); // Chorus detune

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(f * 1.5, now + t);
        filter.Q.value = 3.0;

        gain.gain.setValueAtTime(0.18, now + t);
        gain.gain.exponentialRampToValueAtTime(0.01, now + t + d);

        osc.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + t);
        osc.stop(now + t + d);
        osc2.start(now + t);
        osc2.stop(now + t + d);
      });
    } catch {
      // Audio ignored
    }
  }

  // Stunt Mega-Ramp Airtime Launch Sound
  playAirtimeJump() {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(620, now + 0.35);

      gain.gain.setValueAtTime(0.24, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.45);
    } catch {
      // Audio ignored
    }
  }

  // Suspension Compression Landing Thud
  playLandThud() {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(32, now + 0.22);

      gain.gain.setValueAtTime(0.32, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.24);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.24);
    } catch {
      // Audio ignored
    }
  }

  // Floating Neon Ring Jackpot Chime
  playRingChime() {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      [1046.5, 1318.5, 1567.98, 2093.0].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.05);

        gain.gain.setValueAtTime(0.18, now + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.005, now + i * 0.05 + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.05);
        osc.stop(now + i * 0.05 + 0.35);
      });
    } catch {
      // Audio ignored
    }
  }

  // Slipstream Turbo Draft Surge
  playDraftBoost() {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(940, now + 0.3);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch {
      // Audio ignored
    }
  }

  // Tire Friction Skid Screech
  playSkidScreech() {
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.16);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.5;
      }
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2400, now);
      filter.Q.value = 6.0;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      source.start(now);
    } catch {
      // Audio ignored
    }
  }

  stop() {
    if (this.gain && this.ctx) {
      this.gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2);
    }
  }
}

export const engineAudio = new EngineAudio();
