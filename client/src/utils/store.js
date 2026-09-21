export const inputState = { left: false, right: false, gas: false, brake: false };

class EngineAudio {
  constructor() {
    this.ctx = null;
    this.osc = null;
    this.gain = null;
    this.filter = null;
    this.initialized = false;
  }
  init() {
    if (this.initialized) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    this.ctx = new AudioContext();
    this.osc = this.ctx.createOscillator();
    this.osc.type = 'sawtooth';
    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 450;
    this.gain = this.ctx.createGain();
    this.gain.gain.value = 0.08;
    this.osc.connect(this.filter);
    this.filter.connect(this.gain);
    this.gain.connect(this.ctx.destination);
    this.osc.start();
    this.initialized = true;
  }
  updatePitch(speedRatio) {
    if (!this.initialized || !this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const targetFreq = 55 + speedRatio * 180;
    this.osc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.08);
  }
  stop() {
    if (this.gain) {
      this.gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2);
    }
  }
}

export const engineAudio = new EngineAudio();