(function () {
  var STORAGE_KEY = 'jt_analytics_consent';
  var COUNTRY_KEY = 'jt_country';
  // Long enough that a returning EU reader gets the banner without waiting on
  // the lookup, short enough that someone who moves is re-checked before long.
  var COUNTRY_TTL = 7 * 24 * 60 * 60 * 1000;
  var banner = document.getElementById('consent-banner');
  if (!banner) return;

  var acceptBtn = document.getElementById('consent-accept');
  var rejectBtn = document.getElementById('consent-reject');

  var EU = new Set([
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT',
    'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'IS', 'LI', 'NO',
    'GB', 'UK', 'CH',
  ]);

  function hideBanner() {
    banner.hidden = true;
    banner.setAttribute('aria-hidden', 'true');
  }

  function showBanner() {
    banner.hidden = false;
    banner.setAttribute('aria-hidden', 'false');
  }

  function persist(value) {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch (_) {
      /* private browsing */
    }
  }

  function read() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (_) {
      return null;
    }
  }

  function accept() {
    persist('accepted');
    hideBanner();
    if (typeof window.loadAnalytics === 'function') window.loadAnalytics();
  }

  function reject() {
    persist('rejected');
    hideBanner();
    if (typeof window.revokeAnalytics === 'function') window.revokeAnalytics();
  }

  function requiresConsent(country) {
    // XX is Cloudflare's "unknown": treat it like a failed lookup.
    if (!country || country === 'XX') return true;
    return EU.has(country.toUpperCase());
  }

  /** Cached country, or null when absent, unreadable or past its TTL. */
  function readCountry() {
    try {
      var raw = localStorage.getItem(COUNTRY_KEY);
      if (!raw) return null;
      var entry = JSON.parse(raw);
      if (!entry || !entry.loc || Date.now() - entry.at > COUNTRY_TTL) return null;
      return entry.loc;
    } catch (_) {
      return null;
    }
  }

  function writeCountry(loc) {
    if (!loc) return;
    try {
      localStorage.setItem(COUNTRY_KEY, JSON.stringify({ loc: loc, at: Date.now() }));
    } catch (_) {
      /* private browsing */
    }
  }

  function fetchCountry() {
    return fetch('/cdn-cgi/trace', { credentials: 'same-origin' })
      .then(function (res) { return res.text(); })
      .then(function (body) {
        var match = body.match(/loc=([A-Z]{2})/);
        return match ? match[1] : null;
      })
      .catch(function () { return null; });
  }

  /** Apply a country: EU gets the banner, everywhere else loads straight away. */
  function applyCountry(country) {
    if (requiresConsent(country)) {
      showBanner();
      return;
    }
    hideBanner();
    if (typeof window.loadAnalytics === 'function') window.loadAnalytics();
  }

  function detectCountry() {
    var cached = readCountry();
    // The cache may only ever show the banner sooner. A cached non-EU country
    // does not load analytics on its own: the reader may have moved into the
    // EU since, and a request already sent to Google or Clarity cannot be
    // recalled. So that case waits for the fresh lookup like a first visit.
    if (cached && requiresConsent(cached)) {
      applyCountry(cached);
      fetchCountry().then(function (fresh) {
        if (!fresh) return;
        writeCountry(fresh);
        // Moved out of the EU and still undecided: no banner needed.
        if (!requiresConsent(fresh) && read() === null) applyCountry(fresh);
      });
      return null;
    }
    return fetchCountry().then(function (loc) {
      writeCountry(loc);
      return loc;
    });
  }

  acceptBtn?.addEventListener('click', accept);
  rejectBtn?.addEventListener('click', reject);

  var stored = read();
  if (stored === 'accepted') {
    hideBanner();
    if (typeof window.loadAnalytics === 'function') window.loadAnalytics();
    return;
  }
  if (stored === 'rejected') {
    hideBanner();
    return;
  }

  // Null means the cache already answered and applied it synchronously.
  var pending = detectCountry();
  if (pending) pending.then(applyCountry);
})();
