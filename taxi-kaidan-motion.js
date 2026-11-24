/* Kamakura Taxi Kaidan: independent, accessible photo reveal.
 * All content remains visible without JavaScript. Each image animates once.
 */
(function () {
  'use strict';
  if (!('IntersectionObserver' in window) ||
      (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
  var images = document.querySelectorAll(
    '.ktk-feature .ktk-official-logo, .ktk-feature .ktk-card img, ' +
    '.ktk-hub .ktk-official-logo, .ktk-hub .ktk-hub-masthead-photo img, .ktk-hub .ktk-hub-episode img, ' +
    '.ktk-reading .ktk-official-logo, .ktk-reading .ktk-cover img, .ktk-reading .ktk-scene img'
  );
  if (!images.length) return;
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var image = entry.target;
      observer.unobserve(image);
      function reveal() {
        if (image.naturalWidth > 0) image.classList.add('ktk-motion-seen');
      }
      if (image.complete) reveal();
      else image.addEventListener('load', reveal, { once: true });
    });
  }, { rootMargin: '0px 0px 36px 0px', threshold: 0.06 });
  document.documentElement.classList.add('ktk-motion-ready');
  images.forEach(function (image) {
    image.setAttribute('data-ktk-motion', image.classList.contains('ktk-official-logo') ? 'logo' : 'photo');
    observer.observe(image);
  });
})();
