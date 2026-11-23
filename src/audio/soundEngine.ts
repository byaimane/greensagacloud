class SoundEngine {
  private ctx: AudioContext | null = null;
  public muted = false;

  private ensureContext(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume = 0.12,
    delay = 0,
    endFreq?: number
  ) {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
    }

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  playTill() {
    this.playTone(150, 0.11, 'triangle', 0.16, 0, 72);
    this.playTone(95, 0.09, 'sawtooth', 0.05, 0.02, 55);
  }

  playPlant() {
    this.playTone(340, 0.09, 'sine', 0.11, 0, 520);
    this.playTone(510, 0.08, 'triangle', 0.09, 0.05, 640);
  }

  playWater() {
    this.playTone(460, 0.12, 'sine', 0.09, 0, 290);
    this.playTone(620, 0.1, 'sine', 0.07, 0.05, 380);
    this.playTone(780, 0.09, 'sine', 0.06, 0.09, 520);
  }

  playFertilize() {
    this.playTone(580, 0.1, 'sine', 0.09, 0, 880);
    this.playTone(880, 0.12, 'triangle', 0.08, 0.06, 1175);
  }

  playHarvest() {
    this.playTone(523.25, 0.1, 'triangle', 0.13, 0);
    this.playTone(659.25, 0.1, 'triangle', 0.13, 0.055);
    this.playTone(783.99, 0.16, 'sine', 0.14, 0.11);
  }

  playWeed() {
    this.playTone(260, 0.08, 'sawtooth', 0.06, 0, 140);
    this.playTone(320, 0.07, 'triangle', 0.07, 0.04, 210);
  }

  playCoin() {
    this.playTone(987.77, 0.09, 'sine', 0.12, 0);
    this.playTone(1318.51, 0.18, 'sine', 0.13, 0.075);
  }

  playLevelUp() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, i) => {
      this.playTone(n, 0.22, 'triangle', 0.14, i * 0.09);
    });
  }

  playMorning() {
    const notes = [392.0, 493.88, 587.33, 783.99];
    notes.forEach((n, i) => {
      this.playTone(n, 0.25, 'sine', 0.1, i * 0.1);
    });
  }

  playAnimal(species: 'chicken' | 'cow') {
    if (species === 'chicken') {
      this.playTone(720, 0.07, 'triangle', 0.1, 0, 920);
      this.playTone(820, 0.08, 'triangle', 0.1, 0.08, 640);
    } else {
      this.playTone(155, 0.26, 'sawtooth', 0.08, 0, 118);
      this.playTone(158, 0.24, 'triangle', 0.09, 0.02, 122);
    }
  }

  playClick() {
    this.playTone(620, 0.045, 'sine', 0.06, 0, 740);
  }

  playError() {
    this.playTone(210, 0.12, 'sawtooth', 0.07, 0, 150);
  }
}

export const soundEngine = new SoundEngine();
