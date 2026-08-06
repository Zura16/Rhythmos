import { AudioEngine } from './audioEngine.js';
import { NoteWheel } from './noteWheel.js';
import { VisionTracker } from './visionTracker.js';
import { Ferrofluid } from './ferrofluid.js';
import { SongBookManager } from './songBook.js';
import { CardNav } from './cardNav.js';

document.addEventListener('DOMContentLoaded', () => {
  const mainCanvas = document.getElementById('mainCanvas');
  const webcamVideo = document.getElementById('webcamVideo');

  const btnStartApp = document.getElementById('btnStartApp');
  const btnLearnMore = document.getElementById('btnLearnMore');
  const startModal = document.getElementById('startModal');
  const ferrofluidContainer = document.getElementById('ferrofluidContainer');
  const songbookDrawer = document.getElementById('songbookDrawer');
  const cardNavContainer = document.getElementById('cardNavContainer');

  const audioDot = document.getElementById('audioDot');
  const audioStatusText = document.getElementById('audioStatusText');

  // Initialize Ferrofluid background on hero splash screen
  let ferrofluid = null;
  if (ferrofluidContainer) {
    try {
      ferrofluid = new Ferrofluid(ferrofluidContainer, {
        colors: ["#ffffff", "#ffffff", "#ffffff"],
        speed: 0.5,
        scale: 1,
        turbulence: 1,
        fluidity: 0.1,
        rimWidth: 0.2,
        sharpness: 3,
        shimmer: 1,
        glow: 2,
        flowDirection: "down",
        opacity: 1,
        mouseInteraction: true,
        mouseStrength: 1,
        mouseRadius: 0.3
      });
    } catch (err) {
      console.warn('Ferrofluid WebGL initialization fallback:', err);
    }
  }

  const audioEngine = new AudioEngine();
  const noteWheel = new NoteWheel(mainCanvas);

  // Initialize Songbook Teleprompter
  const songBookManager = new SongBookManager(songbookDrawer, (selectedChordStr) => {
    noteWheel.setHighlightedChord(selectedChordStr);
  });
  songBookManager.render();

  // Initialize React Bits CardNav Floating Navigation Bar
  const cardNav = new CardNav(cardNavContainer, {
    currentInstrument: 'harmonium',
    currentOctave: 4,
    onInstrumentChange: (inst) => {
      audioEngine.setInstrument(inst);
    },
    onOctaveChange: (oct) => {
      audioEngine.setOctave(oct);
      audioEngine.stopAllNotes();
      currentActiveChord = null;
    },
    onVolumeChange: (vol) => {
      audioEngine.setVolume(vol);
    },
    onReverbChange: (rev) => {
      audioEngine.setReverb(rev);
    },
    onCameraToggle: async () => {
      audioEngine.init();
      audioEngine.resume();

      if (visionTracker.isRunning) {
        visionTracker.stopCamera();
        cardNav.updateCameraUI(false);
      } else {
        const success = await visionTracker.startCamera();
        cardNav.updateCameraUI(success);
      }
    },
    onTestAudio: () => {
      audioEngine.init();
      audioEngine.resume();
      audioEngine.triggerNoteInstant('A', 4, 0.6);
    },
    onSongbookToggle: () => {
      songbookDrawer.classList.toggle('collapsed');
    }
  });

  let latestCursorPos = { x: -1, y: -1, isCamera: false };
  let latestLandmarks = null;
  let currentActiveChord = null;

  const visionTracker = new VisionTracker(webcamVideo, mainCanvas, (handPos, landmarks) => {
    if (handPos) {
      latestCursorPos = handPos;
      latestLandmarks = landmarks;
    } else if (latestCursorPos.isCamera) {
      latestCursorPos = { x: -1, y: -1, isCamera: false };
      latestLandmarks = null;
    }
  });

  // Pointer Listeners
  function updatePointerPos(e) {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    latestCursorPos = {
      x: clientX,
      y: clientY,
      isCamera: false
    };
    latestLandmarks = null;
  }

  window.addEventListener('mousemove', updatePointerPos);
  window.addEventListener('touchstart', (e) => { updatePointerPos(e); });
  window.addEventListener('touchmove', (e) => { updatePointerPos(e); e.preventDefault(); });

  window.addEventListener('mouseleave', () => {
    if (!latestCursorPos.isCamera) {
      latestCursorPos = { x: -1, y: -1, isCamera: false };
      latestLandmarks = null;
    }
  });

  function isSameChord(c1, c2) {
    if (!c1 && !c2) return true;
    if (!c1 || !c2) return false;
    return c1.root === c2.root && c1.quality === c2.quality && c1.octaveOffset === c2.octaveOffset;
  }

  // Main Render Frame Loop
  function renderLoop() {
    const detectedChord = noteWheel.getNoteAtPosition(latestCursorPos);

    if (!isSameChord(detectedChord, currentActiveChord)) {
      if (currentActiveChord) {
        audioEngine.stopChord(
          currentActiveChord.root, 
          currentActiveChord.quality, 
          audioEngine.octave + currentActiveChord.octaveOffset
        );
      }

      if (detectedChord) {
        audioEngine.startChord(
          detectedChord.root, 
          detectedChord.quality, 
          audioEngine.octave + detectedChord.octaveOffset
        );
      }

      currentActiveChord = detectedChord;
    }

    let waveformData = null;

    if (currentActiveChord) {
      waveformData = audioEngine.getWaveformData();
      const qLabel = (currentActiveChord.quality === 'major') ? 'Major' : 'Minor';
      const actualOctave = audioEngine.octave + currentActiveChord.octaveOffset;

      if (audioDot) audioDot.classList.add('active');
      if (audioStatusText) audioStatusText.textContent = `Playing ${currentActiveChord.root} ${qLabel} Chord (Oct ${actualOctave})`;
    } else {
      if (audioDot) audioDot.classList.remove('active');
      if (audioStatusText) audioStatusText.textContent = 'Audio Idle';
    }

    noteWheel.draw(latestCursorPos, latestLandmarks, waveformData);

    requestAnimationFrame(renderLoop);
  }

  // App Init Callback
  async function initApp() {
    audioEngine.init();
    audioEngine.resume();
    
    startModal.classList.add('hidden');
    if (ferrofluid) {
      setTimeout(() => {
        ferrofluid.destroy();
        ferrofluid = null;
      }, 500);
    }

    const cameraSuccess = await visionTracker.startCamera();
    cardNav.updateCameraUI(cameraSuccess);

    renderLoop();
  }

  if (btnStartApp) btnStartApp.addEventListener('click', initApp);
  if (btnLearnMore) btnLearnMore.addEventListener('click', initApp);
});
