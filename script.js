
document.addEventListener('DOMContentLoaded', function(){
  var revealEls = document.querySelectorAll('.reveal');
  revealEls.forEach(function(el, i){
    el.style.transitionDelay = Math.min(i * 35, 420) + 'ms';
  });
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) {
    revealEls.forEach(function(el){ el.classList.add('is-visible'); });
    return;
  }
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, {threshold: 0.08, rootMargin: '0px 0px -30px 0px'});
  revealEls.forEach(function(el){ io.observe(el); });
});
