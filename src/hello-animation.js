export function initHelloAnimation() {
  const overlay = document.getElementById('apple-hello-overlay');
  if (!overlay) return;

  // Ensure overlay is displayed cleanly on page load/refresh
  overlay.style.display = 'flex';
  overlay.classList.remove('dismissing');
  document.body.style.overflow = 'hidden';

  const dismissIntro = () => {
    overlay.classList.add('dismissing');
    document.body.style.overflow = '';

    setTimeout(() => {
      overlay.style.display = 'none';
    }, 750);
  };

  // Allow user tap/click on overlay to dismiss intro immediately on mobile & desktop
  overlay.addEventListener('click', dismissIntro, { once: true });
  overlay.addEventListener('touchstart', dismissIntro, { once: true, passive: true });

  // Hold briefly after official SVG stroke animation finishes (2.5s stroke + 0.3s hold = 2.8s total), then perform signature Apple exit
  setTimeout(() => {
    dismissIntro();
  }, 2800);
}
