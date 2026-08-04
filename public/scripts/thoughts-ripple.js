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

  var RADIUS = 260;   // px of influence around the cursor
  var AMP = 15.0;     // px peak displacement
  var FREQ = 0.032;   // spatial frequency (rad/px); lower = longer, more legible wave
  var SPEED = 3.2;    // temporal frequency (rad/s), same as the hero shader
  var EASE = 0.18;    // per-frame approach toward the target offset

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

  // One instance per [data-ripple-text] block. An essay broken up by subheads
  // and figures has several, so this cannot assume a single root.
  function build(root) {
    var els = root.querySelectorAll('.rw').length
      ? Array.prototype.slice.call(root.querySelectorAll('.rw'))
      : wrapWords(root);
    if (!els.length) return null;

    var inst = {
      root: root,
      words: els.map(function (el) { return { el: el, cx: 0, cy: 0, x: 0, y: 0 }; }),
      mx: -9999,
      my: -9999,
      active: false,
      visible: true,
    };

    inst.measure = function () {
      var rootRect = root.getBoundingClientRect();
      inst.words.forEach(function (w) {
        var r = w.el.getBoundingClientRect();
        w.cx = r.left - rootRect.left + r.width / 2;
        w.cy = r.top - rootRect.top + r.height / 2;
      });
    };
    inst.measure();

    inst.onMove = function (e) {
      var r = root.getBoundingClientRect();
      inst.mx = e.clientX - r.left;
      inst.my = e.clientY - r.top;
      inst.active = true;
    };
    inst.onLeave = function () { inst.active = false; };
    root.addEventListener('mousemove', inst.onMove);
    root.addEventListener('mouseleave', inst.onLeave);

    inst.io = new IntersectionObserver(function (ents) {
      inst.visible = ents[0].isIntersecting;
    }, { threshold: 0 });
    inst.io.observe(root);

    return inst;
  }

  function init() {
    teardown();

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;

    var roots = Array.prototype.slice.call(document.querySelectorAll('[data-ripple-text]'));
    var instances = roots.map(build).filter(Boolean);
    if (!instances.length) return;

    var allWords = instances.reduce(function (acc, i) { return acc.concat(i.words); }, []);

    function measureAll() { instances.forEach(function (i) { i.measure(); }); }
    window.addEventListener('resize', measureAll);

    var start = performance.now();

    function frame(now) {
      state.raf = requestAnimationFrame(frame);
      var t = (now - start) / 1000;

      for (var n = 0; n < instances.length; n++) {
        var inst = instances[n];
        // Blocks scrolled out of view still settle back to rest, so a word is
        // never frozen mid-displacement when it scrolls away.
        var live = inst.visible && inst.active;

        for (var i = 0; i < inst.words.length; i++) {
          var w = inst.words[i];
          var tx = 0, ty = 0;
          if (live) {
            var dx = w.cx - inst.mx, dy = w.cy - inst.my;
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
    }

    state = {
      raf: 0,
      words: allWords,
      cleanup: function () {
        instances.forEach(function (i) {
          i.root.removeEventListener('mousemove', i.onMove);
          i.root.removeEventListener('mouseleave', i.onLeave);
          i.io.disconnect();
        });
        window.removeEventListener('resize', measureAll);
      },
    };
    state.raf = requestAnimationFrame(frame);
  }

  init();
  document.addEventListener('astro:page-load', init);
  document.addEventListener('astro:before-swap', teardown);
})();
