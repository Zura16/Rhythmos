import { AudioEngine } from './audioEngine.js';
import { NoteWheel } from './noteWheel.js';
import { VisionTracker } from './visionTracker.js';
import { Ferrofluid } from './ferrofluid.js';
import { SongBookManager } from './songBook.js';

document.addEventListener('DOMContentLoaded', () => {
  const mainCanvas = document.getElementById('mainCanvas');
  const webcamVideo = document.getElementById('webcamVideo');

  const btnStartApp = document.getElementById('btnStartApp');
  const btnLearnMore = document.getElementById('btnLearnMore');
  const startModal = document.getElementById('startModal');
  const ferrofluidContainer = document.getElementById('ferrofluidContainer');
  
  const btnToggleCamera = document.getElementById('btnToggleCamera');
  const btnTestAudio = document.getElementById('btnTestAudio');
  const btnToggleSongbookDrawer = document.getElementById('btnToggleSongbookDrawer');
  const songbookDrawer = document.getElementById('songbookDrawer');

  const cameraDot = document.getElementById('cameraDot');
  const cameraStatusText = document.getElementById('cameraStatusText');
  const audioDot = document.getElementById('audioDot');
  const audioStatusText = document.getElementById('audioStatusText');

  const volSlider = document.getElementById('volSlider');
  const volVal = document.getElementById('volVal');
  const revSlider = document.getElementById('revSlider');
  const revVal = document.getElementById('revVal');
  const octaveLabel = document.getElementById('octaveLabel');

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

  if (btnToggleSongbookDrawer) {
    btnToggleSongbookDrawer.addEventListener('click', () => {
      songbookDrawer.classList.toggle('collapsed');
    });
  }
  
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

      audioDot.classList.add('active');
      audioStatusText.textContent = `Playing ${currentActiveChord.root} ${qLabel} Chord (Oct ${actualOctave})`;
    } else {
      audioDot.classList.remove('active');
      audioStatusText.textContent = 'Audio Idle';
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
    updateCameraUIStatus(cameraSuccess);

    renderLoop();
  }

  function updateCameraUIStatus(active) {
    if (active) {
      cameraDot.classList.add('active');
      cameraStatusText.textContent = 'Vision Active';
      btnToggleCamera.innerHTML = '<span>⏹️</span> Stop Camera';
      btnToggleCamera.classList.remove('btn-primary');
      btnToggleCamera.classList.add('btn-secondary');
    } else {
      cameraDot.classList.remove('active');
      cameraStatusText.textContent = 'Camera Off';
      btnToggleCamera.innerHTML = '<span>📹</span> Start Camera';
      btnToggleCamera.classList.remove('btn-secondary');
      btnToggleCamera.classList.add('btn-primary');
    }
  }

  if (btnStartApp) btnStartApp.addEventListener('click', initApp);
  if (btnLearnMore) btnLearnMore.addEventListener('click', initApp);

  btnToggleCamera.addEventListener('click', async () => {
    audioEngine.init();
    audioEngine.resume();

    if (visionTracker.isRunning) {
      visionTracker.stopCamera();
      updateCameraUIStatus(false);
    } else {
      const success = await visionTracker.startCamera();
      updateCameraUIStatus(success);
    }
  });

  btnTestAudio.addEventListener('click', () => {
    audioEngine.init();
    audioEngine.resume();
    audioEngine.triggerNoteInstant('A', 4, 0.6);
  });

  // Dropdown Toggle Handlers
  document.querySelectorAll('.dropdown-toggle').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const parent = btn.closest('.nav-item');
      document.querySelectorAll('.nav-item').forEach(item => {
        if (item !== parent) item.classList.remove('open');
      });
      parent.classList.toggle('open');
    });
  });

  document.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('open'));
  });

  // Acoustic Instrument Selectors
  document.querySelectorAll('.inst-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.inst-btn').forEach(b => b.classList.remove('active'));
      const target = e.currentTarget;
      target.classList.add('active');
      const inst = target.getAttribute('data-inst');
      audioEngine.setInstrument(inst);
    });
  });

  // Octave Selectors
  document.querySelectorAll('.oct-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.oct-btn').forEach(b => b.classList.remove('active'));
      const target = e.currentTarget;
      target.classList.add('active');
      const oct = parseInt(target.getAttribute('data-octave'), 10);
      audioEngine.setOctave(oct);
      octaveLabel.textContent = oct;

      audioEngine.stopAllNotes();
      currentActiveChord = null;
    });
  });

  // Volume & Reverb Sliders
  volSlider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    volVal.textContent = `${val}%`;
    audioEngine.setVolume(val / 100);
  });

  revSlider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    revVal.textContent = `${val}%`;
    audioEngine.setReverb(val / 100);
  });
});
