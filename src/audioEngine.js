// Professional Studio-Grade Polyphonic Web Audio Synthesizer Engine
export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.compressor = null;
    this.reverbNode = null;
    this.dryGain = null;
    this.wetGain = null;
    this.analyser = null;
    
    // Equalizer Nodes
    this.lowShelf = null;
    this.highShelf = null;

    this.volume = 0.85;
    this.reverbLevel = 0.35;
    this.filterCutoff = 2500; // Hz
    this.filterResonance = 3.0; // Q factor
    this.currentTimbre = 'analog'; // 'analog', 'wave', 'fmchime', 'pad', 'pluck', 'bass'
    this.octave = 4;
    
    this.activeVoices = new Map();
    this.chromaticNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  }

  init() {
    if (this.ctx) return;
    
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioCtx();
    
    // Master Compressor (Limiter) for studio punch & zero clipping distortion
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-12, this.ctx.currentTime);
    this.compressor.knee.setValueAtTime(10, this.ctx.currentTime);
    this.compressor.ratio.setValueAtTime(4, this.ctx.currentTime);
    this.compressor.attack.setValueAtTime(0.005, this.ctx.currentTime);
    this.compressor.release.setValueAtTime(0.15, this.ctx.currentTime);

    // Studio EQ (Bass & Treble Shelves)
    this.lowShelf = this.ctx.createBiquadFilter();
    this.lowShelf.type = 'lowshelf';
    this.lowShelf.frequency.setValueAtTime(180, this.ctx.currentTime);
    this.lowShelf.gain.setValueAtTime(2.0, this.ctx.currentTime);

    this.highShelf = this.ctx.createBiquadFilter();
    this.highShelf.type = 'highshelf';
    this.highShelf.frequency.setValueAtTime(6000, this.ctx.currentTime);
    this.highShelf.gain.setValueAtTime(1.5, this.ctx.currentTime);

    // Master Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);

    // Analyser node
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;

    // Convolver Reverb
    this.reverbNode = this.ctx.createConvolver();
    this.dryGain = this.ctx.createGain();
    this.wetGain = this.ctx.createGain();

    this.createImpulseResponse();

    this.dryGain.gain.setValueAtTime(1 - this.reverbLevel * 0.5, this.ctx.currentTime);
    this.wetGain.gain.setValueAtTime(this.reverbLevel, this.ctx.currentTime);

    // Audio Routing Chain:
    // Voice -> MasterGain -> EQ -> Reverb/Dry Split -> Compressor -> Analyser -> Destination
    this.masterGain.connect(this.lowShelf);
    this.lowShelf.connect(this.highShelf);

    this.highShelf.connect(this.dryGain);
    this.highShelf.connect(this.reverbNode);
    this.reverbNode.connect(this.wetGain);

    this.dryGain.connect(this.compressor);
    this.wetGain.connect(this.compressor);

    this.compressor.connect(this.analyser);
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
    const length = sampleRate * 2.5; // 2.5s studio space reverb
    const impulse = this.ctx.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const decay = Math.exp(-i / (sampleRate * 0.45));
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

    const baseOffset = semitonesFromA4[noteName] || 0;
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
    const releaseTime = voice.releaseTime || 0.35;

    voice.gainNode.gain.cancelScheduledValues(now);
    voice.gainNode.gain.setValueAtTime(voice.gainNode.gain.value, now);
    voice.gainNode.gain.exponentialRampToValueAtTime(0.0001, now + releaseTime);

    setTimeout(() => {
      try {
        voice.nodes.forEach(node => {
          if (node.stop) node.stop();
          if (node.disconnect) node.disconnect();
        });
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

  triggerNoteInstant(noteName, octave = this.octave, duration = 0.5) {
    this.startNote(noteName, octave);
    setTimeout(() => {
      this.stopNote(noteName, octave);
    }, duration * 1000);
  }

  createVoice(freq, timbre) {
    const now = this.ctx.currentTime;
    const voiceGain = this.ctx.createGain();
    const nodes = [];
    let releaseTime = 0.35;

    // Resonant Filter for synth warmth
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(this.filterCutoff, now);
    filter.Q.setValueAtTime(this.filterResonance, now);

    if (timbre === 'analog') {
      // 1. Analog Lead (Triple Detuned Sawtooth + Sub Sine + Filter Envelope)
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const oscSub = this.ctx.createOscillator();

      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';
      oscSub.type = 'sine';

      osc1.frequency.setValueAtTime(freq - 1.2, now);
      osc2.frequency.setValueAtTime(freq + 1.2, now);
      oscSub.frequency.setValueAtTime(freq * 0.5, now);

      // Filter Envelope Sweep
      filter.frequency.setValueAtTime(freq * 1.5, now);
      filter.frequency.exponentialRampToValueAtTime(Math.min(20000, freq * 5), now + 0.08);
      filter.frequency.exponentialRampToValueAtTime(this.filterCutoff, now + 0.35);

      const subGain = this.ctx.createGain();
      subGain.gain.setValueAtTime(0.35, now);

      osc1.connect(filter);
      osc2.connect(filter);
      oscSub.connect(subGain);
      subGain.connect(filter);

      nodes.push(osc1, osc2, oscSub, subGain, filter);

      voiceGain.gain.setValueAtTime(0.0001, now);
      voiceGain.gain.linearRampToValueAtTime(0.75, now + 0.025);
      voiceGain.gain.exponentialRampToValueAtTime(0.5, now + 0.2);
      releaseTime = 0.4;

    } else if (timbre === 'fmchime') {
      // 2. Ethereal FM Chime (Frequency Modulation Synthesis)
      const carrier = this.ctx.createOscillator();
      const modulator = this.ctx.createOscillator();
      const modGain = this.ctx.createGain();

      carrier.type = 'sine';
      modulator.type = 'sine';

      const modRatio = 3.5;
      carrier.frequency.setValueAtTime(freq, now);
      modulator.frequency.setValueAtTime(freq * modRatio, now);
      modGain.gain.setValueAtTime(freq * 2.0, now);
      modGain.gain.exponentialRampToValueAtTime(1, now + 0.4);

      modulator.connect(modGain);
      modGain.connect(carrier.frequency);
      carrier.connect(filter);

      nodes.push(carrier, modulator, modGain, filter);

      voiceGain.gain.setValueAtTime(0.0001, now);
      voiceGain.gain.linearRampToValueAtTime(0.7, now + 0.015);
      voiceGain.gain.exponentialRampToValueAtTime(0.3, now + 0.35);
      releaseTime = 0.6;

    } else if (timbre === 'pad') {
      // 3. Cosmic Pad (Warm Detuned Sine/Saw + LFO Chorus)
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';
      lfo.type = 'sine';

      osc1.frequency.setValueAtTime(freq - 1.8, now);
      osc2.frequency.setValueAtTime(freq + 1.8, now);
      lfo.frequency.setValueAtTime(4.5, now); // 4.5Hz chorus rate
      lfoGain.gain.setValueAtTime(1.5, now);

      lfo.connect(lfoGain);
      lfoGain.connect(osc2.frequency);

      osc1.connect(filter);
      osc2.connect(filter);

      nodes.push(osc1, osc2, lfo, lfoGain, filter);

      voiceGain.gain.setValueAtTime(0.0001, now);
      voiceGain.gain.linearRampToValueAtTime(0.6, now + 0.18); // Soft attack
      voiceGain.gain.setValueAtTime(0.45, now + 0.4);
      releaseTime = 0.65;

    } else if (timbre === 'pluck') {
      // 4. Electric Pluck (Rhodes / Percussive Electric Piano)
      const osc = this.ctx.createOscillator();
      const oscHarmonic = this.ctx.createOscillator();
      osc.type = 'triangle';
      oscHarmonic.type = 'sine';

      osc.frequency.setValueAtTime(freq, now);
      oscHarmonic.frequency.setValueAtTime(freq * 2, now);

      filter.frequency.setValueAtTime(freq * 6, now);
      filter.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.15);

      const harmGain = this.ctx.createGain();
      harmGain.gain.setValueAtTime(0.3, now);
      harmGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

      osc.connect(filter);
      oscHarmonic.connect(harmGain);
      harmGain.connect(filter);

      nodes.push(osc, oscHarmonic, harmGain, filter);

      voiceGain.gain.setValueAtTime(0.0001, now);
      voiceGain.gain.linearRampToValueAtTime(0.85, now + 0.008);
      voiceGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
      releaseTime = 0.15;

    } else if (timbre === 'bass') {
      // 5. Moog Sub Bass (Fat Filtered Square/Saw Bass)
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc2.type = 'square';

      // Transpose down 1 octave for deep bass punch
      const bassFreq = freq * 0.5;
      osc1.frequency.setValueAtTime(bassFreq, now);
      osc2.frequency.setValueAtTime(bassFreq * 1.005, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(bassFreq * 3, now);
      filter.Q.setValueAtTime(5.0, now);

      osc1.connect(filter);
      osc2.connect(filter);

      nodes.push(osc1, osc2, filter);

      voiceGain.gain.setValueAtTime(0.0001, now);
      voiceGain.gain.linearRampToValueAtTime(0.9, now + 0.015);
      voiceGain.gain.exponentialRampToValueAtTime(0.6, now + 0.2);
      releaseTime = 0.3;

    } else {
      // 6. 80s Wave Synth (Saturated Detuned Dual Sawtooth)
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';

      osc1.frequency.setValueAtTime(freq - 2.5, now);
      osc2.frequency.setValueAtTime(freq + 2.5, now);

      osc1.connect(filter);
      osc2.connect(filter);

      nodes.push(osc1, osc2, filter);

      voiceGain.gain.setValueAtTime(0.0001, now);
      voiceGain.gain.linearRampToValueAtTime(0.75, now + 0.02);
      voiceGain.gain.exponentialRampToValueAtTime(0.45, now + 0.25);
      releaseTime = 0.35;
    }

    filter.connect(voiceGain);
    voiceGain.connect(this.masterGain);

    nodes.forEach(n => {
      if (n.start) n.start(now);
    });

    return {
      nodes,
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

  setFilterCutoff(hz) {
    this.filterCutoff = Math.max(200, Math.min(18000, hz));
  }

  setFilterResonance(q) {
    this.filterResonance = Math.max(0.5, Math.min(12, q));
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
