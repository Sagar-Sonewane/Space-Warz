/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class SoundSystem {
  private ctx: AudioContext | null = null;
  private isEnabled: boolean = true;
  private bgMusic: HTMLAudioElement | null = null;
  private isMusicPlaying: boolean = false;

  constructor() {
    this.loadSettings();
  }

  // Load sound setting from localStorage
  private loadSettings() {
    try {
      const saved = localStorage.getItem("space_warz_sound_enabled");
      if (saved !== null) {
        this.isEnabled = saved === "true";
      } else {
        this.isEnabled = true;
      }
    } catch (e) {
      this.isEnabled = true;
    }
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    try {
      localStorage.setItem("space_warz_sound_enabled", enabled ? "true" : "false");
    } catch (e) {
      // Ignore storage errors in sandbox
    }

    if (enabled) {
      if (this.isMusicPlaying) {
        this.playMusic();
      }
    } else {
      if (this.bgMusic) {
        this.bgMusic.pause();
      }
    }
  }

  public getEnabled(): boolean {
    return this.isEnabled;
  }

  private initCtx() {
    if (!this.ctx) {
      // @ts-ignore
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    // Resume context if suspended
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Utility to create a white noise buffer for explosions
  private createNoiseBuffer(duration: number): AudioBuffer | null {
    const context = this.initCtx();
    if (!context) return null;

    const bufferSize = context.sampleRate * duration;
    const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  // Sound 1: Button Hover (quick modern ascending chime)
  public playHover() {
    if (!this.isEnabled) return;
    const context = this.initCtx();
    if (!context) return;

    const osc = context.createOscillator();
    const gainNode = context.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(500, context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1000, context.currentTime + 0.08);

    gainNode.gain.setValueAtTime(0.08, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.08);

    osc.connect(gainNode);
    gainNode.connect(context.destination);

    osc.start();
    osc.stop(context.currentTime + 0.08);
  }

  // Sound 2: Button Click (solid double high-pitch beep)
  public playClick() {
    if (!this.isEnabled) return;
    const context = this.initCtx();
    if (!context) return;

    const osc = context.createOscillator();
    const gainNode = context.createGain();

    osc.type = "square";
    osc.frequency.setValueAtTime(600, context.currentTime);
    osc.frequency.setValueAtTime(900, context.currentTime + 0.04);

    gainNode.gain.setValueAtTime(0.12, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.12);

    osc.connect(gainNode);
    gainNode.connect(context.destination);

    osc.start();
    osc.stop(context.currentTime + 0.12);
  }

  // Sound 3: Shoot Laser (descending high-pitch pitch sweep)
  public playShoot(weaponType: string = "laser") {
    if (!this.isEnabled) return;
    const context = this.initCtx();
    if (!context) return;

    const osc = context.createOscillator();
    const gainNode = context.createGain();

    let duration = 0.18;
    let startFreq = 850;
    let endFreq = 150;
    osc.type = "sawtooth";

    if (weaponType === "DOUBLE SHOT") {
      startFreq = 950;
      endFreq = 250;
      duration = 0.15;
      osc.type = "triangle";
    } else if (weaponType === "TRIPLE SHOT") {
      startFreq = 700;
      endFreq = 180;
      duration = 0.22;
      osc.type = "sawtooth";
    } else if (weaponType === "PLASMA CANNON") {
      startFreq = 400;
      endFreq = 80;
      duration = 0.35;
      osc.type = "sine";
    } else if (weaponType === "RAPID FIRE") {
      startFreq = 1000;
      endFreq = 400;
      duration = 0.08;
      osc.type = "triangle";
    }

    osc.frequency.setValueAtTime(startFreq, context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(endFreq, context.currentTime + duration);

    gainNode.gain.setValueAtTime(0.08, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);

    osc.connect(gainNode);
    gainNode.connect(context.destination);

    osc.start();
    osc.stop(context.currentTime + duration);
  }

  // Sound 4: Explosion (rich crunched white-noise retro blast)
  public playExplosion(type: "small" | "medium" | "large" = "medium") {
    if (!this.isEnabled) return;
    const context = this.initCtx();
    if (!context) return;

    let duration = 0.3;
    let filterFreq = 1000;
    let volume = 0.15;

    if (type === "small") {
      duration = 0.2;
      filterFreq = 1400;
      volume = 0.1;
    } else if (type === "large") {
      duration = 0.65;
      filterFreq = 600;
      volume = 0.25;
    }

    // Noise Generator
    const noiseBuffer = this.createNoiseBuffer(duration);
    if (!noiseBuffer) return;

    const noiseSource = context.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    // Direct Low-Pitch Sweep for arcade boominess
    const subOsc = context.createOscillator();
    subOsc.type = "sawtooth";
    subOsc.frequency.setValueAtTime(160, context.currentTime);
    subOsc.frequency.exponentialRampToValueAtTime(40, context.currentTime + duration);

    const subGain = context.createGain();
    subGain.gain.setValueAtTime(volume * 0.5, context.currentTime);
    subGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);

    subOsc.connect(subGain);
    subGain.connect(context.destination);

    // Bandpass filter for noise crunch
    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(filterFreq, context.currentTime);
    filter.frequency.exponentialRampToValueAtTime(80, context.currentTime + duration);

    const noiseGain = context.createGain();
    noiseGain.gain.setValueAtTime(volume, context.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);

    noiseSource.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(context.destination);

    noiseSource.start();
    noiseSource.stop(context.currentTime + duration);

    subOsc.start();
    subOsc.stop(context.currentTime + duration);
  }

  // Sound 5: Hit Sparks / Player Hurt (short high-damping crackle)
  public playHit() {
    if (!this.isEnabled) return;
    const context = this.initCtx();
    if (!context) return;

    const osc = context.createOscillator();
    const gainNode = context.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(120, context.currentTime);
    osc.frequency.setValueAtTime(60, context.currentTime + 0.05);

    gainNode.gain.setValueAtTime(0.18, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.06);

    osc.connect(gainNode);
    gainNode.connect(context.destination);

    osc.start();
    osc.stop(context.currentTime + 0.06);
  }

  // Sound 6: Powerup Pickup (ascending perfect fifths arpeggio)
  public playPowerup() {
    if (!this.isEnabled) return;
    const context = this.initCtx();
    if (!context) return;

    const frequencies = [300, 375, 450, 600, 750, 900];
    const notesCount = frequencies.length;
    const stepDuration = 0.06;

    frequencies.forEach((freq, idx) => {
      const osc = context.createOscillator();
      const gainNode = context.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, context.currentTime + idx * stepDuration);

      gainNode.gain.setValueAtTime(0, context.currentTime + idx * stepDuration);
      gainNode.gain.linearRampToValueAtTime(0.1, context.currentTime + idx * stepDuration + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, context.currentTime + idx * stepDuration + stepDuration + 0.02);

      osc.connect(gainNode);
      gainNode.connect(context.destination);

      osc.start(context.currentTime + idx * stepDuration);
      osc.stop(context.currentTime + idx * stepDuration + stepDuration + 0.03);
    });
  }

  // Sound 7: Game Over Sequence (descending sad 8-bit melody)
  public playGameOver() {
    if (!this.isEnabled) return;
    const context = this.initCtx();
    if (!context) return;

    const frequencies = [440, 415, 392, 349, 311, 220, 165];
    const stepDuration = 0.16;

    frequencies.forEach((freq, idx) => {
      const osc = context.createOscillator();
      const gainNode = context.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, context.currentTime + idx * stepDuration);

      gainNode.gain.setValueAtTime(0, context.currentTime + idx * stepDuration);
      gainNode.gain.linearRampToValueAtTime(0.1, context.currentTime + idx * stepDuration + 0.02);
      gainNode.gain.linearRampToValueAtTime(0, context.currentTime + idx * stepDuration + stepDuration + 0.1);

      osc.connect(gainNode);
      gainNode.connect(context.destination);

      osc.start(context.currentTime + idx * stepDuration);
      osc.stop(context.currentTime + idx * stepDuration + stepDuration + 0.12);
    });
  }

  // Sound 8: Tactical Weapon Upgrade (heavy charge up tone with target frequency lock)
  public playWeaponChange(weaponType: string) {
    if (!this.isEnabled) return;
    const context = this.initCtx();
    if (!context) return;

    const now = context.currentTime;

    const osc1 = context.createOscillator();
    const osc2 = context.createOscillator();
    const gainNode1 = context.createGain();
    const gainNode2 = context.createGain();

    let baseFreq = 220;
    let targetFreq = 440;
    let type: OscillatorType = "sine";

    if (weaponType === "DOUBLE SHOT") {
      baseFreq = 300;
      targetFreq = 600;
      type = "triangle";
    } else if (weaponType === "TRIPLE SHOT") {
      baseFreq = 240;
      targetFreq = 720;
      type = "sawtooth";
    } else if (weaponType === "PLASMA CANNON") {
      baseFreq = 150;
      targetFreq = 300;
      type = "sine";
    } else if (weaponType === "RAPID FIRE") {
      baseFreq = 400;
      targetFreq = 1200;
      type = "sawtooth";
    }

    osc1.type = type;
    osc1.frequency.setValueAtTime(baseFreq, now);
    osc1.frequency.exponentialRampToValueAtTime(targetFreq, now + 0.15);
    osc1.frequency.exponentialRampToValueAtTime(targetFreq * 1.5, now + 0.35);

    gainNode1.gain.setValueAtTime(0, now);
    gainNode1.gain.linearRampToValueAtTime(0.12, now + 0.05);
    gainNode1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc2.type = "sawtooth";
    osc2.frequency.setValueAtTime(baseFreq / 2, now);
    osc2.frequency.setValueAtTime(targetFreq / 2, now + 0.15);

    gainNode2.gain.setValueAtTime(0, now);
    gainNode2.gain.linearRampToValueAtTime(0.08, now + 0.05);
    gainNode2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc1.connect(gainNode1);
    gainNode1.connect(context.destination);

    osc2.connect(gainNode2);
    gainNode2.connect(context.destination);

    osc1.start();
    osc2.start();

    osc1.stop(now + 0.45);
    osc2.stop(now + 0.45);
  }

  public playMusic() {
    this.isMusicPlaying = true;
    if (!this.isEnabled) return;

    if (!this.bgMusic) {
      this.bgMusic = new Audio(`${import.meta.env.BASE_URL}High_Score_Horizon.mp3`);
      this.bgMusic.loop = true;
      this.bgMusic.volume = 0.4;
    }

    if (this.bgMusic.paused) {
      this.bgMusic.play()
        .then(() => {
          console.log("bgMusic is playing successfully");
        })
        .catch(err => {
          console.log("Autoplay prevented for bgMusic, will retry on interaction:", err);
        });
    }
  }

  public pauseMusic() {
    this.isMusicPlaying = false;
    if (this.bgMusic) {
      this.bgMusic.pause();
      console.log("bgMusic paused");
    }
  }
}

export const sound = new SoundSystem();
export default sound;
