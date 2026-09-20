
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

  // --- ぬるりと戻るボタン ---
  var topBtn = document.getElementById('yokai-top-btn');
  if (topBtn) {
    var showThreshold = 480;
    var toggleBtn = function(){
      if (window.scrollY > showThreshold) { topBtn.classList.add('is-visible'); }
      else { topBtn.classList.remove('is-visible'); }
    };
    toggleBtn();
    window.addEventListener('scroll', toggleBtn, {passive:true});

    topBtn.addEventListener('click', function(){
      if (reduce) { window.scrollTo(0,0); return; }
      topBtn.classList.remove('is-nurori');
      // 再生させるため一度リフローを挟む
      void topBtn.offsetWidth;
      topBtn.classList.add('is-nurori');
      var startY = window.scrollY;
      var startTime = null;
      var duration = Math.min(900, Math.max(500, startY * 0.6));
      // 妖怪がすうっと滑るような、ゆっくり滑り出して途中で伸び、最後にすっと収まる緩急
      function easeNurori(t){
        return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2;
      }
      function step(ts){
        if (!startTime) startTime = ts;
        var progress = Math.min((ts - startTime) / duration, 1);
        var eased = easeNurori(progress);
        window.scrollTo(0, Math.round(startY * (1 - eased)));
        if (progress < 1) { requestAnimationFrame(step); }
      }
      requestAnimationFrame(step);
    });
  }

  // --- パララックス演出（江戸のイメージ画像）：transformで動かすので全デバイスで安定動作 ---
  // セクションが画面に入ってから出るまでの間に、画像の上端から下端までを確実に一度は見せる
  var parallaxImgs = document.querySelectorAll('.parallax-img');
  if (parallaxImgs.length) {
    var pTicking = false;
    var updateParallax = function(){
      var winH = window.innerHeight;
      parallaxImgs.forEach(function(img){
        var container = img.parentElement;
        var rect = container.getBoundingClientRect();
        if (rect.bottom < -300 || rect.top > winH + 300) { return; }
        if (reduce) { img.style.transform = 'translateY(0)'; return; }
        // 画像の実際の高さと入れ物の高さの差（＝動かせる範囲）をpxで算出
        var overflowPx = img.offsetHeight - container.offsetHeight;
        var maxOffset = Math.max(overflowPx / 2, 40);
        // セクションが画面下端から現れてから、画面上端を抜けきるまでの進行度（0〜1）
        var totalTravel = winH + rect.height;
        var traveled = winH - rect.top;
        var progress = traveled / totalTravel;
        progress = Math.max(0, Math.min(1, progress));
        // progress 0→1 を、画像の最上部が見える状態→最下部が見える状態へ、そのままリニアに対応させる
        var offset = maxOffset - progress * (maxOffset * 2);
        img.style.transform = 'translateY(' + offset.toFixed(1) + 'px)';
      });
      pTicking = false;
    };
    var onParallaxScroll = function(){
      if (!pTicking) {
        pTicking = true;
        requestAnimationFrame(updateParallax);
      }
    };
    updateParallax();
    window.addEventListener('scroll', onParallaxScroll, {passive:true});
    window.addEventListener('resize', onParallaxScroll, {passive:true});
    window.addEventListener('orientationchange', onParallaxScroll, {passive:true});
    window.addEventListener('load', updateParallax);
  }
});
