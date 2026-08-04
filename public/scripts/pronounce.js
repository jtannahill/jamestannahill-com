// Pronunciation button for /thoughts/. Plays the sibling <audio> clip named by
// the button's data-pronounce attribute. External file: the site CSP is
// script-src 'self' with no inline allowance. Re-binds on astro:page-load.
(function () {
  function init() {
    document.querySelectorAll('[data-pronounce]').forEach(function (btn) {
      if (btn.dataset.bound) return;
      btn.dataset.bound = '1';

      var audio = document.getElementById(btn.getAttribute('data-pronounce'));
      if (!audio) return;

      btn.addEventListener('click', function () {
        // Restart on repeat clicks rather than ignoring them while playing.
        audio.currentTime = 0;
        var p = audio.play();
        if (p && p.catch) p.catch(function () {});
      });

      audio.addEventListener('play', function () { btn.classList.add('is-playing'); });
      audio.addEventListener('ended', function () { btn.classList.remove('is-playing'); });
      audio.addEventListener('pause', function () { btn.classList.remove('is-playing'); });
    });
  }

  init();
  document.addEventListener('astro:page-load', init);
})();
