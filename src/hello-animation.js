export function initHelloAnimation() {
  const overlay = document.getElementById('apple-hello-overlay');
  if (!overlay) return;

  // Force reflow on mobile WebKit to guarantee stroke animation playback on frame 0
  const path = overlay.querySelector('.apple-svg-stroke-path');
  if (path) {
    path.style.animation = 'none';
    void path.offsetWidth; // Trigger browser layout recalculation
    path.style.animation = 'appleHelloStroke 2.2s cubic-bezier(0.65, 0, 0.35, 1) forwards';
  }

  // Ensure overlay is displayed cleanly on page load/refresh
  overlay.style.display = 'flex';
  overlay.classList.remove('dismissing');
  document.body.style.overflow = 'hidden';

  let dismissed = false;
  const dismissIntro = () => {
    if (dismissed) return;
    dismissed = true;
    overlay.classList.add('dismissing');
    document.body.style.overflow = '';

    setTimeout(() => {
      overlay.style.display = 'none';
    }, 750);
  };

  // Allow user tap/click on overlay to dismiss intro immediately on mobile & desktop
  overlay.addEventListener('click', dismissIntro, { once: true });
  overlay.addEventListener('touchstart', dismissIntro, { once: true, passive: true });

  // Hold briefly after stroke completes (2.2s stroke + 0.5s hold = 2.7s total)
  setTimeout(() => {
    dismissIntro();
  }, 2700);
}
