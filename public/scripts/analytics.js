(function () {
  var GA_ID = 'G-WRDEHD4QYL';
  var CLARITY_ID = 'u7pqjnxu1z';

  function loadScript(src, async) {
    var script = document.createElement('script');
    script.src = src;
    if (async) script.async = true;
    document.head.appendChild(script);
    return script;
  }

  window.loadAnalytics = function loadAnalytics() {
    if (window.__analyticsLoaded) return;
    window.__analyticsLoaded = true;

    loadScript('https://www.clarity.ms/tag/' + CLARITY_ID, true);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
    loadScript('https://www.googletagmanager.com/gtag/js?id=' + GA_ID, true).onload = function () {
      window.gtag('js', new Date());
      window.gtag('config', GA_ID);
    };
  };

  window.revokeAnalytics = function revokeAnalytics() {
    document.cookie = '_ga=; Max-Age=0; path=/; domain=.jamestannahill.com';
    document.cookie = '_gid=; Max-Age=0; path=/; domain=.jamestannahill.com';
    document.cookie = '_gat=; Max-Age=0; path=/; domain=.jamestannahill.com';
  };
})();
