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

    video.muted = true;
    video.setAttribute('playsinline', '');
    if (!video.src) { video.src = video.getAttribute('data-src'); video.load(); }
    section.classList.add('scrub-on');

    var dur = 0, target = 0, pending = false, primed = false;

    function applySeek() {
      if (video.readyState >= 1 && Math.abs(video.currentTime - target) > 0.02) {
        pending = true;
        try { video.currentTime = target; } catch (e) { pending = false; }
      }
    }
    // Chain off 'seeked' so the latest scroll position always lands (Safari drops
    // currentTime writes issued while a seek is already in flight).
    video.addEventListener('seeked', function () {
      pending = false;
      if (Math.abs(video.currentTime - target) > 0.02) applySeek();
    });

    function compute() {
      var rect = section.getBoundingClientRect();
      var total = section.offsetHeight - window.innerHeight;
      var scrolled = Math.min(Math.max(-rect.top, 0), total);
      var p = total > 0 ? scrolled / total : 0;
      target = p * (dur || 0);
      if (!pending) applySeek();
    }

    // Safari won't render frames of a paused video on currentTime change until it
    // has played at least once. Prime with a muted play->pause, then scrub.
    function prime() {
      if (primed) return;
      primed = true;
      var pr = video.play();
      if (pr && pr.then) {
        pr.then(function () { video.pause(); compute(); })
          .catch(function () { compute(); });
      } else {
        try { video.pause(); } catch (e) {}
        compute();
      }
    }

    video.addEventListener('loadedmetadata', function () { dur = video.duration || 0; });
    video.addEventListener('loadeddata', prime, { once: true });
    if (video.readyState >= 2) { dur = video.duration || 0; prime(); }

    window.addEventListener('scroll', compute, { passive: true });
    window.addEventListener('resize', compute, { passive: true });
    listeners = { compute: compute };
  }

  init();
  document.addEventListener('astro:page-load', init);
  document.addEventListener('astro:before-swap', teardown);
})();
