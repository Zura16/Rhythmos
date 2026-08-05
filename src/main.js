import { AudioEngine } from './audioEngine.js';
import { NoteWheel } from './noteWheel.js';
import { VisionTracker } from './visionTracker.js';
import { Topography } from './Topography.js';
import { PillNav } from './PillNav.js';

document.addEventListener('DOMContentLoaded', () => {
  const mainCanvas = document.getElementById('mainCanvas');
  const webcamVideo = document.getElementById('webcamVideo');
  const topographyContainer = document.getElementById('topographyContainer');
  const pillNavContainer = document.getElementById('pillNavContainer');

  const btnStartApp = document.getElementById('btnStartApp');
  const startModal = document.getElementById('startModal');
  const btnToggleCamera = document.getElementById('btnToggleCamera');
  const btnTestAudio = document.getElementById('btnTestAudio');

  const cameraDot = document.getElementById('cameraDot');
  const cameraStatusText = document.getElementById('cameraStatusText');
  const audioDot = document.getElementById('audioDot');
  const audioStatusText = document.getElementById('audioStatusText');

  const volSlider = document.getElementById('volSlider');
  const volVal = document.getElementById('volVal');
  const revSlider = document.getElementById('revSlider');
  const revVal = document.getElementById('revVal');

  // 1. Core Engines Initialization
  const audioEngine = new AudioEngine();
  const noteWheel = new NoteWheel(mainCanvas);

  // Force layout resize calculation immediately
  noteWheel.resize();
  window.addEventListener('load', () => noteWheel.resize());

  // 2. React Bits <PillNav /> Component Initialization
  let pillNav = null;
  if (pillNavContainer) {
    try {
      pillNav = new PillNav(pillNavContainer, {
        ease: 'power3.easeOut',
        baseColor: '#0F172A',
        pillColor: '#E2E8F0',
        hoveredPillTextColor: '#FFFFFF',
        pillTextColor: '#0F172A',
        initialLoadAnimation: true
      });
    } catch (e) {
      console.warn('PillNav notice:', e);
    }
  }

  // 3. React Bits <Topography /> Component Initialization
  let topography = null;
  if (topographyContainer) {
    try {
      topography = new Topography(topographyContainer, {
        lowColor: '#1E293B',
        midColor: '#64748B',
        highColor: '#CBD5E1',
        speed: 0.25,
        morphAmount: 2.5,
        morphSpeed: 0.04,
        bands: 2.5,
        thickness: 0.012,
        scale: 1.0,
        glow: 0.3,
        opacity: 0.55,
        mouseInteraction: true,
        mouseRadius: 0.3,
        mouseStrength: 0.4
      });
    } catch (e) {
      console.warn('Topography notice:', e);
    }
  }
  
  let latestCursorPos = { x: -1, y: -1, isCamera: false };
  let latestLandmarks = null;
  let currentActiveNoteIndex = -1;
  let isLoopRunning = false;

  const visionTracker = new VisionTracker(webcamVideo, mainCanvas, (handPos, landmarks) => {
    if (handPos) {
      latestCursorPos = handPos;
      latestLandmarks = landmarks;

      if (topography && handPos.x >= 0 && handPos.y >= 0) {
        topography.updateCursorPos(handPos.x, handPos.y);
      }
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

    if (topography) {
      topography.updateCursorPos(clientX, clientY);
    }
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

  // Main Canvas Render Loop
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

  function startRenderLoop() {
    if (!isLoopRunning) {
      isLoopRunning = true;
      renderLoop();
    }
  }

  // App Start Handler
  function initApp() {
    if (startModal) {
      startModal.style.display = 'none';
      startModal.classList.add('hidden');
    }

    try {
      audioEngine.init();
      audioEngine.resume();
    } catch (e) {
      console.warn('AudioContext resume notice:', e);
    }

    visionTracker.startCamera().then(cameraSuccess => {
      updateCameraUIStatus(cameraSuccess);
    }).catch(err => {
      console.warn('Camera start notice:', err);
      updateCameraUIStatus(false);
    });

    startRenderLoop();
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

  if (btnStartApp) {
    btnStartApp.addEventListener('click', initApp);
  }

  if (btnToggleCamera) {
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
  }

  if (btnTestAudio) {
    btnTestAudio.addEventListener('click', () => {
      audioEngine.init();
      audioEngine.resume();
      audioEngine.triggerNoteInstant('A', 4, 0.6);
      noteWheel.triggerRipple(0);
    });
  }

  // Pill Nav Dropdown Toggle Click Event Listeners
  document.querySelectorAll('.dropdown-toggle').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const parent = btn.closest('.pill-item');
      document.querySelectorAll('.pill-item').forEach(item => {
        if (item !== parent) item.classList.remove('open');
      });
      parent.classList.toggle('open');
    });
  });

  document.addEventListener('click', () => {
    document.querySelectorAll('.pill-item').forEach(item => item.classList.remove('open'));
  });

  // Timbre Selectors
  document.querySelectorAll('.timbre-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.timbre-btn').forEach(b => b.classList.remove('active'));
      const target = e.currentTarget;
      target.classList.add('active');
      const timbre = target.getAttribute('data-timbre');
      
      audioEngine.setTimbre(timbre);
      audioEngine.stopAllNotes();
      
      const prevActiveIndex = currentActiveNoteIndex;
      currentActiveNoteIndex = -1;

      if (prevActiveIndex >= 0) {
        const activeNote = noteWheel.notes[prevActiveIndex];
        audioEngine.startNote(activeNote.name);
        currentActiveNoteIndex = prevActiveIndex;
      }
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
      
      document.querySelectorAll('.octaveLabel').forEach(lbl => {
        lbl.textContent = oct;
      });

      audioEngine.stopAllNotes();
      currentActiveNoteIndex = -1;
    });
  });

  // Volume & Reverb Sliders
  if (volSlider) {
    volSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      if (volVal) volVal.textContent = `${val}%`;
      audioEngine.setVolume(val / 100);
    });
  }

  if (revSlider) {
    revSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      if (revVal) revVal.textContent = `${val}%`;
      audioEngine.setReverb(val / 100);
    });
  }

  // Mobile menu buttons
  const mobileCameraBtn = document.getElementById('mobileCameraBtn');
  const mobileTestBtn = document.getElementById('mobileTestBtn');

  if (mobileCameraBtn) {
    mobileCameraBtn.addEventListener('click', (e) => {
      e.preventDefault();
      btnToggleCamera.click();
    });
  }

  if (mobileTestBtn) {
    mobileTestBtn.addEventListener('click', (e) => {
      e.preventDefault();
      btnTestAudio.click();
    });
  }

  // Start initial render loop immediately
  startRenderLoop();
});
