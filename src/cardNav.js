// CardNav Component Engine - Inspired by React Bits CardNav
export class CardNav {
  constructor(containerElement, options = {}) {
    this.container = containerElement;
    this.options = {
      baseColor: '#FFFFFF',
      menuColor: '#000000',
      buttonBgColor: '#111111',
      buttonTextColor: '#FFFFFF',
      currentInstrument: 'harmonium',
      currentOctave: 4,
      ...options
    };

    this.isOpen = false;
    this.onInstrumentChange = options.onInstrumentChange || null;
    this.onOctaveChange = options.onOctaveChange || null;
    this.onVolumeChange = options.onVolumeChange || null;
    this.onReverbChange = options.onReverbChange || null;
    this.onCameraToggle = options.onCameraToggle || null;
    this.onTestAudio = options.onTestAudio || null;
    this.onSongbookToggle = options.onSongbookToggle || null;

    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="card-nav-wrapper ${this.isOpen ? 'open' : ''}" id="cardNavWrapper">
        
        <!-- Header Top Bar (Collapsed & Expanded Bar) -->
        <div class="card-nav-topbar">
          <!-- Left: Hamburger / Close Toggle Button -->
          <button id="cardNavToggleBtn" class="card-nav-icon-btn" aria-label="Toggle Navigation Menu">
            <span class="hamburger-line top-line"></span>
            <span class="hamburger-line bottom-line"></span>
          </button>

          <!-- Center: Brand Calligraphic Logo (No Music Emoji) -->
          <div class="card-nav-brand">
            <span class="brand-logo-text">Rhythmos</span>
          </div>

          <!-- Right: CTA Button -->
          <div class="card-nav-right-actions">
            <button id="cardNavSongbookBtn" class="card-nav-cta-btn">
              🎤 Songbook
            </button>
          </div>
        </div>

        <!-- Expanded Cards Panel Grid -->
        <div class="card-nav-panel">
          <div class="card-nav-overflow">
            <div class="card-nav-grid">
              
              <!-- Card 1: Instruments -->
              <div class="card-nav-box" style="background-color: #1B1722;">
                <h3 class="card-box-title">Instruments</h3>
                <ul class="card-box-links">
                  <li>
                    <button class="card-inst-item ${this.options.currentInstrument === 'harmonium' ? 'active' : ''}" data-inst="harmonium">
                      <span class="link-arrow">↗</span> 🪗 Harmonium
                    </button>
                  </li>
                  <li>
                    <button class="card-inst-item ${this.options.currentInstrument === 'piano' ? 'active' : ''}" data-inst="piano">
                      <span class="link-arrow">↗</span> 🎹 Grand Piano
                    </button>
                  </li>
                  <li>
                    <button class="card-inst-item ${this.options.currentInstrument === 'guitar' ? 'active' : ''}" data-inst="guitar">
                      <span class="link-arrow">↗</span> 🎸 Nylon Guitar
                    </button>
                  </li>
                  <li>
                    <button class="card-inst-item ${this.options.currentInstrument === 'strings' ? 'active' : ''}" data-inst="strings">
                      <span class="link-arrow">↗</span> 🎻 Symphonic Strings
                    </button>
                  </li>
                  <li>
                    <button class="card-inst-item ${this.options.currentInstrument === 'marimba' ? 'active' : ''}" data-inst="marimba">
                      <span class="link-arrow">↗</span> 🪵 Concert Marimba
                    </button>
                  </li>
                  <li>
                    <button class="card-inst-item ${this.options.currentInstrument === 'rhodes' ? 'active' : ''}" data-inst="rhodes">
                      <span class="link-arrow">↗</span> ⚡ Vintage Rhodes
                    </button>
                  </li>
                  <li>
                    <button class="card-inst-item ${this.options.currentInstrument === 'organ' ? 'active' : ''}" data-inst="organ">
                      <span class="link-arrow">↗</span> ⛪ Church Organ
                    </button>
                  </li>
                </ul>
              </div>

              <!-- Card 2: Pitch & Vision -->
              <div class="card-nav-box" style="background-color: #2F293A;">
                <h3 class="card-box-title">Pitch & Vision</h3>
                <div class="card-box-section">
                  <label class="card-section-label">Octave Pitch Range</label>
                  <div class="card-octave-bar">
                    <button class="card-oct-btn ${this.options.currentOctave === 2 ? 'active' : ''}" data-octave="2">2</button>
                    <button class="card-oct-btn ${this.options.currentOctave === 3 ? 'active' : ''}" data-octave="3">3</button>
                    <button class="card-oct-btn ${this.options.currentOctave === 4 ? 'active' : ''}" data-octave="4">4</button>
                    <button class="card-oct-btn ${this.options.currentOctave === 5 ? 'active' : ''}" data-octave="5">5</button>
                    <button class="card-oct-btn ${this.options.currentOctave === 6 ? 'active' : ''}" data-octave="6">6</button>
                  </div>
                </div>

                <div class="card-box-section" style="margin-top: 1.25rem;">
                  <label class="card-section-label">Gesture Camera</label>
                  <button id="cardBtnCamera" class="card-btn-primary">
                    <span>📹</span> Start Camera
                  </button>
                  <div class="card-badge" id="cardCameraBadge" style="margin-top: 0.5rem;">
                    <span class="badge-dot" id="cardCameraDot"></span>
                    <span id="cardCameraStatusText">Camera Off</span>
                  </div>
                </div>
              </div>

              <!-- Card 3: Sound Mix -->
              <div class="card-nav-box" style="background-color: #2F293A;">
                <h3 class="card-box-title">Sound Mix</h3>
                <div class="card-box-section">
                  <div class="card-control-label">
                    <span>Master Volume</span>
                    <span id="cardVolVal">85%</span>
                  </div>
                  <input type="range" id="cardVolSlider" min="0" max="100" value="85">
                </div>

                <div class="card-box-section" style="margin-top: 1rem;">
                  <div class="card-control-label">
                    <span>Concert Reverb</span>
                    <span id="cardRevVal">35%</span>
                  </div>
                  <input type="range" id="cardRevSlider" min="0" max="100" value="35">
                </div>

                <div class="card-box-section" style="margin-top: 1.25rem;">
                  <button id="cardBtnTestAudio" class="card-btn-secondary">
                    <span>🔔</span> Test Note
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    `;

    this.attachEvents();
  }

  attachEvents() {
    const toggleBtn = this.container.querySelector('#cardNavToggleBtn');
    const wrapper = this.container.querySelector('#cardNavWrapper');
    const songbookBtn = this.container.querySelector('#cardNavSongbookBtn');
    const btnCamera = this.container.querySelector('#cardBtnCamera');
    const btnTestAudio = this.container.querySelector('#cardBtnTestAudio');
    const volSlider = this.container.querySelector('#cardVolSlider');
    const volVal = this.container.querySelector('#cardVolVal');
    const revSlider = this.container.querySelector('#cardRevSlider');
    const revVal = this.container.querySelector('#cardRevVal');

    toggleBtn.addEventListener('click', () => {
      this.isOpen = !this.isOpen;
      wrapper.classList.toggle('open', this.isOpen);
    });

    if (songbookBtn) {
      songbookBtn.addEventListener('click', () => {
        if (this.onSongbookToggle) this.onSongbookToggle();
      });
    }

    // Instrument Items Selection
    this.container.querySelectorAll('.card-inst-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const inst = e.currentTarget.getAttribute('data-inst');
        this.options.currentInstrument = inst;
        
        this.container.querySelectorAll('.card-inst-item').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');

        if (this.onInstrumentChange) this.onInstrumentChange(inst);
      });
    });

    // Octave Selection
    this.container.querySelectorAll('.card-oct-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const oct = parseInt(e.currentTarget.getAttribute('data-octave'), 10);
        this.options.currentOctave = oct;

        this.container.querySelectorAll('.card-oct-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');

        if (this.onOctaveChange) this.onOctaveChange(oct);
      });
    });

    if (btnCamera) {
      btnCamera.addEventListener('click', () => {
        if (this.onCameraToggle) this.onCameraToggle();
      });
    }

    if (btnTestAudio) {
      btnTestAudio.addEventListener('click', () => {
        if (this.onTestAudio) this.onTestAudio();
      });
    }

    if (volSlider) {
      volSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        volVal.textContent = `${val}%`;
        if (this.onVolumeChange) this.onVolumeChange(val / 100);
      });
    }

    if (revSlider) {
      revSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        revVal.textContent = `${val}%`;
        if (this.onReverbChange) this.onReverbChange(val / 100);
      });
    }
  }

  updateCameraUI(active) {
    const btnCamera = this.container.querySelector('#cardBtnCamera');
    const dot = this.container.querySelector('#cardCameraDot');
    const text = this.container.querySelector('#cardCameraStatusText');

    if (!btnCamera || !dot || !text) return;

    if (active) {
      dot.classList.add('active');
      text.textContent = 'Vision Active';
      btnCamera.innerHTML = '<span>⏹️</span> Stop Camera';
    } else {
      dot.classList.remove('active');
      text.textContent = 'Camera Off';
      btnCamera.innerHTML = '<span>📹</span> Start Camera';
    }
  }
}
