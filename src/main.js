import { AudioEngine } from './audioEngine.js';
import { NoteWheel } from './noteWheel.js';
import { VisionTracker } from './visionTracker.js';
import { Ferrofluid } from './ferrofluid.js';

document.addEventListener('DOMContentLoaded', () => {
  const mainCanvas = document.getElementById('mainCanvas');
  const webcamVideo = document.getElementById('webcamVideo');

  const btnStartApp = document.getElementById('btnStartApp');
  const btnLearnMore = document.getElementById('btnLearnMore');
  const startModal = document.getElementById('startModal');
  const ferrofluidContainer = document.getElementById('ferrofluidContainer');
  
  const btnToggleCamera = document.getElementById('btnToggleCamera');
  const btnTestAudio = document.getElementById('btnTestAudio');

  const cameraDot = document.getElementById('cameraDot');
  const cameraStatusText = document.getElementById('cameraStatusText');
  const audioDot = document.getElementById('audioDot');
  const audioStatusText = document.getElementById('audioStatusText');

  const volSlider = document.getElementById('volSlider');
  const volVal = document.getElementById('volVal');
  const filterSlider = document.getElementById('filterSlider');
  const filterVal = document.getElementById('filterVal');
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
  
  let latestCursorPos = { x: -1, y: -1, isCamera: false };
  let latestLandmarks = null;
  let currentActiveNoteIndex = -1;

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

  // Main Render Frame Loop
  function renderLoop() {
    const detectedNoteIndex = noteWheel.getNoteAtPosition(latestCursorPos);

    if (detectedNoteIndex !== currentActiveNoteIndex) {
      if (currentActiveNoteIndex >= 0) {
        const oldNote = noteWheel.notes[currentActiveNoteIndex];
        audioEngine.stopNote(oldNote.name);
      }

      if (detectedNoteIndex >= 0) {
        const newNote = noteWheel.notes[detectedNoteIndex];
        audioEngine.startNote(newNote.name);
        noteWheel.triggerRipple(detectedNoteIndex);
      }

      currentActiveNoteIndex = detectedNoteIndex;
    }

    let waveformData = null;
    let currentFreq = null;

    if (currentActiveNoteIndex >= 0) {
      const activeNote = noteWheel.notes[currentActiveNoteIndex];
      currentFreq = audioEngine.getFrequency(activeNote.name);
      waveformData = audioEngine.getWaveformData();

      audioDot.classList.add('active');
      audioStatusText.textContent = `Playing ${activeNote.name}${audioEngine.octave}`;
    } else {
      audioDot.classList.remove('active');
      audioStatusText.textContent = 'Audio Idle';
    }

    noteWheel.draw(latestCursorPos, latestLandmarks, waveformData, currentFreq);

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
    noteWheel.triggerRipple(0);
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

  // Timbre Selectors
  document.querySelectorAll('.timbre-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.timbre-btn').forEach(b => b.classList.remove('active'));
      const target = e.currentTarget;
      target.classList.add('active');
      const timbre = target.getAttribute('data-timbre');
      audioEngine.setTimbre(timbre);
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
      currentActiveNoteIndex = -1;
    });
  });

  // Volume, Filter & Reverb Sliders
  volSlider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    volVal.textContent = `${val}%`;
    audioEngine.setVolume(val / 100);
  });

  if (filterSlider) {
    filterSlider.addEventListener('input', (e) => {
      const hz = parseInt(e.target.value, 10);
      filterVal.textContent = hz >= 1000 ? `${(hz / 1000).toFixed(1)} kHz` : `${hz} Hz`;
      audioEngine.setFilterCutoff(hz);
    });
  }

  revSlider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    revVal.textContent = `${val}%`;
    audioEngine.setReverb(val / 100);
  });
});
