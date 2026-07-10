import './style.css';
import { CodeCanvasManager } from './bg-canvas.js';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ─── Currency & Pricing Config ────────────────────────────────────────────────
// Prices are fair real-life value equivalents.
// US and UK carry a slight premium (~25%) as requested.
const PRICING = {
  IN: {
    flag: '🇮🇳', label: 'India (₹)',
    startPrice: '₹10,000',
    t1: '₹10,000 – ₹25,000 (Standard Website)',
    t2: '₹25,000 – ₹50,000 (Interactive / 3D Site)',
  },
  US: {
    flag: '🇺🇸', label: 'USA ($)',
    startPrice: '$1,000',
    t1: '$1,000 – $3,000 (Standard Website)',
    t2: '$3,000 – $7,000 (Interactive / 3D Site)',
  },
  GB: {
    flag: '🇬🇧', label: 'UK (£)',
    startPrice: '£800',
    t1: '£800 – £2,500 (Standard Website)',
    t2: '£2,500 – £5,500 (Interactive / 3D Site)',
  },
  EU: {
    flag: '🇪🇺', label: 'Europe (€)',
    startPrice: '€1,200',
    t1: '€1,200 – €3,500 (Standard Website)',
    t2: '€3,500 – €7,000 (Interactive / 3D Site)',
  },
  AU: {
    flag: '🇦🇺', label: 'Australia (A$)',
    startPrice: 'A$1,500',
    t1: 'A$1,500 – A$4,000 (Standard Website)',
    t2: 'A$4,000 – A$8,500 (Interactive / 3D Site)',
  },
  CA: {
    flag: '🇨🇦', label: 'Canada (C$)',
    startPrice: 'C$1,500',
    t1: 'C$1,500 – C$4,000 (Standard Website)',
    t2: 'C$4,000 – C$8,500 (Interactive / 3D Site)',
  },
  AE: {
    flag: '🇦🇪', label: 'UAE (AED)',
    startPrice: 'AED 2,000',
    t1: 'AED 2,000 – AED 5,000 (Standard Website)',
    t2: 'AED 5,000 – AED 10,000 (Interactive / 3D Site)',
  },
  SG: {
    flag: '🇸🇬', label: 'Singapore (S$)',
    startPrice: 'S$2,000',
    t1: 'S$2,000 – S$5,000 (Standard Website)',
    t2: 'S$5,000 – S$9,000 (Interactive / 3D Site)',
  },
};

// ─── Apply selected currency to all dynamic price elements ────────────────────
function applyCurrency(code) {
  const p = PRICING[code];
  if (!p) return;

  // Update starting-price hint in hero
  const startPrice = document.getElementById('start-price');
  if (startPrice) startPrice.textContent = p.startPrice;

  // Update budget dropdown options
  const t1 = document.getElementById('budget-t1');
  const t2 = document.getElementById('budget-t2');
  if (t1) t1.textContent = p.t1;
  if (t2) t2.textContent = p.t2;
}

// ─── Country Selector Logic ───────────────────────────────────────────────────
function initCountrySelector() {
  const selector   = document.getElementById('country-selector');
  const btn        = document.getElementById('country-btn');
  const dropdown   = document.getElementById('country-dropdown');
  const flagEl     = document.getElementById('country-flag');
  const labelEl    = document.getElementById('country-label');
  if (!selector || !btn || !dropdown) return;

  // Open / close dropdown
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = selector.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(isOpen));
  });

  // Close when clicking elsewhere
  document.addEventListener('click', () => {
    selector.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  });

  // Handle country selection
  dropdown.querySelectorAll('li').forEach(li => {
    li.addEventListener('click', () => {
      const code  = li.dataset.code;
      const flag  = li.dataset.flag;
      const label = li.dataset.label;

      // Update button display
      if (flagEl)  flagEl.textContent  = flag;
      if (labelEl) labelEl.textContent = label;

      // Mark active
      dropdown.querySelectorAll('li').forEach(x => x.classList.remove('active'));
      li.classList.add('active');

      // Close dropdown
      selector.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');

      // Apply currency updates across the page
      applyCurrency(code);
    });
  });

  // Mark India as default active
  const defaultLi = dropdown.querySelector('[data-code="IN"]');
  if (defaultLi) defaultLi.classList.add('active');
  applyCurrency('IN');
}

