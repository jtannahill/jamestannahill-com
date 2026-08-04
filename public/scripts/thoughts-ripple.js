// Cursor-reactive text ripple for /thoughts/. Mirrors the wave math in
// faq-hero-gl.js (sin(d*k - t*w) * amp * smoothstep(radius, 0, d), displaced
// along the cursor-to-target direction), but applied to word spans via CSS
// transforms instead of a WebGL texture. External file: the site CSP is
// script-src 'self' with no inline allowance.
//
// Opts out on prefers-reduced-motion and on coarse pointers (no hover).
// Re-inits on astro:page-load, tears down on astro:before-swap.
(function () {
  var state = null; // { raf, words, cleanup }

  var RADIUS = 190;   // px of influence around the cursor
  var AMP = 7.0;      // px peak displacement
  var FREQ = 0.055;   // spatial frequency (rad/px)
  var SPEED = 3.2;    // temporal frequency (rad/s), same as the hero shader
  var EASE = 0.14;    // per-frame approach toward the target offset

  function teardown() {
    if (!state) return;
    if (state.raf) cancelAnimationFrame(state.raf);
    state.cleanup();
    state.words.forEach(function (w) { w.el.style.transform = ''; });
    state = null;
  }

  // Wrap every word of every text node under `root` in a positioned span so it
  // can be transformed independently. Existing markup (<em>, <a>) is preserved
  // because we only ever replace text nodes in place.
  function wrapWords(root) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var nodes = [];
    for (var n = walker.nextNode(); n; n = walker.nextNode()) {
      if (n.nodeValue.trim()) nodes.push(n);
    }
    var spans = [];
    nodes.forEach(function (node) {
      var frag = document.createDocumentFragment();
      node.nodeValue.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (!part.trim()) { frag.appendChild(document.createTextNode(part)); return; }
        var s = document.createElement('span');
        s.className = 'rw';
        // Styled here, not in CSS: Astro scopes component <style> blocks to a
        // data-astro-cid-* attribute that these runtime-created spans never
        // carry, so a stylesheet rule would silently never apply. inline-block
        // is what makes a span transformable at all.
        s.style.display = 'inline-block';
        s.style.willChange = 'transform';
        s.textContent = part;
        frag.appendChild(s);
        spans.push(s);
      });
      node.parentNode.replaceChild(frag, node);
    });
    return spans;
  }

  function init() {
    teardown();

    var root = document.querySelector('[data-ripple-text]');
    if (!root) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;

    var els = root.querySelectorAll('.rw').length
      ? Array.prototype.slice.call(root.querySelectorAll('.rw'))
      : wrapWords(root);
    if (!els.length) return;

    var words = els.map(function (el) { return { el: el, cx: 0, cy: 0, x: 0, y: 0 }; });

    function measure() {
      var rootRect = root.getBoundingClientRect();
      words.forEach(function (w) {
        var r = w.el.getBoundingClientRect();
        w.cx = r.left - rootRect.left + r.width / 2;
        w.cy = r.top - rootRect.top + r.height / 2;
      });
    }
    measure();
    window.addEventListener('resize', measure);

    var mx = -9999, my = -9999, active = false;

    function onMove(e) {
      var r = root.getBoundingClientRect();
      mx = e.clientX - r.left;
      my = e.clientY - r.top;
      active = true;
    }
    function onLeave() { active = false; }
    root.addEventListener('mousemove', onMove);
    root.addEventListener('mouseleave', onLeave);

    var visible = true;
    var io = new IntersectionObserver(function (ents) { visible = ents[0].isIntersecting; }, { threshold: 0 });
    io.observe(root);

    var start = performance.now();

    function frame(now) {
      state.raf = requestAnimationFrame(frame);
      if (!visible) return;
      var t = (now - start) / 1000;

      for (var i = 0; i < words.length; i++) {
        var w = words[i];
        var tx = 0, ty = 0;
        if (active) {
          var dx = w.cx - mx, dy = w.cy - my;
          var d = Math.sqrt(dx * dx + dy * dy);
          if (d < RADIUS) {
            // smoothstep(RADIUS, 0, d): full strength at the cursor, zero at the edge
            var u = 1 - d / RADIUS;
            var falloff = u * u * (3 - 2 * u);
            var wave = Math.sin(d * FREQ - t * SPEED) * AMP * falloff;
            var inv = 1 / (d || 1);
            tx = dx * inv * wave;
            ty = dy * inv * wave;
          }
        }
        w.x += (tx - w.x) * EASE;
        w.y += (ty - w.y) * EASE;
        w.el.style.transform =
          Math.abs(w.x) < 0.02 && Math.abs(w.y) < 0.02
            ? ''
            : 'translate3d(' + w.x.toFixed(2) + 'px,' + w.y.toFixed(2) + 'px,0)';
      }
    }

    state = {
      raf: 0,
      words: words,
      cleanup: function () {
        root.removeEventListener('mousemove', onMove);
        root.removeEventListener('mouseleave', onLeave);
        window.removeEventListener('resize', measure);
        io.disconnect();
      },
    };
    state.raf = requestAnimationFrame(frame);
  }

  init();
  document.addEventListener('astro:page-load', init);
  document.addEventListener('astro:before-swap', teardown);
})();
