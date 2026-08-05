// High-Performance Web Audio API Polyphonic Synth Engine
export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.reverbNode = null;
    this.dryGain = null;
    this.wetGain = null;
    this.analyser = null;
    
    this.volume = 0.85;
    this.reverbLevel = 0.25;
    this.currentTimbre = 'piano'; // Default instrument: Piano
    this.octave = 4;
    
    this.activeVoices = new Map();
  }

  init() {
    if (this.ctx) return;
    
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioCtx();
    
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);

    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;

    this.reverbNode = this.ctx.createConvolver();
    this.dryGain = this.ctx.createGain();
    this.wetGain = this.ctx.createGain();

    this.createImpulseResponse();

    this.dryGain.gain.setValueAtTime(1 - this.reverbLevel * 0.5, this.ctx.currentTime);
    this.wetGain.gain.setValueAtTime(this.reverbLevel, this.ctx.currentTime);

    this.masterGain.connect(this.dryGain);
    this.masterGain.connect(this.reverbNode);
    this.reverbNode.connect(this.wetGain);

    this.dryGain.connect(this.analyser);
    this.wetGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  createImpulseResponse() {
    if (!this.ctx) return;
    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate * 2.0;
    const impulse = this.ctx.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const decay = Math.exp(-i / (sampleRate * 0.4));
      left[i] = (Math.random() * 2 - 1) * decay;
      right[i] = (Math.random() * 2 - 1) * decay;
    }

    this.reverbNode.buffer = impulse;
  }

  getFrequency(noteName, octave = this.octave) {
    const semitonesFromA4 = {
      'C': -9, 'C#': -8, 'D': -7, 'D#': -6, 'E': -5,
      'F': -4, 'F#': -3, 'G': -2, 'G#': -1,
      'A': 0,  'A#': 1,  'B': 2
    };

    const baseOffset = semitonesFromA4[noteName] !== undefined ? semitonesFromA4[noteName] : 0;
    const octaveOffset = (octave - 4) * 12;
    const totalSemitones = baseOffset + octaveOffset;

    return 440 * Math.pow(2, totalSemitones / 12);
  }

  startNote(noteName, octave = this.octave) {
    if (!this.ctx) this.init();
    this.resume();

    const voiceKey = `${noteName}${octave}`;
    if (this.activeVoices.has(voiceKey)) return;

    const freq = this.getFrequency(noteName, octave);
    const voice = this.createVoice(freq, this.currentTimbre);
    
    this.activeVoices.set(voiceKey, voice);
  }

  stopNote(noteName, octave = this.octave) {
    const voiceKey = `${noteName}${octave}`;
    const voice = this.activeVoices.get(voiceKey);
    if (!voice) return;

    const now = this.ctx.currentTime;
    const releaseTime = voice.releaseTime || 0.25;

    // Linear ramp release guarantees clean audio cutoff without Web Audio DOM exceptions
    voice.gainNode.gain.cancelScheduledValues(now);
    voice.gainNode.gain.setValueAtTime(voice.gainNode.gain.value, now);
    voice.gainNode.gain.linearRampToValueAtTime(0.0001, now + releaseTime);

    setTimeout(() => {
      try {
        voice.oscillators.forEach(osc => osc.stop());
        voice.oscillators.forEach(osc => osc.disconnect());
        voice.gainNode.disconnect();
      } catch (e) {}
    }, releaseTime * 1000 + 50);

    this.activeVoices.delete(voiceKey);
  }

  stopAllNotes() {
    for (const [key] of this.activeVoices) {
      const noteName = key.replace(/\d+/, '');
      const octave = parseInt(key.match(/\d+/)[0], 10);
      this.stopNote(noteName, octave);
    }
  }

  triggerNoteInstant(noteName, octave = this.octave, duration = 0.5) {
    this.startNote(noteName, octave);
    setTimeout(() => {
      this.stopNote(noteName, octave);
    }, duration * 1000);
  }

  createVoice(freq, timbre) {
    const now = this.ctx.currentTime;
    const voiceGain = this.ctx.createGain();
    const oscList = [];
    let releaseTime = 0.3;

    if (timbre === 'piano') {
      // 🎹 Acoustic Piano: Dual sine + triangle harmonics with lowpass filter
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();

      osc1.type = 'triangle';
      osc2.type = 'sine';

      osc1.frequency.setValueAtTime(freq, now);
      osc2.frequency.setValueAtTime(freq * 2, now);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(freq * 4, now);

      const g2 = this.ctx.createGain();
      g2.gain.setValueAtTime(0.3, now);
      osc2.connect(g2);

      osc1.connect(filter);
      g2.connect(filter);
      filter.connect(voiceGain);

      oscList.push(osc1, osc2);

      voiceGain.gain.setValueAtTime(0.0001, now);
      voiceGain.gain.linearRampToValueAtTime(0.85, now + 0.01);
      voiceGain.gain.linearRampToValueAtTime(0.4, now + 0.4);
      releaseTime = 0.35;

    } else if (timbre === 'chime') {
      // 🔔 Crystal Chime: High sine + metallic overtone
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();

      osc1.type = 'sine';
      osc2.type = 'sine';

      osc1.frequency.setValueAtTime(freq, now);
      osc2.frequency.setValueAtTime(freq * 2.756, now);

      const g2 = this.ctx.createGain();
      g2.gain.setValueAtTime(0.2, now);
      osc2.connect(g2);

      osc1.connect(voiceGain);
      g2.connect(voiceGain);
      oscList.push(osc1, osc2);

      voiceGain.gain.setValueAtTime(0.0001, now);
      voiceGain.gain.linearRampToValueAtTime(0.75, now + 0.01);
      voiceGain.gain.linearRampToValueAtTime(0.2, now + 0.5);
      releaseTime = 0.5;

    } else if (timbre === 'guitar') {
      // 🎸 Plucked Guitar / Harp: Filtered pluck attack
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();

      osc1.type = 'sawtooth';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(freq, now);
      osc2.frequency.setValueAtTime(freq, now);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(freq * 5, now);
      filter.frequency.linearRampToValueAtTime(freq * 1.5, now + 0.2);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(voiceGain);
      oscList.push(osc1, osc2);

      voiceGain.gain.setValueAtTime(0.0001, now);
      voiceGain.gain.linearRampToValueAtTime(0.9, now + 0.005);
      voiceGain.gain.linearRampToValueAtTime(0.0001, now + 0.45);
      releaseTime = 0.2;

    } else if (timbre === 'marimba') {
      // 🪵 Percussive Marimba
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(freq * 3, now);

      osc.connect(filter);
      filter.connect(voiceGain);
      oscList.push(osc);

      voiceGain.gain.setValueAtTime(0.0001, now);
      voiceGain.gain.linearRampToValueAtTime(0.95, now + 0.005);
      voiceGain.gain.linearRampToValueAtTime(0.0001, now + 0.3);
      releaseTime = 0.1;

    } else if (timbre === 'brass') {
      // 🎷 Brass Lead / Horn
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc2.type = 'square';

      osc1.frequency.setValueAtTime(freq, now);
      osc2.frequency.setValueAtTime(freq * 1.002, now);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.Q.setValueAtTime(3, now);
      filter.frequency.setValueAtTime(freq * 2, now);
      filter.frequency.linearRampToValueAtTime(freq * 4, now + 0.1);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(voiceGain);
      oscList.push(osc1, osc2);

      voiceGain.gain.setValueAtTime(0.0001, now);
      voiceGain.gain.linearRampToValueAtTime(0.8, now + 0.03);
      releaseTime = 0.3;

    } else if (timbre === 'strings') {
      // 🎻 String Ensemble: Chorus detuned saws
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';

      osc1.frequency.setValueAtTime(freq - 1.5, now);
      osc2.frequency.setValueAtTime(freq + 1.5, now);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(freq * 3, now);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(voiceGain);
      oscList.push(osc1, osc2);

      voiceGain.gain.setValueAtTime(0.0001, now);
      voiceGain.gain.linearRampToValueAtTime(0.7, now + 0.1);
      releaseTime = 0.5;

    } else if (timbre === 'retro') {
      // 👾 8-Bit Retro Game
      const osc = this.ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now);

      osc.connect(voiceGain);
      oscList.push(osc);

      voiceGain.gain.setValueAtTime(0.0001, now);
      voiceGain.gain.linearRampToValueAtTime(0.5, now + 0.01);
      releaseTime = 0.15;

    } else if (timbre === 'pad') {
      // 🌌 Cosmic Pad
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(freq - 1.2, now);
      osc2.frequency.setValueAtTime(freq + 1.2, now);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(freq * 2, now);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(voiceGain);
      oscList.push(osc1, osc2);

      voiceGain.gain.setValueAtTime(0.0001, now);
      voiceGain.gain.linearRampToValueAtTime(0.5, now + 0.15);
      releaseTime = 0.55;

    } else {
      // 🎹 Grand Synth
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc2.type = 'square';
      osc1.frequency.setValueAtTime(freq, now);
      osc2.frequency.setValueAtTime(freq * 1.002, now);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(freq * 4, now);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(voiceGain);
      oscList.push(osc1, osc2);

      voiceGain.gain.setValueAtTime(0.0001, now);
      voiceGain.gain.linearRampToValueAtTime(0.8, now + 0.02);
      releaseTime = 0.3;
    }

    voiceGain.connect(this.masterGain);
    oscList.forEach(osc => osc.start(now));

    return {
      oscillators: oscList,
      gainNode: voiceGain,
      releaseTime
    };
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
  }

  setReverb(rev) {
    this.reverbLevel = Math.max(0, Math.min(1, rev));
    if (this.dryGain && this.wetGain && this.ctx) {
      this.dryGain.gain.setValueAtTime(1 - this.reverbLevel * 0.5, this.ctx.currentTime);
      this.wetGain.gain.setValueAtTime(this.reverbLevel, this.ctx.currentTime);
    }
  }

  setTimbre(timbre) {
    this.currentTimbre = timbre;
  }

  setOctave(oct) {
    if (oct >= 2 && oct <= 6) {
      this.octave = oct;
    }
  }

  getWaveformData() {
    if (!this.analyser) return new Uint8Array(0);
    const buffer = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteTimeDomainData(buffer);
    return buffer;
  }
}
