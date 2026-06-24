// Scroll-scrub hero for the homepage: the sunset-to-night clip scrubs as you
// scroll. Progressive enhancement only (desktop, fine pointer, motion allowed);
// otherwise the static skyline photo stays. External (script-src 'self' CSP).
// Re-inits on astro:page-load and cleans up on astro:before-swap (ClientRouter).
(function () {
  var listeners = null;

  function teardown() {
    if (!listeners) return;
    window.removeEventListener('scroll', listeners.compute);
    window.removeEventListener('resize', listeners.compute);
    listeners = null;
  }

  function canScrub() {
    try {
      return !window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
             window.matchMedia('(min-width: 768px)').matches &&
             window.matchMedia('(pointer: fine)').matches;
    } catch (e) { return false; }
  }

  function init() {
    teardown();
    var section = document.getElementById('hero');
    var video = document.getElementById('hero-scrub-video');
    if (!section || !video) return;
    if (!canScrub()) return; // static skyline photo stays

    if (!video.src) { video.src = video.getAttribute('data-src'); video.load(); }
    section.classList.add('scrub-on');

    var dur = 0, target = 0, ticking = false;

    function seek() {
      ticking = false;
      if (video.readyState >= 1 && Math.abs(video.currentTime - target) > 0.02) {
        try { video.currentTime = target; } catch (e) {}
      }
    }
    function compute() {
      var rect = section.getBoundingClientRect();
      var total = section.offsetHeight - window.innerHeight;
      var scrolled = Math.min(Math.max(-rect.top, 0), total);
      var p = total > 0 ? scrolled / total : 0;
      target = p * (dur || 0);
      if (!ticking) { ticking = true; requestAnimationFrame(seek); }
    }

    video.addEventListener('loadedmetadata', function () { dur = video.duration || 0; compute(); });
    if (video.readyState >= 1) { dur = video.duration || 0; }
    window.addEventListener('scroll', compute, { passive: true });
    window.addEventListener('resize', compute, { passive: true });
    listeners = { compute: compute };
    compute();
  }

  init();
  document.addEventListener('astro:page-load', init);
  document.addEventListener('astro:before-swap', teardown);
})();
