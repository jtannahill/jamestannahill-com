// Reading chrome for /thoughts essays: progress bar, header auto-hide on
// scroll-down, copy-link button. External file: the site CSP is script-src
// 'self' with no inline allowance. Re-inits on astro:page-load and tears
// down on astro:before-swap because the header is transition:persist.
(function () {
  var cleanup = null;

  function init() {
    if (cleanup) cleanup();
    var bar = document.querySelector('[data-essay-progress]');
    var article = document.querySelector('article');
    var header = document.querySelector('header');
    if (!bar || !article) {
      if (header) header.classList.remove('hdr-hidden');
      return;
    }
    var lastY = window.scrollY;
    var ticking = false;
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function update() {
      ticking = false;
      var y = window.scrollY;
      var rect = article.getBoundingClientRect();
      var top = rect.top + y;
      var span = article.offsetHeight - window.innerHeight;
      var p = span > 0 ? (y - top) / span : 1;
      p = Math.max(0, Math.min(1, p));
      bar.style.transform = 'scaleX(' + p + ')';

      if (header && !reduced) {
        var down = y > lastY + 4;
        var up = y < lastY - 4;
        if (down && y > 240) header.classList.add('hdr-hidden');
        else if (up || y <= 240) header.classList.remove('hdr-hidden');
      }
      lastY = y;
    }
    function onScroll() {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();

    var copyBtns = Array.prototype.slice.call(document.querySelectorAll('[data-copy-link]'));
    function onCopy(e) {
      var btn = e.currentTarget;
      var url = btn.getAttribute('data-copy-link');
      var done = function () {
        var prev = btn.textContent;
        btn.textContent = 'Copied';
        btn.setAttribute('data-copied', 'true');
        setTimeout(function () { btn.textContent = prev; btn.removeAttribute('data-copied'); }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(done, done);
      } else {
        var ta = document.createElement('textarea');
        ta.value = url; document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); } catch (err) {}
        document.body.removeChild(ta); done();
      }
    }
    copyBtns.forEach(function (b) { b.addEventListener('click', onCopy); });

    cleanup = function () {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      copyBtns.forEach(function (b) { b.removeEventListener('click', onCopy); });
      if (header) header.classList.remove('hdr-hidden');
      cleanup = null;
    };
  }

  document.addEventListener('astro:page-load', init);
  document.addEventListener('astro:before-swap', function () { if (cleanup) cleanup(); });
  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