// ─── Main Init ────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

  // 1. Interactive Python Codestream Background
  const canvasManager = new CodeCanvasManager('webgl-canvas');

  // 2. Country / Currency Selector
  initCountrySelector();

  // 3. Brutalist Theme Switching
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const isLight = document.documentElement.classList.toggle('light');
      document.documentElement.classList.toggle('dark', !isLight);
      if (canvasManager) canvasManager.updateTheme(isLight);
    });
  }

  // 4. Canvas Controls — Pause / Scramble
  const pauseBtn    = document.getElementById('pause-stream-btn');
  const scrambleBtn = document.getElementById('scramble-code-btn');

  if (pauseBtn) {
    pauseBtn.addEventListener('click', () => {
      if (canvasManager) {
        canvasManager.togglePause();
        pauseBtn.textContent = canvasManager.isPaused ? 'RESUME ENGINE' : 'PAUSE ENGINE';
      }
    });
  }

  if (scrambleBtn) {
    scrambleBtn.addEventListener('click', () => {
      if (canvasManager) canvasManager.scrambleCode();
    });
  }

  // 5. Custom Cursor (desktop only)
  const cursor = document.getElementById('custom-cursor');
  if (cursor) {
    if (window.innerWidth > 1024) {
      window.addEventListener('mousemove', (e) => {
        cursor.style.left = `${e.clientX}px`;
        cursor.style.top  = `${e.clientY}px`;
      });
      const clickables = document.querySelectorAll(
        'a, button, input, select, textarea, .portfolio-item-card, .testimonial-card, .step-item'
      );
      clickables.forEach(item => {
        item.addEventListener('mouseenter', () => {
          cursor.style.width           = '35px';
          cursor.style.height          = '35px';
          cursor.style.backgroundColor = 'var(--glow-color)';
        });
        item.addEventListener('mouseleave', () => {
          cursor.style.width           = '20px';
          cursor.style.height          = '20px';
          cursor.style.backgroundColor = 'transparent';
        });
      });
    } else {
      cursor.style.display = 'none';
    }
  }

  // 6. Lead Form — Web3Forms + mailto fallback
  const leadForm      = document.getElementById('lead-pipeline-form');
  const formOverlay   = document.getElementById('form-success-overlay');
  const closeOverlay  = document.getElementById('reset-form-btn');
  const submitBtn     = document.getElementById('submit-lead-btn');

  if (leadForm && submitBtn) {
    leadForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'TRANSMITTING...';
      submitBtn.disabled = true;

      const formData = new FormData(leadForm);
      const payload  = Object.fromEntries(formData.entries());

      const isDemo = payload.access_key === 'YOUR_ACCESS_KEY_HERE' || !payload.access_key;

      if (isDemo) {
        console.warn('DEMO MODE: Configure Web3Forms access_key in index.html for live email routing.');
        setTimeout(() => {
          if (formOverlay) formOverlay.classList.remove('hidden');
          leadForm.reset();
          submitBtn.textContent = originalText;
          submitBtn.disabled    = false;
        }, 900);
        return;
      }

      try {
        const res  = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await res.json();

        if (res.ok && json.success) {
          if (formOverlay) formOverlay.classList.remove('hidden');
          leadForm.reset();
        } else {
          throw new Error(json.message || 'Rejected');
        }
      } catch (err) {
        console.error('Web3Forms failed — launching mailto fallback:', err);
        const sub  = encodeURIComponent('NEW WEBSITE INQUIRY — Rishi Saha');
        const body = encodeURIComponent(
          `Name: ${payload.name}\nEmail: ${payload.email}\nBudget: ${payload.budget}\n\n${payload.message}`
        );
        window.location.href = `mailto:saharishi409@gmail.com?subject=${sub}&body=${body}`;
      } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled    = false;
      }
    });
  }

  if (closeOverlay && formOverlay) {
    closeOverlay.addEventListener('click', () => formOverlay.classList.add('hidden'));
  }

  // 7. Footer Terminal Metrics
  const pingEl   = document.getElementById('ping-metric');
  const coordsEl = document.getElementById('coords-metric');

  if (pingEl) {
    setInterval(() => {
      pingEl.textContent = `${Math.floor(Math.random() * 11) + 4} ms`;
    }, 2500);
  }

  if (coordsEl) {
    window.addEventListener('mousemove', (e) => {
      coordsEl.textContent = `${(e.clientX / window.innerWidth).toFixed(3)}, ${(e.clientY / window.innerHeight).toFixed(3)}`;
    });
  }

  // 8. GSAP Scroll-Reveal Animations
  // immediateRender:false prevents GSAP from setting opacity:0 before
  // ScrollTrigger fires — fixes blank sections that are already in viewport on load.
  document.querySelectorAll('.grid-card').forEach(card => {
    gsap.from(card, {
      immediateRender: false,
      scrollTrigger: { trigger: card, start: 'top 90%', toggleActions: 'play none none none' },
      y: 45, opacity: 0, duration: 0.75, ease: 'power2.out',
    });
  });

  document.querySelectorAll('.portfolio-item-card').forEach((item, idx) => {
    gsap.from(item, {
      immediateRender: false,
      scrollTrigger: { trigger: item, start: 'top 92%', toggleActions: 'play none none none' },
      x: idx % 2 === 0 ? -35 : 35, opacity: 0, duration: 0.65, ease: 'power2.out',
    });
  });

  // Refresh after one frame so ScrollTrigger detects elements already on screen
  requestAnimationFrame(() => ScrollTrigger.refresh());
});
