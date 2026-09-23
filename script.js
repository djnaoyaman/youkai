document.addEventListener('DOMContentLoaded', function(){
(function(){
var el = document.getElementById('siteCatch');
if (!el) return;
var words = [
'今日から妖怪やる人がうらやましい',
'今日も妖怪やる人が微笑ましい',
'どうだ！妖怪楽しいだろう！？',
'あなたの妖怪もしりたい！',
'一緒に妖怪を語らおう！'
];
var n = 1;
try {
var key = 'yokai_visits';
var last = localStorage.getItem('yokai_last_day');
var today = new Date().toDateString();
n = parseInt(localStorage.getItem(key) || '0', 10);
if (last !== today) {
n = n + 1;
localStorage.setItem(key, String(n));
localStorage.setItem('yokai_last_day', today);
}
if (n < 1) n = 1;
} catch (e) {
n = 1; // プライベートモード等でlocalStorageが使えない場合は初回の言葉のまま
}
var idx = n >= words.length ? words.length - 1 : (n - 1);
el.textContent = words[idx];
})();
var revealEls = document.querySelectorAll('.reveal');
revealEls.forEach(function(el, i){
el.style.transitionDelay = Math.min(i * 35, 420) + 'ms';
});
var ledeEl = document.querySelector('body.creative-work .record-lede');
if (ledeEl) ledeEl.classList.add('reveal-text');
var creativeParas = document.querySelectorAll('body.creative-work .record-body .reveal-text');
creativeParas.forEach(function(el, i){
el.style.transitionDelay = Math.min(i * 90, 540) + 'ms';
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
var ioText = new IntersectionObserver(function(entries){
entries.forEach(function(entry){
if (entry.isIntersecting) {
entry.target.classList.add('is-visible');
ioText.unobserve(entry.target);
}
});
}, {threshold: 0.1, rootMargin: '0px 0px -40px 0px'});
revealTextEls.forEach(function(el){ ioText.observe(el); });
var slideEls = Array.prototype.slice.call(document.querySelectorAll('.region-slide'));
if (slideEls.length) {
if (reduce) {
slideEls.forEach(function(el){ el.classList.add('is-visible'); });
} else {
var checkSlideEls = function(){
var winH = window.innerHeight;
slideEls = slideEls.filter(function(el){
var panelBody = el.closest('.pref-panel-body');
if (panelBody) {
var panelRect = panelBody.getBoundingClientRect();
var elRect0 = el.getBoundingClientRect();
if (elRect0.top - panelRect.top >= panelRect.height) {
return true; // まだ監視対象として残す
}
}
var rect = el.getBoundingClientRect();
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
var firstSlide = body.querySelector('.region-slide');
if (firstSlide) firstSlide.classList.add('is-visible');
}
});
});
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
void topBtn.offsetWidth;
topBtn.classList.add('is-nurori');
var startY = window.scrollY;
var startTime = null;
var duration = Math.min(900, Math.max(500, startY * 0.6));
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
var overflowPx = img.offsetHeight - container.offsetHeight;
var maxOffset = Math.max(overflowPx / 2, 40);
var totalTravel = winH + rect.height;
var traveled = winH - rect.top;
var progress = traveled / totalTravel;
progress = Math.max(0, Math.min(1, progress));
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