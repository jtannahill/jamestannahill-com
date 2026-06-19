(function () {
  if (document.documentElement.dataset.heroPreload === 'done') return;
  document.documentElement.dataset.heroPreload = 'done';

  window.__heroB = Math.random() < 0.5;
  var variant = window.__heroB ? 'skyline' : 'default';
  var avif = variant === 'skyline' ? '/hero-bg-skyline.avif' : '/hero-bg.avif';
  var webp = variant === 'skyline' ? '/hero-bg-skyline.webp' : '/hero-bg.webp';

  function preload(href, type) {
    var link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.type = type;
    link.fetchPriority = 'high';
    link.href = href;
    document.head.appendChild(link);
  }

  var probe = new Image();
  probe.src =
    'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';
  probe.onload = probe.onerror = function () {
    if (probe.width > 0) preload(avif, 'image/avif');
    else preload(webp, 'image/webp');
  };
})();
