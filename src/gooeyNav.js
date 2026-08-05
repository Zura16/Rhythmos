// React Bits - GooeyNav Liquid Blob Navigation Component Engine
export class GooeyNav {
  constructor(container, options = {}) {
    this.container = container;
    this.items = options.items || [];
    this.activeIndex = options.initialActiveIndex || 0;
    this.particleCount = options.particleCount || 15;
    this.animationTime = options.animationTime || 600;
    this.onSelect = options.onSelect || (() => {});

    this.init();
  }

  init() {
    this.container.innerHTML = `
      <!-- SVG Gooey Filter -->
      <svg class="gooey-svg-filter" style="position: absolute; width: 0; height: 0; pointer-events: none;">
        <defs>
          <filter id="gooey-filter">
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="
              1 0 0 0 0  
              0 1 0 0 0  
              0 0 1 0 0  
              0 0 0 18 -8" result="gooey" />
            <feBlend in="SourceGraphic" in2="gooey" />
          </filter>
        </defs>
      </svg>

      <!-- Gooey Nav Container -->
      <div class="gooey-nav-wrapper">
        <div class="gooey-blob-layer">
          <div class="gooey-indicator" id="gooeyIndicator"></div>
          <div class="gooey-particles-container" id="gooeyParticles"></div>
        </div>

        <ul class="gooey-items-list">
          ${this.items.map((item, idx) => `
            <li class="gooey-nav-item ${idx === this.activeIndex ? 'active' : ''}" data-index="${idx}">
              <button class="gooey-tab-btn" id="${item.id ? item.id : 'tab_' + idx}">
                <span class="tab-label">${item.label}</span>
                ${item.hasDropdown ? '<span class="chevron-icon">▾</span>' : ''}
              </button>

              ${item.hasDropdown ? `
                <div class="gooey-dropdown-popover">
                  ${item.dropdownContent}
                </div>
              ` : ''}
            </li>
          `).join('')}
        </ul>
      </div>
    `;

    this.indicator = this.container.querySelector('#gooeyIndicator');
    this.particlesContainer = this.container.querySelector('#gooeyParticles');

    this.attachEvents();
    this.updateIndicatorPosition();
  }

  attachEvents() {
    const navItems = this.container.querySelectorAll('.gooey-nav-item');

    navItems.forEach((item, idx) => {
      const btn = item.querySelector('.gooey-tab-btn');
      
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Toggle dropdown open/close
        const wasOpen = item.classList.contains('open');

        navItems.forEach(ni => {
          if (ni !== item) ni.classList.remove('open');
        });

        if (this.items[idx].hasDropdown) {
          item.classList.toggle('open');
        }

        this.setActiveIndex(idx);
        this.onSelect(idx, this.items[idx]);
      });
    });

    document.addEventListener('click', () => {
      navItems.forEach(ni => ni.classList.remove('open'));
    });

    window.addEventListener('resize', () => this.updateIndicatorPosition());
  }

  setActiveIndex(index) {
    this.activeIndex = index;
    const navItems = this.container.querySelectorAll('.gooey-nav-item');
    navItems.forEach((ni, i) => {
      if (i === index) ni.classList.add('active');
      else ni.classList.remove('active');
    });

    this.updateIndicatorPosition();
    this.spawnParticles();
  }

  updateIndicatorPosition() {
    const activeItem = this.container.querySelectorAll('.gooey-nav-item')[this.activeIndex];
    if (!activeItem || !this.indicator) return;

    const rect = activeItem.getBoundingClientRect();
    const parentRect = this.container.querySelector('.gooey-nav-wrapper').getBoundingClientRect();

    const left = rect.left - parentRect.left;
    const width = rect.width;

    this.indicator.style.left = `${left}px`;
    this.indicator.style.width = `${width}px`;
  }

  spawnParticles() {
    if (!this.particlesContainer) return;
    this.particlesContainer.innerHTML = '';

    const activeItem = this.container.querySelectorAll('.gooey-nav-item')[this.activeIndex];
    if (!activeItem) return;

    const rect = activeItem.getBoundingClientRect();
    const parentRect = this.container.querySelector('.gooey-nav-wrapper').getBoundingClientRect();
    const centerX = rect.left - parentRect.left + rect.width / 2;
    const centerY = rect.top - parentRect.top + rect.height / 2;

    for (let i = 0; i < this.particleCount; i++) {
      const p = document.createElement('div');
      p.className = 'gooey-particle';
      
      const size = Math.floor(Math.random() * 12) + 8; // 8px - 20px liquid blobs
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * 50 + 20;

      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;

      p.style.width = `${size}px`;
      p.style.height = `${size}px`;
      p.style.left = `${centerX}px`;
      p.style.top = `${centerY}px`;
      p.style.setProperty('--tx', `${tx}px`);
      p.style.setProperty('--ty', `${ty}px`);

      this.particlesContainer.appendChild(p);

      setTimeout(() => p.remove(), this.animationTime);
    }
  }

  updateTabLabel(tabId, newLabel) {
    const tabBtn = this.container.querySelector(`#${tabId}`);
    if (tabBtn) {
      const labelSpan = tabBtn.querySelector('.tab-label');
      if (labelSpan) labelSpan.innerHTML = newLabel;
      this.updateIndicatorPosition();
    }
  }
}
