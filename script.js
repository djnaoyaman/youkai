
document.addEventListener('DOMContentLoaded', function(){
  var revealEls = document.querySelectorAll('.reveal');
  revealEls.forEach(function(el, i){
    el.style.transitionDelay = Math.min(i * 35, 420) + 'ms';
  });
  var revealTextEls = document.querySelectorAll('.reveal-text');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) {
    revealEls.forEach(function(el){ el.classList.add('is-visible'); });
    revealTextEls.forEach(function(el){ el.classList.add('is-visible'); });
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
  // 段落テキストは、ページ読み込み時の一律ディレイを与えず、
  // スクロールして実際に画面に入ってきたタイミングだけで、少しずつ立ち現れるようにする
  var ioText = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        ioText.unobserve(entry.target);
      }
    });
  }, {threshold: 0.1, rootMargin: '0px 0px -40px 0px'});
  revealTextEls.forEach(function(el){ ioText.observe(el); });

  // --- region-slide：都道府県の地方ブロックが、左右交互から入ってくる演出 ---
  var slideEls = document.querySelectorAll('.region-slide');
  if (slideEls.length) {
    if (reduce || !('IntersectionObserver' in window)) {
      slideEls.forEach(function(el){ el.classList.add('is-visible'); });
    } else {
      var ioSlide = new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            ioSlide.unobserve(entry.target);
          }
        });
      }, {threshold: 0.12, rootMargin: '0px 0px -40px 0px'});
      slideEls.forEach(function(el){ ioSlide.observe(el); });
    }
  }

  // --- タイプライター演出：スクロールで画面に入ったら、1行ずつ実際に打っていく ---
  var twBlocks = document.querySelectorAll('.tw-block');
  if (twBlocks.length) {
    twBlocks.forEach(function(block){
      var lines = Array.prototype.slice.call(block.querySelectorAll('.tw-line'));
      var originals = lines.map(function(el){ return el.innerHTML; });
      if (!reduce) { lines.forEach(function(el){ el.innerHTML = ''; }); }
      block.__twLines = lines;
      block.__twOriginals = originals;
    });
    var runTypewriter = function(block){
      var lines = block.__twLines, originals = block.__twOriginals, li = 0;
      var typeLine = function(){
        if (li >= lines.length) { return; }
        var el = lines[li], html = originals[li], i = 0, built = '';
        var step = function(){
          if (i >= html.length) {
            el.innerHTML = built;
            li++;
            setTimeout(typeLine, 260);
            return;
          }
          if (html[i] === '<') {
            var close = html.indexOf('>', i);
            if (close === -1) { close = html.length - 1; }
            built += html.slice(i, close + 1);
            i = close + 1;
          } else {
            built += html[i];
            i++;
          }
          el.innerHTML = built + '<span class="tw-cursor"></span>';
          setTimeout(step, 26 + Math.random() * 30);
        };
        step();
      };
      typeLine();
    };
    if (reduce || !('IntersectionObserver' in window)) {
      twBlocks.forEach(function(block){
        block.__twLines.forEach(function(el, idx){ el.innerHTML = block.__twOriginals[idx]; });
      });
    } else {
      var ioType = new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          if (entry.isIntersecting) {
            runTypewriter(entry.target);
            ioType.unobserve(entry.target);
          }
        });
      }, {threshold: 0.2, rootMargin: '0px 0px -60px 0px'});
      twBlocks.forEach(function(block){ ioType.observe(block); });
    }
  }

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
