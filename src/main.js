import { AudioEngine } from './audioEngine.js';
import { NoteWheel } from './noteWheel.js';
import { VisionTracker } from './visionTracker.js';
import { Ferrofluid } from './ferrofluid.js';
import { SongBookManager } from './songBook.js';
import { PillNav } from './pillNav.js';

document.addEventListener('DOMContentLoaded', () => {
  const mainCanvas = document.getElementById('mainCanvas');
  const webcamVideo = document.getElementById('webcamVideo');

  const btnStartApp = document.getElementById('btnStartApp');
  const btnLearnMore = document.getElementById('btnLearnMore');
  const startModal = document.getElementById('startModal');
  const ferrofluidContainer = document.getElementById('ferrofluidContainer');
  const songbookDrawer = document.getElementById('songbookDrawer');

  const cameraDot = document.getElementById('cameraDot');
  const cameraStatusText = document.getElementById('cameraStatusText');
  const audioDot = document.getElementById('audioDot');
  const audioStatusText = document.getElementById('audioStatusText');

  const volSlider = document.getElementById('volSlider');
  const volVal = document.getElementById('volVal');
  const revSlider = document.getElementById('revSlider');
  const revVal = document.getElementById('revVal');

  const instNameMap = {
    harmonium: '🪗 Harmonium',
    piano: '🎹 Grand Piano',
    guitar: '🎸 Nylon Guitar',
    strings: '🎻 Symphonic Strings',
    marimba: '🪵 Concert Marimba',
    rhodes: '⚡ Vintage Rhodes',
    organ: '⛪ Church Organ'
  };

  const audioEngine = new AudioEngine();
  const noteWheel = new NoteWheel(mainCanvas);

  // Initialize Songbook Teleprompter
  const songBookManager = new SongBookManager(songbookDrawer, (selectedChordStr) => {
    noteWheel.setHighlightedChord(selectedChordStr);
  });
  songBookManager.render();

  // Initialize React Bits PillNav Component with ALL controls inside the single bar!
  const pillNavContainer = document.getElementById('pillNavContainer');
  let pillNav = null;

  if (pillNavContainer) {
    pillNav = new PillNav(pillNavContainer, {
      logo: '🎵',
      ease: 'power2.easeOut',
      baseColor: '#0F172A',
      pillColor: 'rgba(255, 255, 255, 0.12)',
      hoveredPillTextColor: '#FFFFFF',
      pillTextColor: '#F8FAFC',
      items: [
        {
          id: 'pillInst',
          label: '🪗 Harmonium',
          hasDropdown: true,
          dropdownContent: `
            <div class="dropdown-header">Select Instrument</div>
            <ul class="grid w-[550px] grid-cols-2 gap-3 p-4">
              <li>
                <button class="nav-card-link inst-btn active" data-inst="harmonium">
                  <div class="text-sm font-semibold leading-none">🪗 Harmonium</div>
                  <div class="text-xs text-muted-foreground mt-1">Free-reed Indian harmonium</div>
                </button>
              </li>
              <li>
                <button class="nav-card-link inst-btn" data-inst="piano">
                  <div class="text-sm font-semibold leading-none">🎹 Grand Piano</div>
                  <div class="text-xs text-muted-foreground mt-1">Steinway acoustic grand</div>
                </button>
              </li>
              <li>
                <button class="nav-card-link inst-btn" data-inst="guitar">
                  <div class="text-sm font-semibold leading-none">🎸 Nylon Guitar</div>
                  <div class="text-xs text-muted-foreground mt-1">Plucked acoustic nylon string</div>
                </button>
              </li>
              <li>
                <button class="nav-card-link inst-btn" data-inst="strings">
                  <div class="text-sm font-semibold leading-none">🎻 Symphonic Strings</div>
                  <div class="text-xs text-muted-foreground mt-1">Orchestral bowed violin section</div>
                </button>
              </li>
              <li>
                <button class="nav-card-link inst-btn" data-inst="marimba">
                  <div class="text-sm font-semibold leading-none">🪵 Concert Marimba</div>
                  <div class="text-xs text-muted-foreground mt-1">Rosewood bar & tube resonator</div>
                </button>
              </li>
              <li>
                <button class="nav-card-link inst-btn" data-inst="rhodes">
                  <div class="text-sm font-semibold leading-none">⚡ Vintage Rhodes</div>
                  <div class="text-xs text-muted-foreground mt-1">Tine bell electric piano</div>
                </button>
              </li>
              <li>
                <button class="nav-card-link inst-btn" data-inst="organ">
                  <div class="text-sm font-semibold leading-none">⛪ Church Organ</div>
                  <div class="text-xs text-muted-foreground mt-1">Cathedral 3-rank pipe organ</div>
                </button>
              </li>
            </ul>
          `
        },
        {
          id: 'pillVision',
          label: '📹 Vision',
          hasDropdown: true,
          dropdownContent: `
            <div class="dropdown-header">Camera Control</div>
            <div class="p-4" style="width: 280px;">
              <button id="btnToggleCamera" class="btn-primary" style="margin-bottom: 0.75rem;">
                <span>📹</span> Start Camera
              </button>
              <div class="badge" id="cameraBadge" style="width: 100%; justify-content: center;">
                <span class="badge-dot" id="cameraDot"></span>
                <span id="cameraStatusText">Camera Off</span>
              </div>
            </div>
          `
        },
        {
          id: 'pillOctave',
          label: '🎼 Octave (<span id="octaveLabel">4</span>)',
          hasDropdown: true,
          dropdownContent: `
            <div class="dropdown-header">Octave Pitch Range</div>
            <div class="p-4" style="width: 280px;">
              <div class="octave-bar">
                <button class="oct-btn" data-octave="2">2</button>
                <button class="oct-btn" data-octave="3">3</button>
                <button class="oct-btn active" data-octave="4">4</button>
                <button class="oct-btn" data-octave="5">5</button>
                <button class="oct-btn" data-octave="6">6</button>
              </div>
            </div>
          `
        },
        {
          id: 'pillAudio',
          label: '🎚️ Audio Mix',
          hasDropdown: true,
          dropdownContent: `
            <div class="dropdown-header">Master Sound Controls</div>
            <div class="p-4" style="width: 300px; display: flex; flex-direction: column; gap: 0.85rem;">
              <div class="control-group">
                <div class="control-label">
                  <span>Master Volume</span>
                  <span id="volVal">85%</span>
                </div>
                <input type="range" id="volSlider" min="0" max="100" value="85">
              </div>
              <div class="control-group">
                <div class="control-label">
                  <span>Concert Reverb</span>
                  <span id="revVal">35%</span>
                </div>
                <input type="range" id="revSlider" min="0" max="100" value="35">
              </div>
            </div>
          `
        },
        {
          id: 'pillSongbook',
          label: '🎤 Songbook Lyrics',
          hasDropdown: false,
          onClick: () => {
            if (songbookDrawer) songbookDrawer.classList.toggle('collapsed');
          }
        },
        {
          id: 'pillTestAudio',
          label: '🔔 Test Note',
          hasDropdown: false,
          onClick: () => {
            audioEngine.init();
            audioEngine.resume();
            audioEngine.triggerNoteInstant('A', 4, 0.6);
          }
        }
      ]
    });
  }

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

  // Acoustic Instrument Selectors (Updates Dynamic Top Label on PillNav!)
  document.addEventListener('click', (e) => {
    const instBtn = e.target.closest('.inst-btn');
    if (instBtn) {
      document.querySelectorAll('.inst-btn').forEach(b => b.classList.remove('active'));
      instBtn.classList.add('active');
      const instKey = instBtn.getAttribute('data-inst');
      
      audioEngine.setInstrument(instKey);

      // Dynamically display selected instrument at top PillNav tab!
      if (pillNav && instNameMap[instKey]) {
        pillNav.updatePillLabel('pillInst', instNameMap[instKey]);
      }
    }

    const octBtn = e.target.closest('.oct-btn');
    if (octBtn) {
      document.querySelectorAll('.oct-btn').forEach(b => b.classList.remove('active'));
      octBtn.classList.add('active');
      const oct = parseInt(octBtn.getAttribute('data-octave'), 10);
      audioEngine.setOctave(oct);
      
      const octLbl = document.getElementById('octaveLabel');
      if (octLbl) octLbl.textContent = oct;

      audioEngine.stopAllNotes();
      currentActiveChord = null;
    }
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
