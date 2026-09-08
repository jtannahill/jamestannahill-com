/**
 * Site-wide GA4 event tracking.
 *
 * One module for every page, so a new page is instrumented the moment it
 * exists rather than when someone remembers to add a listener for it. All
 * binding is idempotent (each element is marked once) because ClientRouter
 * fires astro:page-load on the initial load as well as on every navigation,
 * and a second bind means every event is counted twice.
 *
 * Nothing here loads a vendor script or reads a cookie. gtag only exists once
 * consent has been granted in /scripts/consent.js, and every call is a no-op
 * until then.
 */
(function () {
  var HOST = 'jamestannahill.com';
  var DOWNLOAD = /\.(pdf|csv|zip|xlsx?|docx?|pptx?|mp4|mov|png|jpe?g|webp|svg)(\?|$)/i;
  var SCROLL_MARKS = [25, 50, 75, 90];

  /** Coarse page family, attached to every event so reports segment by it. */
  function pageType() {
    var p = window.location.pathname.replace(/\/index\.html?$/i, '').replace(/\/+$/, '') || '/';
    if (p === '/') return 'home';
    if (p === '/ventures') return 'ventures_index';
    if (p.indexOf('/ventures/') === 0) return 'venture';
    if (p === '/thoughts') return 'thoughts_index';
    if (p.indexOf('/thoughts/') === 0) return 'essay';
    if (p === '/faqs') return 'faqs';
    if (p === '/profile') return 'profile';
    if (p.indexOf('/sigscan') === 0) return 'sigscan';
    if (p === '/privacy' || p === '/terms' || p === '/accessibility') return 'legal';
    return 'other';
  }

  /** Last path segment, which is the venture or essay slug where there is one. */
  function slug() {
    var path = window.location.pathname.replace(/\/index\.html?$/i, '').replace(/\/+$/, '');
    var parts = path.split('/');
    return parts[parts.length - 1] || 'home';
  }

  function track(name, params) {
    if (typeof window.gtag !== 'function') return;
    var payload = { page_type: pageType() };
    for (var k in params) if (Object.prototype.hasOwnProperty.call(params, k)) payload[k] = params[k];
    window.gtag('event', name, payload);
  }
  window.jtTrack = track;

  /**
   * page_view is sent by hand rather than by gtag config, so that a client-side
   * navigation counts and the initial load counts exactly once. Guarding on the
   * path means it does not matter whether analytics loads before or after the
   * first astro:page-load.
   */
  window.jtPageView = function () {
    // Before consent there is no gtag, and the view must not be marked as sent
    // or the real send (from the analytics loader) would be suppressed.
    if (typeof window.gtag !== 'function') return;
    var here = window.location.pathname + window.location.search;
    if (window.__jtLastPageView === here) return;
    window.__jtLastPageView = here;
    track('page_view', {
      page_location: window.location.href,
      page_title: document.title,
      content_slug: slug(),
    });
  };

  function once(el, key) {
    if (el.dataset[key]) return false;
    el.dataset[key] = '1';
    return true;
  }

  /** An image-only link (the App Store badge) is named by its alt text. */
  function label(el) {
    var text = (el.textContent || '').trim().replace(/\s+/g, ' ');
    if (text) return text.slice(0, 80);
    var img = el.querySelector('img[alt]');
    return el.getAttribute('aria-label') || (img && img.getAttribute('alt')) ||
      el.getAttribute('title') || 'unlabelled';
  }

  /** Every link on the page, classified once and tracked by what it actually is. */
  function bindLinks() {
    document.querySelectorAll('a[href]').forEach(function (el) {
      if (!once(el, 'jtLink')) return;
      var href = el.getAttribute('href') || '';
      var url;
      try {
        url = new URL(el.href, window.location.href);
      } catch (_) {
        return;
      }

      el.addEventListener('click', function () {
        if (url.protocol === 'mailto:') {
          track('email_click', { link_label: label(el), address: url.pathname });
          return;
        }
        if (url.protocol === 'tel:') {
          track('phone_click', { link_label: label(el) });
          return;
        }
        if (url.hostname === 'apps.apple.com') {
          track('app_store_click', { link_label: label(el), app_url: url.href, venture: slug() });
          return;
        }
        if (DOWNLOAD.test(url.pathname)) {
          track('file_download', { file_name: url.pathname.split('/').pop(), link_label: label(el) });
          return;
        }
        // Internal is same-host only: art.jamestannahill.com and the rest of
        // the subdomains are separate properties, and a click through to one
        // is an exit from this site.
        if (url.hostname !== window.location.hostname) {
          var venturish = !!el.closest('#ventures') || el.classList.contains('v-visit') ||
            document.body.dataset.pageType === 'venture';
          track(venturish ? 'venture_click' : 'outbound_click', {
            link_label: label(el),
            link_url: url.href,
            link_domain: url.hostname,
          });
          return;
        }

        var path = url.pathname.replace(/\/index\.html?$/i, '').replace(/\/+$/, '');
        if (path.indexOf('/ventures/') === 0) {
          track('venture_page_click', { venture: path.split('/').pop(), link_label: label(el) });
          return;
        }
        if (path.indexOf('/thoughts/') === 0) {
          track('essay_click', { content_slug: path.split('/').pop(), link_label: label(el) });
          return;
        }
        if (path.indexOf('/faqs') === 0 || path === '/profile') {
          track('cta_click', { cta_label: label(el), location: pageType(), destination: path });
        }
      });
    });
  }

  function bindDetails() {
    document.querySelectorAll('details').forEach(function (el) {
      if (!once(el, 'jtDetails')) return;
      el.addEventListener('toggle', function () {
        if (!el.open) return;
        // The question is the heading in the summary; the bare span next to it
        // is the +/- glyph, which is what a naive span lookup returns.
        var q = el.querySelector('summary h2, summary h3, summary h4') || el.querySelector('summary');
        track('faq_open', { question: (q && q.textContent ? q.textContent.trim() : '').slice(0, 60) });
      });
    });
  }

  function bindVideo() {
    document.querySelectorAll('video').forEach(function (v) {
      if (!once(v, 'jtVideo')) return;
      v.addEventListener('play', function () {
        track('video_play', { video_src: v.currentSrc || v.src || 'unknown' });
      }, { once: true });
    });
  }

  /** Depth on every page, plus a read_complete when an essay's foot is reached. */
  function bindEngagement() {
    var marks = SCROLL_MARKS.slice();
    var complete = false;

    function onScroll() {
      // Depth reached before consent is not reported and not consumed; the
      // marks stay armed so they can fire once analytics is actually running.
      if (typeof window.gtag !== 'function') return;
      var doc = document.documentElement;
      var scrollable = doc.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      var pct = ((window.scrollY || doc.scrollTop) / scrollable) * 100;
      while (marks.length && pct >= marks[0]) {
        track('scroll_depth', { percent_scrolled: String(marks.shift()), content_slug: slug() });
      }
      if (!complete && pct >= 92 && pageType() === 'essay') {
        complete = true;
        track('read_complete', { content_slug: slug() });
      }
      if (!marks.length && complete) window.removeEventListener('scroll', onScroll);
    }

    window.removeEventListener('scroll', window.__jtScroll || function () {});
    window.__jtScroll = onScroll;
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /** Intent on the contact form: the first field touched, before any submit. */
  function bindForms() {
    document.querySelectorAll('form').forEach(function (form) {
      if (!once(form, 'jtForm')) return;
      var started = false;
      form.addEventListener('focusin', function (e) {
        if (started) return;
        var t = e.target;
        if (!t || !/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
        started = true;
        track('form_start', { form_id: form.id || 'unnamed' });
      });
    });
  }

  window.jtInitTracking = function () {
    document.body.dataset.pageType = pageType();
    bindLinks();
    bindDetails();
    bindVideo();
    bindForms();
    bindEngagement();
  };
})();
