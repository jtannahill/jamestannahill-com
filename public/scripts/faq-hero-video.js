// Respect prefers-reduced-motion for the FAQ hero video. External (not inline)
// so it satisfies the strict `script-src 'self'` CSP. Runs on initial load and
// on every ClientRouter navigation via astro:page-load.
function initFaqHeroVideo() {
  var vid = document.getElementById('faq-hero-video');
  if (!vid) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    vid.removeAttribute('autoplay');
    vid.pause();
    return;
  }
  vid.play().catch(function () {});
}

initFaqHeroVideo();
document.addEventListener('astro:page-load', initFaqHeroVideo);
