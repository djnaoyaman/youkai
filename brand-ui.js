/* Shared brand and progressively enhanced navigation. No dependency on page effects. */
(function () {
  'use strict';
  var source = document.currentScript.src;
  var loader;
  function dismissLoader() { if (loader) { loader.remove(); loader = null; } }
  // Only an arriving session: never hold up content or replay on internal links/back.
  var firstVisit = true;
  try { firstVisit = !sessionStorage.getItem('youkai-brand-seen'); sessionStorage.setItem('youkai-brand-seen', '1'); } catch (_) {}
  try { if (document.referrer && new URL(document.referrer).pathname.indexOf('/youkai/') === 0 && new URL(document.referrer).origin === location.origin) firstVisit = false; } catch (_) {}
  if (firstVisit && document.readyState !== 'complete') {
    loader = document.createElement('div');
    loader.className = 'brand-loading'; loader.setAttribute('aria-hidden', 'true');
    var logo = document.createElement('img');
    logo.src = new URL('assets/youkai-logo-09.svg', source).href;
    logo.alt = ''; logo.width = 220; logo.height = 220;
    loader.appendChild(logo); document.body.appendChild(loader);
    window.addEventListener('load', dismissLoader, { once: true });
    window.addEventListener('pageshow', dismissLoader, { once: true });
    ['pointerdown', 'keydown', 'scroll'].forEach(function (event) { window.addEventListener(event, dismissLoader, { once: true, passive: true }); });
    setTimeout(dismissLoader, 5000); // Safety only, not a minimum display duration.
  }
  document.addEventListener('DOMContentLoaded', function () {
    var button = document.getElementById('navToggle');
    var drawer = document.getElementById('navDrawer');
    var fallback = document.getElementById('navFallback');
    var overlay = document.getElementById('navOverlay');
    var closeButton = document.getElementById('navClose');
    if (!button || !drawer || !fallback || !overlay || !closeButton) return;
    var opened = false, previousFocus, inertStates = [], scrollY = 0, oldStyle;
    drawer.hidden = true; document.body.appendChild(drawer);
    drawer.setAttribute('role', 'dialog'); drawer.setAttribute('aria-modal', 'true');
    function close(restore) {
      if (!opened) return;
      opened = false; drawer.hidden = true; overlay.hidden = true;
      drawer.classList.remove('is-open'); overlay.classList.remove('is-open');
      button.setAttribute('aria-expanded', 'false'); button.setAttribute('aria-label', 'メニューを開く');
      inertStates.forEach(function (entry) { entry[0].inert = entry[1]; }); inertStates = [];
      document.body.classList.remove('nav-locked', 'nav-hidden');
      document.body.style.position = oldStyle.position; document.body.style.top = oldStyle.top; document.body.style.width = oldStyle.width;
      window.scrollTo(0, scrollY);
      if (restore !== false && previousFocus && previousFocus.isConnected) previousFocus.focus({ preventScroll: true });
    }
    function open() {
      if (opened) return;
      dismissLoader(); opened = true; previousFocus = document.activeElement; scrollY = window.scrollY;
      oldStyle = { position: document.body.style.position, top: document.body.style.top, width: document.body.style.width };
      document.body.style.position = 'fixed'; document.body.style.top = -scrollY + 'px'; document.body.style.width = '100%';
      document.body.classList.add('nav-locked');
      Array.from(document.body.children).forEach(function (el) { if (el !== drawer && el !== overlay && el.tagName !== 'SCRIPT') { inertStates.push([el, el.inert]); el.inert = true; } });
      drawer.hidden = false; overlay.hidden = false;
      drawer.classList.add('is-open'); overlay.classList.add('is-open');
      button.setAttribute('aria-expanded', 'true'); button.setAttribute('aria-label', 'メニューを閉じる');
      closeButton.focus();
    }
    button.addEventListener('click', open);
    closeButton.addEventListener('click', function () { close(); });
    overlay.addEventListener('click', function () { close(); });
    drawer.addEventListener('click', function (event) { if (event.target.closest('a[href]')) close(false); });
    document.addEventListener('keydown', function (event) {
      if (!opened) return;
      if (event.key === 'Escape') { event.preventDefault(); close(); }
      if (event.key === 'Tab') {
        var items = Array.from(drawer.querySelectorAll('a[href], button:not([disabled])')).filter(function (el) { return el.getClientRects().length; });
        var first = items[0], last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    });
    window.addEventListener('pagehide', function () { close(false); });
    fallback.hidden = true; button.classList.add('is-ready'); document.body.classList.add('nav-enhanced');
  });
})();
