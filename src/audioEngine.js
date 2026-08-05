// Professional Acoustic Audio Engine with Polyphonic Major & Minor Chord Synthesis
export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.compressor = null;
    this.reverbNode = null;
    this.dryGain = null;
    this.wetGain = null;
    this.analyser = null;
    
    this.lowShelf = null;
    this.highShelf = null;

    this.volume = 0.85;
    this.reverbLevel = 0.35;
    this.currentInstrument = 'harmonium'; // 'harmonium', 'piano', 'guitar', 'strings', 'marimba', 'rhodes', 'organ'
    this.octave = 4;
    
    this.activeVoices = new Map();
    this.chromaticNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    
    this.semitoneMap = {
      'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4,
      'F': 5, 'F#': 6, 'G': 7, 'G#': 8,
      'A': 9, 'A#': 10, 'B': 11
    };
  }

  init() {
    if (this.ctx) return;
    
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioCtx();
    
    // Studio Compressor
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-14, this.ctx.currentTime);
    this.compressor.knee.setValueAtTime(8, this.ctx.currentTime);
    this.compressor.ratio.setValueAtTime(3.5, this.ctx.currentTime);
    this.compressor.attack.setValueAtTime(0.005, this.ctx.currentTime);
    this.compressor.release.setValueAtTime(0.2, this.ctx.currentTime);

    // Studio Acoustic EQ
    this.lowShelf = this.ctx.createBiquadFilter();
    this.lowShelf.type = 'lowshelf';
    this.lowShelf.frequency.setValueAtTime(200, this.ctx.currentTime);
    this.lowShelf.gain.setValueAtTime(1.5, this.ctx.currentTime);

    this.highShelf = this.ctx.createBiquadFilter();
    this.highShelf.type = 'highshelf';
    this.highShelf.frequency.setValueAtTime(5000, this.ctx.currentTime);
    this.highShelf.gain.setValueAtTime(1.2, this.ctx.currentTime);

    // Master Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);

    // Analyser node
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;

    // Concert Hall Reverb
    this.reverbNode = this.ctx.createConvolver();
    this.dryGain = this.ctx.createGain();
    this.wetGain = this.ctx.createGain();

    this.createImpulseResponse();

    this.dryGain.gain.setValueAtTime(1 - this.reverbLevel * 0.5, this.ctx.currentTime);
    this.wetGain.gain.setValueAtTime(this.reverbLevel, this.ctx.currentTime);

    // Audio Routing:
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
    const length = sampleRate * 2.8;
    const impulse = this.ctx.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const decay = Math.exp(-i / (sampleRate * 0.5));
      left[i] = (Math.random() * 2 - 1) * decay;
      right[i] = (Math.random() * 2 - 1) * decay;
    }

    this.reverbNode.buffer = impulse;
  }

  getFrequencyFromSemitones(totalSemitonesFromA4) {
    return 440 * Math.pow(2, totalSemitonesFromA4 / 12);
  }

  getFrequency(noteName, octave = this.octave) {
    const semitonesFromA4 = {
      'C': -9, 'C#': -8, 'D': -7, 'D#': -6, 'E': -5,
      'F': -4, 'F#': -3, 'G': -2, 'G#': -1,
      'A': 0,  'A#': 1,  'B': 2
    };

    const baseOffset = semitonesFromA4[noteName] || 0;
    const octaveOffset = (octave - 4) * 12;
    return this.getFrequencyFromSemitones(baseOffset + octaveOffset);
  }

  // Calculate the 3 note frequencies for a Major or Minor chord
  getChordFrequencies(rootNoteName, quality = 'major', octave = this.octave) {
    const semitonesFromA4 = {
      'C': -9, 'C#': -8, 'D': -7, 'D#': -6, 'E': -5,
      'F': -4, 'F#': -3, 'G': -2, 'G#': -1,
      'A': 0,  'A#': 1,  'B': 2
    };

    const rootOffset = semitonesFromA4[rootNoteName] || 0;
    const octaveOffset = (octave - 4) * 12;
    const rootTotal = rootOffset + octaveOffset;

    // Major Chord: Root (0), Major 3rd (+4 semitones), Perfect 5th (+7 semitones)
    // Minor Chord: Root (0), Minor 3rd (+3 semitones), Perfect 5th (+7 semitones)
    const thirdInterval = (quality === 'major') ? 4 : 3;
    const fifthInterval = 7;

    return [
      this.getFrequencyFromSemitones(rootTotal),
      this.getFrequencyFromSemitones(rootTotal + thirdInterval),
      this.getFrequencyFromSemitones(rootTotal + fifthInterval)
    ];
  }

  startChord(rootNoteName, quality = 'major', octave = this.octave) {
    if (!this.ctx) this.init();
    this.resume();

    const chordKey = `${rootNoteName}_${quality}_${octave}`;
    if (this.activeVoices.has(chordKey)) return;

    const freqs = this.getChordFrequencies(rootNoteName, quality, octave);
    
    // Polyphonic Triad Voices (Root, 3rd, 5th)
    const chordVoices = freqs.map((f, idx) => {
      // Slightly balance gain across triad notes
      const voice = this.createVoice(f, this.currentInstrument);
      if (idx === 1) voice.gainNode.gain.setValueAtTime(voice.gainNode.gain.value * 0.85, this.ctx.currentTime);
      if (idx === 2) voice.gainNode.gain.setValueAtTime(voice.gainNode.gain.value * 0.8, this.ctx.currentTime);
      return voice;
    });

    this.activeVoices.set(chordKey, chordVoices);
  }

  stopChord(rootNoteName, quality = 'major', octave = this.octave) {
    const chordKey = `${rootNoteName}_${quality}_${octave}`;
    const chordVoices = this.activeVoices.get(chordKey);
    if (!chordVoices) return;

    const now = this.ctx.currentTime;

    chordVoices.forEach(voice => {
      const releaseTime = voice.releaseTime || 0.4;
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
        } catch (e) {}
      }, releaseTime * 1000 + 50);
    });

    this.activeVoices.delete(chordKey);
  }

  stopAllNotes() {
    for (const [key] of this.activeVoices) {
      const parts = key.split('_');
      if (parts.length === 3) {
        this.stopChord(parts[0], parts[1], parseInt(parts[2], 10));
      } else {
        const noteName = key.replace(/\d+/, '');
        const octave = parseInt(key.match(/\d+/)[0], 10);
        this.stopNote(noteName, octave);
      }
    }
  }

  triggerNoteInstant(rootNoteName, octave = this.octave, duration = 0.6) {
    this.startChord(rootNoteName, 'major', octave);
    setTimeout(() => {
      this.stopChord(rootNoteName, 'major', octave);
    }, duration * 1000);
  }

  createVoice(freq, instrument) {
    const now = this.ctx.currentTime;
    const voiceGain = this.ctx.createGain();
    const nodes = [];
    let releaseTime = 0.4;

    if (instrument === 'harmonium') {
      // Free-Reed Harmonium (Dual Reed Ranks + Octave Coupler + Bellows Modulation)
      const reed1 = this.ctx.createOscillator();
      const reed2 = this.ctx.createOscillator();
      const subReed = this.ctx.createOscillator();

      reed1.type = 'sawtooth';
      reed2.type = 'square';
      subReed.type = 'sawtooth';

      reed1.frequency.setValueAtTime(freq, now);
      reed2.frequency.setValueAtTime(freq * 2.002, now);
      subReed.frequency.setValueAtTime(freq * 0.5, now);

      const bellowsLfo = this.ctx.createOscillator();
      const bellowsGain = this.ctx.createGain();
      bellowsLfo.type = 'sine';
      bellowsLfo.frequency.setValueAtTime(5.5, now);
      bellowsGain.gain.setValueAtTime(0.06, now);

      bellowsLfo.connect(bellowsGain);

      const chamberFilter = this.ctx.createBiquadFilter();
      chamberFilter.type = 'lowpass';
      chamberFilter.frequency.setValueAtTime(freq * 3.5, now);
      chamberFilter.Q.setValueAtTime(2.2, now);

      const r2Gain = this.ctx.createGain();
      const subGain = this.ctx.createGain();
      r2Gain.gain.setValueAtTime(0.4, now);
      subGain.gain.setValueAtTime(0.2, now);

      reed2.connect(r2Gain);
      subReed.connect(subGain);

      reed1.connect(chamberFilter);
      r2Gain.connect(chamberFilter);
      subGain.connect(chamberFilter);

      chamberFilter.connect(voiceGain);
      bellowsGain.connect(voiceGain.gain);

      nodes.push(reed1, reed2, subReed, bellowsLfo, bellowsGain, r2Gain, subGain, chamberFilter);

      voiceGain.gain.setValueAtTime(0.0001, now);
      voiceGain.gain.linearRampToValueAtTime(0.55, now + 0.05); // Balanced polyphonic chord volume
      voiceGain.gain.setValueAtTime(0.45, now + 0.3);
      releaseTime = 0.45;

    } else if (instrument === 'piano') {
      // Acoustic Grand Piano
      const fundamental = this.ctx.createOscillator();
      const octaveHarmonic = this.ctx.createOscillator();
      const fifthHarmonic = this.ctx.createOscillator();

      fundamental.type = 'triangle';
      octaveHarmonic.type = 'sine';
      fifthHarmonic.type = 'sine';

      fundamental.frequency.setValueAtTime(freq, now);
      octaveHarmonic.frequency.setValueAtTime(freq * 2.001, now);
      fifthHarmonic.frequency.setValueAtTime(freq * 3.002, now);

      const soundboardFilter = this.ctx.createBiquadFilter();
      soundboardFilter.type = 'lowpass';
      soundboardFilter.frequency.setValueAtTime(freq * 4.2, now);
      soundboardFilter.frequency.exponentialRampToValueAtTime(freq * 1.8, now + 0.5);

      const octGain = this.ctx.createGain();
      const fifthGain = this.ctx.createGain();
      octGain.gain.setValueAtTime(0.35, now);
      fifthGain.gain.setValueAtTime(0.12, now);

      octaveHarmonic.connect(octGain);
      fifthHarmonic.connect(fifthGain);

      fundamental.connect(soundboardFilter);
      octGain.connect(soundboardFilter);
      fifthGain.connect(soundboardFilter);
      soundboardFilter.connect(voiceGain);

      nodes.push(fundamental, octaveHarmonic, fifthHarmonic, octGain, fifthGain, soundboardFilter);

      voiceGain.gain.setValueAtTime(0.0001, now);
      voiceGain.gain.linearRampToValueAtTime(0.65, now + 0.008);
      voiceGain.gain.exponentialRampToValueAtTime(0.3, now + 0.35);
      releaseTime = 0.5;

    } else if (instrument === 'guitar') {
      // Acoustic Nylon Guitar
      const stringOsc = this.ctx.createOscillator();
      const overtoneOsc = this.ctx.createOscillator();

      stringOsc.type = 'triangle';
      overtoneOsc.type = 'sine';

      stringOsc.frequency.setValueAtTime(freq, now);
      overtoneOsc.frequency.setValueAtTime(freq * 2, now);

      const bodyFilter = this.ctx.createBiquadFilter();
      bodyFilter.type = 'bandpass';
      bodyFilter.frequency.setValueAtTime(1100, now);
      bodyFilter.Q.setValueAtTime(2.0, now);

      const directGain = this.ctx.createGain();
      const bodyGain = this.ctx.createGain();
      directGain.gain.setValueAtTime(0.6, now);
      bodyGain.gain.setValueAtTime(0.25, now);

      stringOsc.connect(directGain);
      stringOsc.connect(bodyFilter);
      overtoneOsc.connect(directGain);

      bodyFilter.connect(bodyGain);

      directGain.connect(voiceGain);
      bodyGain.connect(voiceGain);

      nodes.push(stringOsc, overtoneOsc, bodyFilter, directGain, bodyGain);

      voiceGain.gain.setValueAtTime(0.0001, now);
      voiceGain.gain.linearRampToValueAtTime(0.6, now + 0.006);
      voiceGain.gain.exponentialRampToValueAtTime(0.12, now + 0.4);
      releaseTime = 0.4;

    } else if (instrument === 'strings') {
      // Symphonic Strings
      const string1 = this.ctx.createOscillator();
      const string2 = this.ctx.createOscillator();
      const vibratoLfo = this.ctx.createOscillator();
      const vibratoGain = this.ctx.createGain();

      string1.type = 'sawtooth';
      string2.type = 'triangle';
      vibratoLfo.type = 'sine';

      string1.frequency.setValueAtTime(freq, now);
      string2.frequency.setValueAtTime(freq * 1.002, now);
      vibratoLfo.frequency.setValueAtTime(5.2, now);
      vibratoGain.gain.setValueAtTime(2.0, now);

      vibratoLfo.connect(vibratoGain);
      vibratoGain.connect(string1.frequency);
      vibratoGain.connect(string2.frequency);

      const sectionFilter = this.ctx.createBiquadFilter();
      sectionFilter.type = 'lowpass';
      sectionFilter.frequency.setValueAtTime(freq * 3.0, now);

      string1.connect(sectionFilter);
      string2.connect(sectionFilter);
      sectionFilter.connect(voiceGain);

      nodes.push(string1, string2, vibratoLfo, vibratoGain, sectionFilter);

      voiceGain.gain.setValueAtTime(0.0001, now);
      voiceGain.gain.linearRampToValueAtTime(0.5, now + 0.12);
      voiceGain.gain.setValueAtTime(0.4, now + 0.35);
      releaseTime = 0.6;

    } else if (instrument === 'marimba') {
      // Concert Marimba
      const barOsc = this.ctx.createOscillator();
      const tineOsc = this.ctx.createOscillator();

      barOsc.type = 'sine';
      tineOsc.type = 'sine';

      barOsc.frequency.setValueAtTime(freq, now);
      tineOsc.frequency.setValueAtTime(freq * 4.0, now);

      const tineGain = this.ctx.createGain();
      tineGain.gain.setValueAtTime(0.3, now);
      tineGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      tineOsc.connect(tineGain);
      barOsc.connect(voiceGain);
      tineGain.connect(voiceGain);

      nodes.push(barOsc, tineOsc, tineGain);

      voiceGain.gain.setValueAtTime(0.0001, now);
      voiceGain.gain.linearRampToValueAtTime(0.7, now + 0.004);
      voiceGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
      releaseTime = 0.12;

    } else if (instrument === 'organ') {
      // Pipe Organ
      const rank8 = this.ctx.createOscillator();
      const rank4 = this.ctx.createOscillator();
      const rank2 = this.ctx.createOscillator();

      rank8.type = 'sine';
      rank4.type = 'triangle';
      rank2.type = 'sine';

      rank8.frequency.setValueAtTime(freq, now);
      rank4.frequency.setValueAtTime(freq * 2.0, now);
      rank2.frequency.setValueAtTime(freq * 4.0, now);

      const r4Gain = this.ctx.createGain();
      const r2Gain = this.ctx.createGain();
      r4Gain.gain.setValueAtTime(0.35, now);
      r2Gain.gain.setValueAtTime(0.18, now);

      rank4.connect(r4Gain);
      rank2.connect(r2Gain);

      rank8.connect(voiceGain);
      r4Gain.connect(voiceGain);
      r2Gain.connect(voiceGain);

      nodes.push(rank8, rank4, rank2, r4Gain, r2Gain);

      voiceGain.gain.setValueAtTime(0.0001, now);
      voiceGain.gain.linearRampToValueAtTime(0.55, now + 0.04);
      voiceGain.gain.setValueAtTime(0.45, now + 0.3);
      releaseTime = 0.5;

    } else {
      // Vintage Rhodes
      const tineFund = this.ctx.createOscillator();
      const tineHarm = this.ctx.createOscillator();

      tineFund.type = 'sine';
      tineHarm.type = 'sine';

      tineFund.frequency.setValueAtTime(freq, now);
      tineHarm.frequency.setValueAtTime(freq * 6.5, now);

      const harmGain = this.ctx.createGain();
      harmGain.gain.setValueAtTime(0.35, now);
      harmGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      tineHarm.connect(harmGain);
      tineFund.connect(voiceGain);
      harmGain.connect(voiceGain);

      nodes.push(tineFund, tineHarm, harmGain);

      voiceGain.gain.setValueAtTime(0.0001, now);
      voiceGain.gain.linearRampToValueAtTime(0.65, now + 0.005);
      voiceGain.gain.exponentialRampToValueAtTime(0.2, now + 0.4);
      releaseTime = 0.35;
    }

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

  setInstrument(inst) {
    this.currentInstrument = inst;
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
