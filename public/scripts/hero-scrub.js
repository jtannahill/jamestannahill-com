// Scroll-scrub hero for the homepage: a clip (picked per page load from the
// video's data-variants) scrubs as you scroll. Runs on desktop AND mobile; only opts out for prefers-reduced-motion
// (no-JS keeps the static skyline photo). External (script-src 'self' CSP).
// Re-inits on astro:page-load and cleans up on astro:before-swap (ClientRouter).
(function () {
  var listeners = null;

  function teardown() {
    if (!listeners) return;
    window.removeEventListener('scroll', listeners.compute);
    window.removeEventListener('resize', listeners.compute);
    document.removeEventListener('touchstart', listeners.prime);
    listeners = null;
  }

  function canScrub() {
    try {
      return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) { return false; }
  }

  function init() {
    var section = document.getElementById('hero');
    var video = document.getElementById('hero-scrub-video');
    // astro:page-load also fires on the first load, right after the direct init()
    // call. A second set-up on the same element would add a second 'seeked'
    // handler that never learns the duration and keeps seeking to 0 against the first.
    if (video && video.__heroScrub) return;
    teardown();
    if (!section || !video) return;
    if (!canScrub()) return; // static skyline photo stays
    video.__heroScrub = true;

    video.muted = true;
    video.setAttribute('playsinline', '');

    // A different clip can come up on each page load (see data-variants in Hero.astro).
    var variants = [];
    try { variants = JSON.parse(video.getAttribute('data-variants') || '[]'); } catch (e) {}
    if (!variants.length) return; // static skyline photo stays
    // ?hero=<name> forces a variant (testing, screenshots).
    var forced = null;
    try { forced = new URLSearchParams(location.search).get('hero'); } catch (e) {}
    var pick = variants.filter(function (v) { return v.name === forced; })[0] ||
      variants[Math.floor(Math.random() * variants.length)];
    video.setAttribute('data-variant', pick.name);
    if (pick.brightness) video.style.filter = 'brightness(' + pick.brightness + ')';
    var start = pick.start || 0;

    // Lighter 720p clip on phones (less data + easier to decode/seek).
    var small = false;
    try { small = window.matchMedia('(max-width: 767px)').matches; } catch (e) {}
    if (!video.src) {
      if (pick.poster) video.poster = pick.poster;
      // The markup says preload=none so nothing downloads before a clip is picked.
      // Once picked, load frames: with preload=none Chrome can stall at metadata,
      // and seeks issued before frame data land back on 0.
      video.preload = 'auto';
      video.src = (small && pick.mobile) || pick.src;
      video.load();
    }
    section.classList.add('scrub-on');

    var dur = 0, target = 0, pending = false, primed = false;

    // Seek only once frame data exists: a seek at HAVE_METADATA aborts the fetch and
    // lands back on 0, and the 'seeked' re-seek below would then loop forever.
    // Until then prime() applies the position when the first frame arrives.
    function applySeek() {
      if (video.readyState >= 2 && Math.abs(video.currentTime - target) > 0.02) {
        pending = true;
        try { video.currentTime = target; } catch (e) { pending = false; }
      }
    }
    // Chain off 'seeked' so the latest scroll position always lands (Safari/iOS
    // drop currentTime writes issued while a seek is already in flight).
    video.addEventListener('seeked', function () {
      pending = false;
      if (Math.abs(video.currentTime - target) > 0.02) applySeek();
    });

    function compute() {
      var rect = section.getBoundingClientRect();
      var total = section.offsetHeight - window.innerHeight;
      var scrolled = Math.min(Math.max(-rect.top, 0), total);
      var p = total > 0 ? scrolled / total : 0;
      target = (start + p * (1 - start)) * (dur || 0);
      if (!pending) applySeek();
    }

    // Safari/iOS won't render frames of a paused video on currentTime change
    // until it has played once. Prime with a muted play->pause. iOS Low Power
    // Mode blocks muted autoplay, so also prime on the first touch (a gesture).
    function prime() {
      if (primed) return;
      primed = true;
      var pr = video.play();
      if (pr && pr.then) {
        pr.then(function () { video.pause(); compute(); })
          .catch(function () { primed = false; compute(); });
      } else {
        try { video.pause(); } catch (e) {}
        compute();
      }
    }

    video.addEventListener('loadedmetadata', function () { dur = video.duration || 0; });
    video.addEventListener('loadeddata', prime, { once: true });
    document.addEventListener('touchstart', prime, { passive: true });
    if (video.readyState >= 2) { dur = video.duration || 0; prime(); }

    // One layout read per frame, not per raw scroll event.
    var queued = false;
    function onScroll() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () { queued = false; compute(); });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    listeners = { compute: onScroll, prime: prime };
  }

  init();
  document.addEventListener('astro:page-load', init);
  document.addEventListener('astro:before-swap', teardown);
})();
