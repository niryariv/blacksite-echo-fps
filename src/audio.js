/**
 * Lightweight procedural sound design for the combat loop.
 *
 * The AudioContext is deliberately created lazily: call unlock() from a click,
 * keydown, or pointer event before expecting sound on mobile browsers.
 */
export class CombatAudio {
  constructor() {
    this.context = null;
    this.master = null;
    this.muted = false;
    this.masterLevel = 0.72;
    this.noiseBuffer = null;
    this.nextFootstepAt = 0;
    this.stepSide = 1;
    this.ambientRequested = false;
    this.ambientNodes = null;
  }

  async unlock() {
    const context = this._ensureContext();
    if (!context) return false;

    try {
      if (context.state === "suspended") await context.resume();

      // A one-sample silent sound finishes the unlock on older iOS versions.
      const buffer = context.createBuffer(1, 1, context.sampleRate);
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(this.master);
      source.start();

      if (this.ambientRequested) this._startAmbient();
      return context.state === "running";
    } catch {
      return false;
    }
  }

  setMuted(muted) {
    this.muted = Boolean(muted);
    if (!this.master || !this.context) return;

    try {
      const now = this.context.currentTime;
      const gain = this.master.gain;
      gain.cancelScheduledValues(now);
      gain.setValueAtTime(Math.max(0.0001, gain.value), now);
      gain.exponentialRampToValueAtTime(
        this.muted ? 0.0001 : this.masterLevel,
        now + 0.025,
      );
    } catch {
      // Muting must never interfere with the game loop.
    }
  }

  shot() {
    if (!this._canPlay()) return;
    try {
      const t = this.context.currentTime;
      const pan = (Math.random() - 0.5) * 0.12;

      // Muzzle crack, propellant blast, and a short mechanical tail.
      this._noise(t, 0.075, 0.52, 1700, "bandpass", 1.9, pan, 0.001);
      this._noise(t + 0.012, 0.19, 0.25, 430, "lowpass", 0.8, pan);
      this._tone(t, 0.09, 155, 48, 0.42, "triangle", pan, 0.001);
      this._tone(t + 0.002, 0.025, 1250, 310, 0.15, "square", pan);
      this._click(t + 0.072, 0.12, pan + 0.08);
    } catch {
      // Audio is cosmetic; unsupported nodes should fail silently.
    }
  }

  dryFire() {
    if (!this._canPlay()) return;
    try {
      const t = this.context.currentTime;
      this._click(t, 0.18, 0);
      this._tone(t + 0.008, 0.028, 190, 115, 0.055, "square", 0);
      this._click(t + 0.045, 0.07, 0.03);
    } catch {}
  }

  reload() {
    if (!this._canPlay()) return;
    try {
      const t = this.context.currentTime;

      // Magazine release, removal/insertion, then bolt/slide return.
      this._click(t, 0.13, -0.16);
      this._tone(t + 0.035, 0.08, 115, 82, 0.08, "triangle", -0.14);
      this._noise(t + 0.22, 0.085, 0.11, 1050, "bandpass", 1.2, -0.08);
      this._click(t + 0.46, 0.23, 0.13);
      this._tone(t + 0.465, 0.075, 260, 92, 0.12, "square", 0.12);
      this._noise(t + 0.69, 0.075, 0.17, 1800, "highpass", 0.8, 0.07);
      this._click(t + 0.73, 0.2, 0.02);
      this._tone(t + 0.735, 0.055, 410, 125, 0.1, "triangle", 0.02);
    } catch {}
  }

  hit() {
    if (!this._canPlay()) return;
    try {
      const t = this.context.currentTime;
      // Clear hit-marker tick that cuts through gunfire without being harsh.
      this._tone(t, 0.055, 1180, 780, 0.12, "sine", 0, 0.001);
      this._tone(t + 0.014, 0.07, 1760, 1120, 0.075, "triangle", 0);
      this._noise(t, 0.026, 0.07, 2200, "highpass", 1, 0);
    } catch {}
  }

  enemyShot() {
    if (!this._canPlay()) return;
    try {
      const t = this.context.currentTime;
      const pan = (Math.random() * 1.4) - 0.7;

      // More distant and mid-heavy than the player's weapon.
      this._noise(t, 0.06, 0.3, 1250, "bandpass", 1.1, pan, 0.002);
      this._noise(t + 0.014, 0.22, 0.14, 700, "lowpass", 0.65, pan);
      this._tone(t, 0.11, 105, 44, 0.24, "triangle", pan);
      this._tone(t + 0.004, 0.024, 720, 210, 0.08, "sawtooth", pan);
    } catch {}
  }

  playerHit() {
    if (!this._canPlay()) return;
    try {
      const t = this.context.currentTime;
      this._noise(t, 0.14, 0.34, 480, "lowpass", 0.7, 0);
      this._tone(t, 0.18, 92, 38, 0.38, "sine", 0, 0.002);
      this._tone(t + 0.025, 0.12, 240, 70, 0.12, "triangle", 0);
    } catch {}
  }

  pickup() {
    if (!this._canPlay()) return;
    try {
      const t = this.context.currentTime;
      this._tone(t, 0.12, 523.25, 659.25, 0.1, "sine", -0.08, 0.004);
      this._tone(t + 0.075, 0.15, 659.25, 987.77, 0.11, "sine", 0.08, 0.004);
      this._tone(t + 0.16, 0.25, 987.77, 1318.51, 0.09, "sine", 0, 0.006);
    } catch {}
  }

