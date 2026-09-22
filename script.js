
document.addEventListener('DOMContentLoaded', function(){
  // --- フッターのひとこと：来訪の回数で言葉が変わる ---
  // 妖怪は人につくのではなく場所につくが、このサイトだけは来た人を覚えている。
  (function(){
    var el = document.getElementById('siteCatch');
    if (!el) return;
    var words = [
      '今日から妖怪やる人がうらやましい',
      '今日も妖怪やる人がうらやましい',
      'どうだ！妖怪楽しいだろう！？',
      'あなたの妖怪が知りたい'
    ];
    var n = 1;
    try {
      var key = 'yokai_visits';
      var last = localStorage.getItem('yokai_last_day');
      var today = new Date().toDateString();
      n = parseInt(localStorage.getItem(key) || '0', 10);
      // 同じ日に何ページ見ても1回として数える（回遊で増えないように）
      if (last !== today) {
        n = n + 1;
        localStorage.setItem(key, String(n));
        localStorage.setItem('yokai_last_day', today);
      }
      if (n < 1) n = 1;
    } catch (e) {
      n = 1; // プライベートモード等でlocalStorageが使えない場合は初回の言葉のまま
    }
    var idx = n >= 4 ? 3 : (n - 1);
    el.textContent = words[idx];
  })();

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
  // 注：この要素は初期状態でtransformにより画面外（左右）にずらしてある。
  // IntersectionObserverは見た目上の矩形（transform込み）で交差判定するため、
  // 画面外にずらした状態だと「垂直位置は画面内でも水平にズレていて交差しない」と
  // 判定され続け、発火しなくなってしまう。そのため、ここは垂直位置だけを見る
  // 手動のスクロール判定に切り替えている。
  var slideEls = Array.prototype.slice.call(document.querySelectorAll('.region-slide'));
  if (slideEls.length) {
    if (reduce) {
      slideEls.forEach(function(el){ el.classList.add('is-visible'); });
    } else {
      var checkSlideEls = function(){
        var winH = window.innerHeight;
        slideEls = slideEls.filter(function(el){
          // アコーディオン（.pref-panel-body）の中にある要素は、親がまだ
          // 十分に開いていない（max-heightが要素自身の相対位置に届いていない）
          // 場合、getBoundingClientRectが「クリップされる前の、あたかも
          // 見えているかのような位置」を返してしまうため、そのままでは
          // 画面内と誤判定されてしまう。祖先の実際の開閉状態を先に確認する。
          var panelBody = el.closest('.pref-panel-body');
          if (panelBody) {
            var panelRect = panelBody.getBoundingClientRect();
            var elRect0 = el.getBoundingClientRect();
            // 要素の相対位置（パネル開始点からの距離）が、パネルの実際の
            // 表示高さ（クリップ後）を超えている間は、まだ「実際には見えていない」
            if (elRect0.top - panelRect.top >= panelRect.height) {
              return true; // まだ監視対象として残す
            }
          }
          var rect = el.getBoundingClientRect();
          // 要素の「素の」上端位置は、水平transformの影響を受けない（縦方向のみのオフセットのため）
          if (rect.top < winH - 40 && rect.bottom > 0) {
            el.classList.add('is-visible');
            return false; // 発火済みなので以後の監視対象から外す
          }
          return true;
        });
        if (!slideEls.length) {
          window.removeEventListener('scroll', onSlideScroll);
        }
      };
      var slideTicking = false;
      var onSlideScroll = function(){
        if (!slideTicking) {
          slideTicking = true;
          requestAnimationFrame(function(){ checkSlideEls(); slideTicking = false; });
        }
      };
      checkSlideEls();
      window.addEventListener('scroll', onSlideScroll, {passive:true});
    }
  }

  // --- card-place：カードが一枚一枚、上から置かれるように現れる演出 ---
  // transition-delayをインラインで持たせているので、is-visible付与のタイミングは
  // まとめてでよい（実際の視覚的なズレはCSSのdelayが担う）。
  var flyEls = Array.prototype.slice.call(document.querySelectorAll('.card-place'));
  if (flyEls.length) {
    if (reduce) {
      flyEls.forEach(function(el){ el.classList.add('is-visible'); });
    } else {
      var checkFlyEls = function(){
        var winH = window.innerHeight;
        flyEls = flyEls.filter(function(el){
          var rect = el.getBoundingClientRect();
          if (rect.top < winH - 60 && rect.bottom > 0) {
            el.classList.add('is-visible');
            return false;
          }
          return true;
        });
        if (!flyEls.length) {
          window.removeEventListener('scroll', onFlyScroll);
        }
      };
      var flyTicking = false;
      var onFlyScroll = function(){
        if (!flyTicking) {
          flyTicking = true;
          requestAnimationFrame(function(){ checkFlyEls(); flyTicking = false; });
        }
      };
      checkFlyEls();
      window.addEventListener('scroll', onFlyScroll, {passive:true});
    }
  }

  // --- 都道府県パネル全体を1つのボタンで開閉する ---
  document.querySelectorAll('.pref-panel-toggle').forEach(function(btn){
    var body = btn.nextElementSibling;
    var labelSpan = btn.querySelector('span');
    btn.addEventListener('click', function(){
      var expanded = btn.getAttribute('aria-expanded') === 'true';
      if (expanded) {
        btn.setAttribute('aria-expanded', 'false');
        body.style.maxHeight = '0px';
        labelSpan.textContent = '47都道府県の一覧を開く';
      } else {
        btn.setAttribute('aria-expanded', 'true');
        body.style.maxHeight = body.scrollHeight + 'px';
        labelSpan.textContent = '47都道府県の一覧を閉じる';
        // 注：ここでscrollイベントを発火させて全体を再評価すると、
        // max-height:0で隠れている要素も「レイアウト上の位置」自体は
        // 既に確定しているため（overflow:hiddenは見た目だけを隠す）、
        // ビューポートが広い場合、北陸あたりまで一気に「画面内」と
        // 判定されてしまう。そのため、展開時は最初の1件（北海道）だけを
        // 直接発火させ、残りは実際のスクロールに委ねる。
        var firstSlide = body.querySelector('.region-slide');
        if (firstSlide) firstSlide.classList.add('is-visible');
      }
    });
  });

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
