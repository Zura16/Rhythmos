// PillNav GSAP Liquid Animation Engine
export class PillNav {
  constructor(container, options = {}) {
    this.container = container;
    this.options = Object.assign({
      ease: 'power3.easeOut',
      baseColor: '#0F172A',
      pillColor: '#E2E8F0',
      hoveredPillTextColor: '#FFFFFF',
      pillTextColor: '#0F172A',
      initialLoadAnimation: true
    }, options);

    this.circleRefs = [];
    this.tlRefs = [];
    this.activeTweenRefs = [];
    this.isMobileMenuOpen = false;

    this.init();
  }

  get gsap() {
    return window.gsap || null;
  }

  init() {
    this.layout();

    window.addEventListener('resize', () => this.layout());
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => this.layout()).catch(() => {});
    }

    this.bindEvents();

    if (this.options.initialLoadAnimation && this.gsap) {
      const logo = this.container.querySelector('.pill-logo');
      const navItems = this.container.querySelector('.pill-nav-items');

      if (logo) {
        this.gsap.set(logo, { scale: 0 });
        this.gsap.to(logo, { scale: 1, duration: 0.6, ease: this.options.ease });
      }

      if (navItems) {
        this.gsap.set(navItems, { width: 0, overflow: 'hidden' });
        this.gsap.to(navItems, { width: 'auto', duration: 0.6, ease: this.options.ease });
      }
    }
  }

  layout() {
    const circles = this.container.querySelectorAll('.hover-circle');
    this.circleRefs = Array.from(circles);

    this.circleRefs.forEach((circle, index) => {
      if (!circle?.parentElement) return;

      const pill = circle.parentElement;
      const rect = pill.getBoundingClientRect();
      const { width: w, height: h } = rect;
      if (w === 0 || h === 0) return;

      const R = ((w * w) / 4 + h * h) / (2 * h);
      const D = Math.ceil(2 * R) + 2;
      const delta = Math.ceil(R - Math.sqrt(Math.max(0, R * R - (w * w) / 4))) + 1;
      const originY = D - delta;

      circle.style.width = `${D}px`;
      circle.style.height = `${D}px`;
      circle.style.bottom = `-${delta}px`;

      if (this.gsap) {
        this.gsap.set(circle, {
          xPercent: -50,
          scale: 0,
          transformOrigin: `50% ${originY}px`
        });

        const label = pill.querySelector('.pill-label');
        const white = pill.querySelector('.pill-label-hover');

        if (label) this.gsap.set(label, { y: 0 });
        if (white) this.gsap.set(white, { y: h + 12, opacity: 0 });

        this.tlRefs[index]?.kill();
        const tl = this.gsap.timeline({ paused: true });

        tl.to(circle, { scale: 1.2, xPercent: -50, duration: 2, ease: this.options.ease, overwrite: 'auto' }, 0);

        if (label) {
          tl.to(label, { y: -(h + 8), duration: 2, ease: this.options.ease, overwrite: 'auto' }, 0);
        }

        if (white) {
          this.gsap.set(white, { y: Math.ceil(h + 100), opacity: 0 });
          tl.to(white, { y: 0, opacity: 1, duration: 2, ease: this.options.ease, overwrite: 'auto' }, 0);
        }

        this.tlRefs[index] = tl;
      }
    });
  }

  bindEvents() {
    const pills = this.container.querySelectorAll('.pill');
    pills.forEach((pill, i) => {
      pill.addEventListener('mouseenter', () => this.handleEnter(i));
      pill.addEventListener('mouseleave', () => this.handleLeave(i));
    });

    const logo = this.container.querySelector('.pill-logo');
    if (logo) {
      logo.addEventListener('mouseenter', () => this.handleLogoEnter(logo));
    }

    const hamburger = this.container.querySelector('.mobile-menu-button');
    if (hamburger) {
      hamburger.addEventListener('click', () => this.toggleMobileMenu());
    }
  }

  handleEnter(i) {
    const tl = this.tlRefs[i];
    if (!tl) return;
    this.activeTweenRefs[i]?.kill();
    this.activeTweenRefs[i] = tl.tweenTo(tl.duration(), {
      duration: 0.3,
      ease: this.options.ease,
      overwrite: 'auto'
    });
  }

  handleLeave(i) {
    const tl = this.tlRefs[i];
    if (!tl) return;
    this.activeTweenRefs[i]?.kill();
    this.activeTweenRefs[i] = tl.tweenTo(0, {
      duration: 0.2,
      ease: this.options.ease,
      overwrite: 'auto'
    });
  }

  handleLogoEnter(logo) {
    if (!this.gsap) return;
    const icon = logo.querySelector('.pill-logo-icon') || logo;
    this.gsap.set(icon, { rotate: 0 });
    this.gsap.to(icon, {
      rotate: 360,
      duration: 0.35,
      ease: this.options.ease,
      overwrite: 'auto'
    });
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    const hamburger = this.container.querySelector('.mobile-menu-button');
    const menu = this.container.querySelector('.mobile-menu-popover');

    if (hamburger && this.gsap) {
      const lines = hamburger.querySelectorAll('.hamburger-line');
      if (this.isMobileMenuOpen) {
        this.gsap.to(lines[0], { rotation: 45, y: 3, duration: 0.3, ease: this.options.ease });
        this.gsap.to(lines[1], { rotation: -45, y: -3, duration: 0.3, ease: this.options.ease });
      } else {
        this.gsap.to(lines[0], { rotation: 0, y: 0, duration: 0.3, ease: this.options.ease });
        this.gsap.to(lines[1], { rotation: 0, y: 0, duration: 0.3, ease: this.options.ease });
      }
    }

    if (menu && this.gsap) {
      if (this.isMobileMenuOpen) {
        this.gsap.set(menu, { visibility: 'visible' });
        this.gsap.fromTo(
          menu,
          { opacity: 0, y: 10 },
          {
            opacity: 1,
            y: 0,
            duration: 0.3,
            ease: this.options.ease,
            transformOrigin: 'top center'
          }
        );
      } else {
        this.gsap.to(menu, {
          opacity: 0,
          y: 10,
          duration: 0.2,
          ease: this.options.ease,
          transformOrigin: 'top center',
          onComplete: () => {
            this.gsap.set(menu, { visibility: 'hidden' });
          }
        });
      }
    }
  }
}
