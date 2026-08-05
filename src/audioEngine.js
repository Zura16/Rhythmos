// High-Performance Web Audio API Polyphonic Synth Engine
export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.reverbNode = null;
    this.dryGain = null;
    this.wetGain = null;
    this.analyser = null;
    
    this.volume = 0.8;
    this.reverbLevel = 0.3;
    this.currentTimbre = 'synth'; // 'synth', 'chime', 'marimba', 'pad'
    this.octave = 4;
    
    // Active note tracking for sustained hover
    this.activeVoices = new Map(); // key -> voice object
    
    this.chromaticNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    
    // Custom note ordering for circle starting at A (12 o'clock)
    this.circleNotes = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];
  }

  init() {
    if (this.ctx) return;
    
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioCtx();
    
    // Master Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);

    // Analyser node for UI visualizer
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;

    // Reverb / Impulse Response
    this.reverbNode = this.ctx.createConvolver();
    this.dryGain = this.ctx.createGain();
    this.wetGain = this.ctx.createGain();

    this.createImpulseResponse();

    // Routing
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
    const length = sampleRate * 2.0; // 2 seconds reverb
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
    // A4 = 440 Hz
    // Index of A in chromatic scale (C=0, C#=1, ..., A=9)
    const semitonesFromA4 = {
      'C': -9, 'C#': -8, 'D': -7, 'D#': -6, 'E': -5,
      'F': -4, 'F#': -3, 'G': -2, 'G#': -1,
      'A': 0,  'A#': 1,  'B': 2
    };

    const baseOffset = semitonesFromA4[noteName] || 0;
    const octaveOffset = (octave - 4) * 12;
    const totalSemitones = baseOffset + octaveOffset;

    return 440 * Math.pow(2, totalSemitones / 12);
  }

  startNote(noteName, octave = this.octave) {
    if (!this.ctx) this.init();
    this.resume();

    const voiceKey = `${noteName}${octave}`;
    if (this.activeVoices.has(voiceKey)) {
      return; // Already playing
    }

    const freq = this.getFrequency(noteName, octave);
    const voice = this.createVoice(freq, this.currentTimbre);
    
    this.activeVoices.set(voiceKey, voice);
  }

  stopNote(noteName, octave = this.octave) {
    const voiceKey = `${noteName}${octave}`;
    const voice = this.activeVoices.get(voiceKey);
    if (!voice) return;

    const now = this.ctx.currentTime;
    const releaseTime = voice.releaseTime || 0.3;

    // Release envelope
    voice.gainNode.gain.cancelScheduledValues(now);
    voice.gainNode.gain.setValueAtTime(voice.gainNode.gain.value, now);
    voice.gainNode.gain.exponentialRampToValueAtTime(0.0001, now + releaseTime);

    setTimeout(() => {
      try {
        voice.oscillators.forEach(osc => osc.stop());
        voice.oscillators.forEach(osc => osc.disconnect());
        voice.gainNode.disconnect();
      } catch (e) {
        // Safe cleanup
      }
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

  triggerNoteInstant(noteName, octave = this.octave, duration = 0.4) {
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

    if (timbre === 'chime') {
      // Pure Crystal Chime: Main sine + subtle octave overtone
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(freq, now);
      osc2.frequency.setValueAtTime(freq * 2, now);

      const osc2Gain = this.ctx.createGain();
      osc2Gain.gain.setValueAtTime(0.25, now);
      osc2.connect(osc2Gain);
      
      osc1.connect(voiceGain);
      osc2Gain.connect(voiceGain);
      
      oscList.push(osc1, osc2);

      // ADSR Envelope
      voiceGain.gain.setValueAtTime(0.0001, now);
      voiceGain.gain.linearRampToValueAtTime(0.7, now + 0.03); // Attack
      voiceGain.gain.exponentialRampToValueAtTime(0.4, now + 0.3); // Decay / Sustain
      releaseTime = 0.5;

    } else if (timbre === 'marimba') {
      // Percussive Marimba: Triangle wave with fast decay
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(freq * 4, now);
      filter.frequency.exponentialRampToValueAtTime(freq * 1.2, now + 0.2);

      osc.connect(filter);
      filter.connect(voiceGain);
      oscList.push(osc);

      voiceGain.gain.setValueAtTime(0.0001, now);
      voiceGain.gain.linearRampToValueAtTime(0.9, now + 0.008);
      voiceGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
      releaseTime = 0.1;

    } else if (timbre === 'pad') {
      // Cosmic Pad: Dual detuned warmth with soft attack
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(freq - 1.5, now);
      osc2.frequency.setValueAtTime(freq + 1.5, now);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(freq * 2.5, now);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(voiceGain);
      oscList.push(osc1, osc2);

      voiceGain.gain.setValueAtTime(0.0001, now);
      voiceGain.gain.linearRampToValueAtTime(0.5, now + 0.15); // Warm attack
      voiceGain.gain.setValueAtTime(0.4, now + 0.4);
      releaseTime = 0.6;

    } else {
      // Default: Grand Synth (Rich Sawtooth / Square with dynamic filter envelope)
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc2.type = 'square';
      osc1.frequency.setValueAtTime(freq, now);
      osc2.frequency.setValueAtTime(freq * 1.002, now); // Subtly detuned

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(freq * 5, now);
      filter.frequency.exponentialRampToValueAtTime(freq * 2, now + 0.3);

      const subGain = this.ctx.createGain();
      subGain.gain.setValueAtTime(0.3, now);
      osc2.connect(subGain);

      osc1.connect(filter);
      subGain.connect(filter);
      filter.connect(voiceGain);
      oscList.push(osc1, osc2);

      voiceGain.gain.setValueAtTime(0.0001, now);
      voiceGain.gain.linearRampToValueAtTime(0.8, now + 0.02);
      voiceGain.gain.exponentialRampToValueAtTime(0.5, now + 0.2);
      releaseTime = 0.35;
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
