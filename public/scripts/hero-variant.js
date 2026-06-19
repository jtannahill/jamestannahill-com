(function () {
  var img = document.getElementById('hero-bg-img');
  var avifSource = document.getElementById('hero-bg-avif');
  var webpSource = document.getElementById('hero-bg-webp');
  if (!img || !avifSource || !webpSource) return;

  if (window.__heroB) {
    avifSource.srcset = img.getAttribute('data-bg-b-avif') || '';
    webpSource.srcset = img.getAttribute('data-bg-b-webp') || '';
    img.src = img.getAttribute('data-bg-b-jpg') || img.src;
  }
})();