  footstep(intensity = 1) {
    if (!this._canPlay()) return;

    try {
      const t = this.context.currentTime;
      // Protect against animation-loop callers and duplicated movement events.
      if (t < this.nextFootstepAt) return;
      this.nextFootstepAt = t + 0.115;

      const strength = Math.min(1.35, Math.max(0.15, Number(intensity) || 1));
      const pan = this.stepSide * 0.09;
      this.stepSide *= -1;

      this._noise(t, 0.055, 0.12 * strength, 1050, "bandpass", 0.75, pan, 0.002);
      this._noise(t + 0.015, 0.11, 0.13 * strength, 310, "lowpass", 0.8, pan);
      this._tone(
        t,
        0.095,
        105 + Math.random() * 22,
        53,
        0.12 * strength,
        "sine",
        pan,
      );
    } catch {}
  }

  ambientStart() {
    this.ambientRequested = true;
    if (!this._canPlay()) return;
    try {
      this._startAmbient();
    } catch {}
  }

  _ensureContext() {
    if (this.context) return this.context;

    try {
      const AudioContextClass =
        globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!AudioContextClass) return null;

      this.context = new AudioContextClass();
      this.master = this.context.createGain();
      this.master.gain.value = this.muted ? 0.0001 : this.masterLevel;
      this.master.connect(this.context.destination);
      return this.context;
    } catch {
      this.context = null;
      this.master = null;
      return null;
    }
  }

  _canPlay() {
    return Boolean(
      this.context &&
        this.master &&
        this.context.state !== "closed" &&
        this.context.state === "running",
    );
  }

  _noise(
    start,
    duration,
    volume,
    frequency,
    filterType = "bandpass",
    q = 1,
    pan = 0,
    attack = 0.003,
  ) {
    const context = this.context;
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const envelope = context.createGain();
    const output = this._pan(pan);

    source.buffer = this._getNoiseBuffer();
    filter.type = filterType;
    filter.frequency.setValueAtTime(frequency, start);
    filter.Q.setValueAtTime(q, start);

    const peak = Math.max(0.0001, volume);
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(peak, start + attack);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    source.connect(filter);
    filter.connect(envelope);
    envelope.connect(output);
    source.start(start, Math.random() * 0.8, duration + 0.015);
    source.stop(start + duration + 0.02);
  }

  _tone(
    start,
    duration,
    fromFrequency,
    toFrequency,
    volume,
    type = "sine",
    pan = 0,
    attack = 0.003,
  ) {
    const context = this.context;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    const output = this._pan(pan);
    const end = start + duration;

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(Math.max(20, fromFrequency), start);
    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(20, toFrequency),
      end,
    );

    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(
      Math.max(0.0001, volume),
      start + attack,
    );
    envelope.gain.exponentialRampToValueAtTime(0.0001, end);

    oscillator.connect(envelope);
    envelope.connect(output);
    oscillator.start(start);
    oscillator.stop(end + 0.01);
  }

  _click(start, volume = 0.12, pan = 0) {
    this._noise(start, 0.018, volume, 2800, "highpass", 0.9, pan, 0.001);
    this._tone(start, 0.022, 840, 180, volume * 0.55, "square", pan, 0.001);
  }

  _pan(amount) {
    if (typeof this.context.createStereoPanner !== "function") {
      return this.master;
    }

    const panner = this.context.createStereoPanner();
    panner.pan.value = Math.min(1, Math.max(-1, amount));
    panner.connect(this.master);
    return panner;
  }

  _getNoiseBuffer() {
    if (this.noiseBuffer) return this.noiseBuffer;

    const context = this.context;
    const length = Math.ceil(context.sampleRate * 2);
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const samples = buffer.getChannelData(0);
    let previous = 0;

    for (let i = 0; i < length; i += 1) {
      // A little correlation makes the source less brittle than pure white noise.
      const white = Math.random() * 2 - 1;
      previous = previous * 0.28 + white * 0.72;
      samples[i] = previous;
    }

    this.noiseBuffer = buffer;
    return buffer;
  }

  _startAmbient() {
    if (this.ambientNodes || !this._canPlay()) return;

    const context = this.context;
    const t = context.currentTime;
    const noise = context.createBufferSource();
    const lowpass = context.createBiquadFilter();
    const highpass = context.createBiquadFilter();
    const bedGain = context.createGain();
    const lfo = context.createOscillator();
    const lfoDepth = context.createGain();

    noise.buffer = this._getNoiseBuffer();
    noise.loop = true;
    lowpass.type = "lowpass";
    lowpass.frequency.value = 520;
    highpass.type = "highpass";
    highpass.frequency.value = 58;
    bedGain.gain.setValueAtTime(0.0001, t);
    bedGain.gain.exponentialRampToValueAtTime(0.028, t + 1.8);

    lfo.type = "sine";
    lfo.frequency.value = 0.075;
    lfoDepth.gain.value = 0.009;

    noise.connect(lowpass);
    lowpass.connect(highpass);
    highpass.connect(bedGain);
    bedGain.connect(this.master);
    lfo.connect(lfoDepth);
    lfoDepth.connect(bedGain.gain);
    noise.start();
    lfo.start();

    this.ambientNodes = { noise, lowpass, highpass, bedGain, lfo, lfoDepth };
  }
}

export default CombatAudio;
