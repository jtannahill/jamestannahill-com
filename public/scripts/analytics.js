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
    // A prior reject in this session left the kill switches set. Consent given
    // afterwards has to clear them, or the tag loads and silently sends nothing.
    window.__analyticsRevoked = false;
    window['ga-disable-' + GA_ID] = false;
    if (window.__analyticsLoaded) return;
    window.__analyticsLoaded = true;

    // Clarity is session recording: heavier than gtag and needed by nobody in
    // the first seconds. It waits for idle so GA reporting is not queued behind
    // it, with a timeout so a page that never goes idle still records.
    var idle = window.requestIdleCallback
      ? window.requestIdleCallback.bind(window)
      : function (fn) { return setTimeout(fn, 1200); };
    idle(function () {
      // A reject between scheduling and firing must not still pull the tag in.
      if (window.__analyticsRevoked) return;
      loadScript('https://www.clarity.ms/tag/' + CLARITY_ID, true);
    }, { timeout: 3000 });

    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
    loadScript('https://www.googletagmanager.com/gtag/js?id=' + GA_ID, true).onload = function () {
      window.gtag('js', new Date());
      // page_view is sent by /scripts/tracking.js instead, so that the initial
      // load and every ClientRouter navigation are each counted exactly once.
      window.gtag('config', GA_ID, { send_page_view: false });
      if (typeof window.jtPageView === 'function') window.jtPageView();
      if (typeof window.jtInitTracking === 'function') window.jtInitTracking();
    };
  };

  window.revokeAnalytics = function revokeAnalytics() {
    // Accept-then-reject in one session leaves gtag.js already loaded, so
    // clearing cookies alone would not stop the sending. This flag is read by
    // gtag itself on every hit and suppresses them outright.
    window.__analyticsRevoked = true;
    window['ga-disable-' + GA_ID] = true;
    if (window.clarity) {
      try { window.clarity('consent', false); } catch (_) { /* tag not ready */ }
    }
    ['_ga', '_gid', '_gat', '_ga_' + GA_ID.replace(/^G-/, ''), '_clck', '_clsk'].forEach(function (name) {
      document.cookie = name + '=; Max-Age=0; path=/; domain=.jamestannahill.com';
      document.cookie = name + '=; Max-Age=0; path=/';
    });
  };
})();
