import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { AudioEngine } from './audioEngine.js';
import { NoteWheel } from './noteWheel.js';
import { VisionTracker } from './visionTracker.js';
import { Ferrofluid } from './ferrofluid.js';
import { SongBookManager } from './songBook.js';
import { Header } from './components/Header.jsx';

document.addEventListener('DOMContentLoaded', () => {
  const mainCanvas = document.getElementById('mainCanvas');
  const webcamVideo = document.getElementById('webcamVideo');

  const btnStartApp = document.getElementById('btnStartApp');
  const btnLearnMore = document.getElementById('btnLearnMore');
  const startModal = document.getElementById('startModal');
  const ferrofluidContainer = document.getElementById('ferrofluidContainer');
  const songbookDrawer = document.getElementById('songbookDrawer');
  const reactHeaderRoot = document.getElementById('reactHeaderRoot');

  // Audio Engine & Wheel Instances
  const audioEngine = new AudioEngine();
  const noteWheel = new NoteWheel(mainCanvas);

  // App Global State for React Header Sync
  let appState = {
    currentInstrument: 'harmonium',
    isCameraActive: false,
    octave: 4,
    volume: 0.85,
    reverb: 0.35,
    audioStatus: { active: false, text: 'Audio Idle' }
  };

  let reactRootInstance = null;

  function renderReactHeader() {
    if (!reactHeaderRoot) return;
    if (!reactRootInstance) {
      reactRootInstance = ReactDOM.createRoot(reactHeaderRoot);
    }

    reactRootInstance.render(
      <Header
        currentInstrument={appState.currentInstrument}
        onSelectInstrument={(inst) => {
          appState.currentInstrument = inst;
          audioEngine.setInstrument(inst);
          renderReactHeader();
        }}
        isCameraActive={appState.isCameraActive}
        onToggleCamera={async () => {
          audioEngine.init();
          audioEngine.resume();

          if (visionTracker.isRunning) {
            visionTracker.stopCamera();
            appState.isCameraActive = false;
          } else {
            const success = await visionTracker.startCamera();
            appState.isCameraActive = success;
          }
          renderReactHeader();
        }}
        currentOctave={appState.octave}
        onSelectOctave={(oct) => {
          appState.octave = oct;
          audioEngine.setOctave(oct);
          audioEngine.stopAllNotes();
          currentActiveChord = null;
          renderReactHeader();
        }}
        volume={appState.volume}
        onChangeVolume={(vol) => {
          appState.volume = vol;
          audioEngine.setVolume(vol);
          renderReactHeader();
        }}
        reverb={appState.reverb}
        onChangeReverb={(rev) => {
          appState.reverb = rev;
          audioEngine.setReverb(rev);
          renderReactHeader();
        }}
        onToggleSongbook={() => {
          if (songbookDrawer) songbookDrawer.classList.toggle('collapsed');
        }}
        onTestAudio={() => {
          audioEngine.init();
          audioEngine.resume();
          audioEngine.triggerNoteInstant('A', 4, 0.6);
        }}
        audioStatus={appState.audioStatus}
      />
    );
  }

  // Initial React Mount
  renderReactHeader();

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

  // Initialize Songbook Teleprompter
  const songBookManager = new SongBookManager(songbookDrawer, (selectedChordStr) => {
    noteWheel.setHighlightedChord(selectedChordStr);
  });
  songBookManager.render();
  
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

      const newStatus = { active: true, text: `Playing ${currentActiveChord.root} ${qLabel} (Oct ${actualOctave})` };
      if (appState.audioStatus.text !== newStatus.text) {
        appState.audioStatus = newStatus;
        renderReactHeader();
      }
    } else {
      const newStatus = { active: false, text: 'Audio Idle' };
      if (appState.audioStatus.text !== newStatus.text) {
        appState.audioStatus = newStatus;
        renderReactHeader();
      }
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
    appState.isCameraActive = cameraSuccess;
    renderReactHeader();

    renderLoop();
  }

  if (btnStartApp) btnStartApp.addEventListener('click', initApp);
  if (btnLearnMore) btnLearnMore.addEventListener('click', initApp);
});
