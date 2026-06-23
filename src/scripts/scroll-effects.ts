/**
 * INNOVISION — Scroll Effects System
 * Features: Lenis, mask reveal, parallax, section transitions,
 *           custom cursor, marquee velocity, CTA loading
 */

/* ═══════════════════════════════════════
   1. LENIS SMOOTH SCROLL
   ═══════════════════════════════════════ */
let lenisInstance: any = null;

function initLenis() {
  // @ts-expect-error Lenis loaded via CDN
  if (typeof Lenis === 'undefined') return;

  // @ts-expect-error Lenis loaded via CDN
  lenisInstance = new Lenis({
    duration: 1.1,
    easing: (t: number) => Math.min(1, 1 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
  });

  function raf(time: number) {
    lenisInstance.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  // Anchor link interception for Lenis
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const href = (anchor as HTMLAnchorElement).getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        lenisInstance.scrollTo(target, { offset: 0 });
      }
    });
  });

  // Expose for other modules
  (window as any).__lenis = lenisInstance;
}

/* ═══════════════════════════════════════
   2. SCROLL-DRIVEN MASK REVEAL
   ═══════════════════════════════════════ */
function initMaskReveal() {
  const masks = document.querySelectorAll('.mask-reveal');
  if (!masks.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target as HTMLElement;
          const delay = parseInt(el.dataset.maskDelay || '0', 10);
          setTimeout(() => {
            el.classList.add('mask-revealed');
          }, delay);
          observer.unobserve(el);
        }
      });
    },
    { threshold: 0.15 }
  );

  masks.forEach((el) => observer.observe(el));
}

/* ═══════════════════════════════════════
   3. SUBTLE PARALLAX DEPTH
   ═══════════════════════════════════════ */
function initParallax() {
  const layers = document.querySelectorAll('[data-parallax]');
  if (!layers.length) return;

  // Cache section top positions on load/resize
  const positions = new Map<Element, number>();

  function cachePositions() {
    layers.forEach((el) => {
      const rect = (el as HTMLElement).getBoundingClientRect();
      positions.set(el, rect.top + window.scrollY);
    });
  }
  cachePositions();
  window.addEventListener('resize', cachePositions, { passive: true });

  let ticking = false;

  function updateParallax() {
    const scrollY = window.scrollY;
    const wh = window.innerHeight;

    layers.forEach((el) => {
      const htmlEl = el as HTMLElement;
      const speed = parseFloat(htmlEl.dataset.parallax || '0.3');
      const cachedTop = positions.get(el) || 0;

      // Calculate how far through the viewport the element is (0 = below, 1 = above)
      const progress = (scrollY + wh - cachedTop) / (wh + htmlEl.offsetHeight);
      const clampedProgress = Math.max(0, Math.min(1, progress));

      // Offset: subtle shift based on progress, max ~40px
      const offset = (clampedProgress - 0.5) * speed * 80;
      htmlEl.style.transform = `translate3d(0, ${offset}px, 0)`;
    });

    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(updateParallax);
      ticking = true;
    }
  }, { passive: true });
}

/* ═══════════════════════════════════════
   4. SECTION COLOR TRANSITIONS
   ═══════════════════════════════════════ */
function initSectionTransitions() {
  const sections = document.querySelectorAll('.section-transition');
  if (!sections.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const el = entry.target as HTMLElement;
        const ratio = entry.intersectionRatio;

        if (ratio > 0.85) {
          el.classList.add('section-active');
        } else if (ratio < 0.15) {
          el.classList.remove('section-active');
        }
      });
    },
    { threshold: [0, 0.15, 0.5, 0.85, 1] }
  );

  sections.forEach((el) => observer.observe(el));
}

/* ═══════════════════════════════════════
   5. CUSTOM CURSOR WITH MAGNETIC INERTIA
   ═══════════════════════════════════════ */
function initCursor() {
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) return;

  const cursor = document.getElementById('custom-cursor');
  if (!cursor) return;

  let mouseX = 0, mouseY = 0;
  let cursorX = 0, cursorY = 0;
  let magneticOffsetX = 0, magneticOffsetY = 0;
  const speed = 0.12;
  const interactives = 'a, button, [data-cursor-magnetic], .nav__link, .work__module, .services__item, .contact__item';

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  }, { passive: true });

  document.addEventListener('mouseover', (e) => {
    const target = (e.target as HTMLElement).closest(interactives);
    if (target) {
      cursor.classList.add('cursor-hover');

      // Calculate magnetic offset toward element center (temporary, not permanent)
      const rect = target.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      magneticOffsetX = (centerX - mouseX) * 0.2;
      magneticOffsetY = (centerY - mouseY) * 0.2;
    }
  });

  document.addEventListener('mouseout', (e) => {
    const target = (e.target as HTMLElement).closest(interactives);
    if (target) {
      cursor.classList.remove('cursor-hover');
      magneticOffsetX = 0;
      magneticOffsetY = 0;
    }
  });

  function animate() {
    const targetX = mouseX + magneticOffsetX;
    const targetY = mouseY + magneticOffsetY;
    cursorX += (targetX - cursorX) * speed;
    cursorY += (targetY - cursorY) * speed;
    cursor.style.transform = `translate3d(${cursorX - 8}px, ${cursorY - 8}px, 0)`;
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
}


/* ═══════════════════════════════════════
   7. CTA LOADING FEEDBACK
   ═══════════════════════════════════════ */
function initCTALoading() {
  const ctas = document.querySelectorAll('.cta-loading');

  ctas.forEach((cta) => {
    cta.addEventListener('click', (e) => {
      const el = cta as HTMLElement;
      if (el.classList.contains('cta-loading-active')) return;

      e.preventDefault();
      el.classList.add('cta-loading-active');

      const bar = document.createElement('span');
      bar.className = 'cta-loading-bar';
      el.appendChild(bar);

      requestAnimationFrame(() => {
        bar.style.width = '100%';
      });

      setTimeout(() => {
        el.classList.remove('cta-loading-active');
        bar.remove();

        const href = el.getAttribute('href');
        if (href && href.startsWith('#')) {
          const target = document.querySelector(href);
          if (target && lenisInstance) {
            lenisInstance.scrollTo(target, { offset: 0 });
          } else if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        } else if (href) {
          window.location.href = href;
        }
      }, 300);
    });
  });
}

/* ═══════════════════════════════════════
   INIT ALL
   ═══════════════════════════════════════ */
function initScrollEffects() {
  initLenis();
  initMaskReveal();
  initParallax();
  initSectionTransitions();
  initCursor();
  initCTALoading();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initScrollEffects);
} else {
  initScrollEffects();
}
